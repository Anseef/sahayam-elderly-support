import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import * as Location from 'expo-location';

import * as FileSystem from 'expo-file-system/legacy'; 

export default function AddServiceScreen({ navigation }) {
  const [inputMode, setInputMode] = useState('text'); 
  const [recording, setRecording] = useState(null);       
  const [voiceFile, setVoiceFile] = useState(null);       
  const [isRecording, setIsRecording] = useState(false); 
  const [sound, setSound] = useState(null);               
  
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  
  const [date, setDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateText, setDateText] = useState(''); 

  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'groceries', label: 'Groceries', icon: 'shopping-basket' },
    { id: 'medicine', label: 'Medicine', icon: 'first-aid' },
    { id: 'health', label: 'Health', icon: 'heartbeat' },
    { id: 'transport', label: 'Transport', icon: 'car' },
    { id: 'utility', label: 'Utility Bill', icon: 'file-invoice-dollar' },
    { id: 'other', label: 'Other', icon: 'clipboard-list' },
  ];

  // --- PERMISSIONS ---
  useEffect(() => {
    (async () => {
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (audioStatus !== 'granted') Alert.alert('Permission missing', 'Microphone access needed.');
      if (locStatus !== 'granted') Alert.alert('Permission missing', 'Location access needed.');
    })();
  }, []);

  // --- AUDIO RECORDING ---
  async function startRecording() {
    try {
      setVoiceFile(null); 
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert("Error", "Could not start recording.");
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); 
      setVoiceFile(uri); 
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }

  async function playSound() {
    if (!voiceFile) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: voiceFile });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      Alert.alert("Playback Error", "Could not play audio.");
    }
  }

  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);

  // --- DATE PICKER ---
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') { setShowDatePicker(false); return; }
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    setShowTimePicker(true);
  };

  const onTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') { setShowTimePicker(false); return; }
    const currentTime = selectedTime || date;
    setShowTimePicker(false);
    setDate(currentTime); 
    
    // Clean formatting without seconds
    const datePart = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timePart = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    setDateText(`${datePart}, ${timePart}`);
  };

  // --- HELPER FUNCTION: GET CURRENT CLEAN DATE ---
  const getCleanCurrentDate = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${datePart}, ${timePart}`;
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (!category) { Alert.alert("Missing Info", "Please select a category."); return; }
    if (inputMode === 'text' && (!location || !dateText)) { Alert.alert("Missing Info", "Please fill in location and time."); return; }
    if (inputMode === 'voice' && !voiceFile) { Alert.alert("Missing Voice", "Please record your request."); return; }

    setSubmitting(true);

    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      // --- 1. GET CURRENT LOCATION & REVERSE GEOCODE ---
      // We now explicitly extract and store latitude and longitude
      let curr_location = "Location not detected"; 
      let lat = null;
      let lng = null;

      try {
        let { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        
        lat = coords.latitude;
        lng = coords.longitude;

        let addressResponse = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng
        });

        if (addressResponse.length > 0) {
          const addr = addressResponse[0];
          const parts = [
            addr.street, 
            addr.city, 
            addr.subregion, 
            addr.region
          ].filter(part => part); 

          curr_location = parts.length > 0 ? parts.join(', ') : "Unknown Address";
        }
      } catch (e) {
        console.warn("Location Error:", e);
        curr_location = "Location unavailable";
      }
      // --------------------------------------------------

      // --- 2. PROCESS AUDIO ---
      let finalVoiceData = null;
      if (inputMode === 'voice' && voiceFile) {
        const base64Audio = await FileSystem.readAsStringAsync(voiceFile, { 
          encoding: 'base64' 
        });
        finalVoiceData = `data:audio/m4a;base64,${base64Audio}`; 
      }

      // --- 3. PAYLOAD ---
      const payload = {
        requesterId: user.id || user._id,
        requesterName: user.name || user.fullName,
        inputMode,
        category,
        // If voice, default the main location string to the GPS address. If text, use what they typed.
        location: inputMode === 'voice' ? curr_location : location, 
        dateTime: dateText || getCleanCurrentDate(), 
        notes,
        voiceUri: finalVoiceData,
        isPaid,
        paymentAmount,
        curr_location, // String representation of GPS
        latitude: lat, // <-- NEW: Exact latitude
        longitude: lng // <-- NEW: Exact longitude
      };

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/create_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Request posted successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert("Error", data.message || "Failed to post.");
      }

    } catch (error) {
      console.error("Submit Error:", error);
      Alert.alert("Network Error", "Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{width: 24}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.questionText}>How do you want to describe your need?</Text>
          <View style={styles.modeSwitch}>
            <TouchableOpacity 
              style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]} 
              onPress={() => setInputMode('text')}
            >
              <Ionicons name="create" size={20} color={inputMode === 'text' ? '#FFF' : '#64748B'} />
              <Text style={[styles.modeText, inputMode === 'text' && styles.modeTextActive]}>Type Info</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeBtn, inputMode === 'voice' && styles.modeBtnActive]} 
              onPress={() => setInputMode('voice')}
            >
              <Ionicons name="mic" size={20} color={inputMode === 'voice' ? '#FFF' : '#64748B'} />
              <Text style={[styles.modeText, inputMode === 'voice' && styles.modeTextActive]}>Voice Note</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>What help do you need?</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catCard, category === cat.label && styles.catCardActive]}
                onPress={() => setCategory(cat.label)}
              >
                <View style={[styles.iconCircle, category === cat.label && {backgroundColor: '#FFF'}]}>
                  <FontAwesome5 name={cat.icon} size={20} color={category === cat.label ? '#007EA7' : '#94A3B8'} />
                </View>
                <Text style={[styles.catText, category === cat.label && styles.catTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* VOICE MODE UI */}
          {inputMode === 'voice' && (
             <View style={styles.voiceContainer}>
               <Text style={styles.voiceInstruction}>
                 Tap the microphone and speak.{"\n"}Mention location, time, and details clearly.
               </Text>
               
               <View style={[styles.micRing, isRecording && styles.micRingActive]}>
                 <TouchableOpacity 
                   style={[styles.micButton, isRecording && styles.micButtonRecording]} 
                   onPress={isRecording ? stopRecording : startRecording}
                   activeOpacity={0.8}
                 >
                   <Ionicons name={isRecording ? "stop" : "mic"} size={42} color="#FFF" />
                 </TouchableOpacity>
               </View>
               
               <Text style={styles.recordingStatus}>
                 {isRecording ? "Recording... Tap to stop" : (voiceFile ? "Voice Note Saved ✓" : "Tap to Record")}
               </Text>
               
               {voiceFile && !isRecording && (
                 <TouchableOpacity style={styles.playPreview} onPress={playSound}>
                   <Ionicons name="play" size={20} color="#007EA7" />
                   <Text style={styles.playText}>Play Preview</Text>
                 </TouchableOpacity>
               )}
             </View>
          )}

          {/* TEXT MODE UI */}
          {inputMode === 'text' && (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Where? (Shop / Hospital / Address)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Eg. Lulu Mall or Dr. Roy's Clinic"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>When? (Date & Time)</Text>
                <TouchableOpacity 
                  style={styles.datePickerBtn} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#64748B" style={{marginRight: 10}} />
                  <Text style={[styles.dateText, !dateText && {color: '#94A3B8'}]}>
                    {dateText || "Select Date & Time"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} minimumDate={new Date()} />
                )}
                {showTimePicker && (
                  <DateTimePicker value={date} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Any other details?</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="List of items, doctor name, etc."
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          )}

          {/* PAYMENT */}
          <Text style={styles.sectionLabel}>Payment for Volunteer</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentQuestion}>Will you pay for this service?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, !isPaid && styles.toggleBtnOff]} onPress={() => setIsPaid(false)}>
                  <Text style={[styles.toggleText, !isPaid && {color: '#64748B'}]}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, isPaid && styles.toggleBtnOn]} onPress={() => setIsPaid(true)}>
                  <Text style={[styles.toggleText, isPaid && {color: '#FFF'}]}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
            {isPaid && (
              <View style={styles.amountContainer}>
                <Text style={styles.label}>Enter Amount (₹)</Text>
                <View style={styles.currencyInputWrap}>
                   <Text style={styles.currencySymbol}>₹</Text>
                   <TextInput
                    style={styles.currencyInput} placeholder="200" placeholderTextColor="#94A3B8"
                    keyboardType="numeric" value={paymentAmount} onChangeText={setPaymentAmount}
                  />
                </View>
                <Text style={styles.hintText}>* You can pay cash directly after task completion.</Text>
              </View>
            )}
          </View>

          <View style={{height: 20}} />

          {/* SUBMIT BUTTON MOVED TO BOTTOM */}
          <TouchableOpacity 
            style={[styles.submitButton, submitting && {opacity: 0.7}]} 
            onPress={handleSubmit} 
            activeOpacity={0.8}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>{submitting ? "Processing..." : "Request Help"}</Text>
                <View style={styles.arrowCircle}>
                   <Ionicons name="arrow-forward" size={18} color="#007EA7" />
                </View>
              </>
            )}
          </TouchableOpacity>
          <View style={{height: 40}} />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#F8FAFC' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  scrollContent: { padding: 20 },
  
  questionText: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 14 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 6, marginBottom: 28, elevation: 2 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  modeBtnActive: { backgroundColor: '#007EA7' },
  modeText: { fontWeight: '600', color: '#64748B', fontSize: 15 },
  modeTextActive: { color: '#FFF' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  catCard: { width: '31%', backgroundColor: '#FFF', alignItems: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
  catCardActive: { borderColor: '#007EA7', backgroundColor: '#E0F2FE', borderWidth: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  catTextActive: { color: '#007EA7', fontWeight: '800' },

  // VOICE UI STYLES
  voiceContainer: { alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 20, marginBottom: 24, elevation:2 },
  voiceInstruction: { textAlign: 'center', color: '#64748B', marginBottom: 24, lineHeight: 22, fontSize: 14 },
  micRing: { padding: 8, borderRadius: 100, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16 },
  micRingActive: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  micButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    shadowColor: "#EF4444", shadowOpacity: 0.4, shadowRadius: 10, elevation: 6
  },
  micButtonRecording: { backgroundColor: '#DC2626', transform: [{ scale: 0.95 }] },
  recordingStatus: { fontSize: 15, fontWeight: '600', color: '#334155' },
  playPreview: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#E0F2FE', borderRadius: 20 },
  playText: { color: '#007EA7', fontWeight: '700', fontSize: 13 },

  formContainer: { marginBottom: 10 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: '#0F172A' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16 },
  dateText: { fontSize: 16, color: '#0F172A', fontWeight: '500' },

  paymentCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24, elevation: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentQuestion: { fontSize: 15, color: '#334155', fontWeight: '600', flex: 1 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 },
  toggleBtnOff: { backgroundColor: 'transparent' },
  toggleBtnOn: { backgroundColor: '#10B981' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  amountContainer: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  currencyInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16 },
  currencySymbol: { fontSize: 18, color: '#64748B', fontWeight: '700' },
  currencyInput: { flex:1, paddingVertical: 14, paddingLeft: 8, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  hintText: { fontSize: 12, color: '#94A3B8', marginTop: 8, fontStyle: 'italic' },

  submitButton: { backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 6 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  arrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }
});