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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 

const { width } = Dimensions.get('window');

export default function AddServiceScreen({ navigation }) {
  const [inputMode, setInputMode] = useState('text'); 
  const [recording, setRecording] = useState(null);      
  const [voiceFile, setVoiceFile] = useState(null);      
  const [isRecording, setIsRecording] = useState(false); 
  const [sound, setSound] = useState(null);              
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const categories = [
    { id: 'groceries', label: 'Groceries', icon: 'shopping-basket' },
    { id: 'medicine', label: 'Medicine', icon: 'first-aid' },
    { id: 'hospital', label: 'Hospital', icon: 'hospital' },
    { id: 'transport', label: 'Transport', icon: 'car' },
    { id: 'utility', label: 'Utility Bill', icon: 'file-invoice-dollar' },
    { id: 'other', label: 'Other', icon: 'clipboard-list' },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission missing', 'We need microphone access to record voice notes.');
      }
    })();
  }, []);

  async function startRecording() {
    try {
      setVoiceFile(null);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert("Error", "Could not start recording.");
    }
  }

  async function stopRecording() {
    setRecording(null);
    setIsRecording(false);
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
      Alert.alert("Playback Error", "Could not play the audio file.");
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const handleSubmit = () => {
    if (!category) { Alert.alert("Missing Info", "Please select a category."); return; }
    if (inputMode === 'text' && (!location || !dateTime)) { Alert.alert("Missing Info", "Please fill in location and time."); return; }
    if (inputMode === 'voice' && !voiceFile) { Alert.alert("Missing Voice", "Please record your request."); return; }
    Alert.alert("Success", "Your request has been posted to nearby volunteers!", [{ text: "OK", onPress: () => navigation.goBack() }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{width: 24}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* MODE SELECTION */}
          <Text style={styles.questionText}>How do you want to describe your need?</Text>
          <View style={styles.modeSwitch}>
            <TouchableOpacity 
              style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]} 
              onPress={() => setInputMode('text')}
              activeOpacity={0.8}
            >
              <Ionicons name="create" size={20} color={inputMode === 'text' ? '#FFF' : '#64748B'} />
              <Text style={[styles.modeText, inputMode === 'text' && styles.modeTextActive]}>Type Info</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeBtn, inputMode === 'voice' && styles.modeBtnActive]} 
              onPress={() => setInputMode('voice')}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={20} color={inputMode === 'voice' ? '#FFF' : '#64748B'} />
              <Text style={[styles.modeText, inputMode === 'voice' && styles.modeTextActive]}>Voice Note</Text>
            </TouchableOpacity>
          </View>

          {/* CATEGORY SELECTION */}
          <Text style={styles.sectionLabel}>What help do you need?</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catCard, category === cat.label && styles.catCardActive]}
                onPress={() => setCategory(cat.label)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, category === cat.label && {backgroundColor: '#FFF'}]}>
                  <FontAwesome5 
                    name={cat.icon} 
                    size={20} 
                    color={category === cat.label ? '#007EA7' : '#94A3B8'} 
                  />
                </View>
                <Text style={[styles.catText, category === cat.label && styles.catTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- A. VOICE MODE --- */}
          {inputMode === 'voice' && (
            <View style={styles.voiceContainer}>
              <Text style={styles.voiceInstruction}>
                Tap the microphone and speak.{"\n"}Mention location, time, and details clearly.
              </Text>
              
              {/* RECORD BUTTON (Enhanced) */}
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
              
              {/* PLAYBACK BUTTON */}
              {voiceFile && !isRecording && (
                <TouchableOpacity style={styles.playPreview} onPress={playSound}>
                  <Ionicons name="play" size={20} color="#007EA7" />
                  <Text style={styles.playText}>Play Preview</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* --- B. TEXT MODE --- */}
          {inputMode === 'text' && (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Where? (Shop / Hospital / Address)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Eg. Lulu Mall or Dr. Roy's Clinic"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>When? (Time / Date)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Eg. Tomorrow at 10:00 AM"
                  placeholderTextColor="#94A3B8"
                  value={dateTime}
                  onChangeText={setDateTime}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Any other details?</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="List of items, doctor name, etc."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          )}

          {/* PAYMENT DETAILS */}
          <Text style={styles.sectionLabel}>Payment for Volunteer</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentQuestion}>Will you pay for this service?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, !isPaid && styles.toggleBtnOff]} 
                  onPress={() => setIsPaid(false)}
                >
                  <Text style={[styles.toggleText, !isPaid && {color: '#64748B'}]}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, isPaid && styles.toggleBtnOn]} 
                  onPress={() => setIsPaid(true)}
                >
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
                    style={styles.currencyInput}
                    placeholder="200"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                  />
                </View>
                <Text style={styles.hintText}>* You can pay cash directly after task completion.</Text>
              </View>
            )}
          </View>

          <View style={{height: 20}} />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>Request Help</Text>
            <View style={styles.arrowCircle}>
               <Ionicons name="arrow-forward" size={18} color="#007EA7" />
            </View>
          </TouchableOpacity>

          <View style={{height: 40}} />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, backgroundColor: '#F8FAFC', 
  },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 0
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
  
  scrollContent: { padding: 20 },

  // Mode Switch
  questionText: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 14 },
  modeSwitch: { 
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 6, marginBottom: 28,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  modeBtnActive: { backgroundColor: '#007EA7' },
  modeText: { fontWeight: '600', color: '#64748B', fontSize: 15 },
  modeTextActive: { color: '#FFF' },

  // Categories
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  catCard: {
    width: '31%', backgroundColor: '#FFF', alignItems: 'center', paddingVertical: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2
  },
  catCardActive: { borderColor: '#007EA7', backgroundColor: '#E0F2FE' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  catTextActive: { color: '#007EA7', fontWeight: '800' },

  // Voice Section
  voiceContainer: { alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 20, marginBottom: 24, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, elevation:2 },
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

  // Inputs
  formContainer: { marginBottom: 10 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: '#0F172A'
  },

  // Payment
  paymentCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, elevation:2 },
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

  // Submit
  submitButton: {
    backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12, 
    shadowColor: "#007EA7", shadowOpacity: 0.3, shadowRadius: 10, elevation: 6
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  arrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }
});