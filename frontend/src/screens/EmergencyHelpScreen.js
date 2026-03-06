import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Vibration,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Audio } from 'expo-av'; // Added Audio import

const { width } = Dimensions.get('window');

export default function EmergencyHelpScreen({ navigation }) {
  // --- STATE ---
  const [sirenActive, setSirenActive] = useState(false);
  const [sosPressed, setSosPressed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null); // Added Sound State

  // Contacts State
  const [contacts, setContacts] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  // --- AUDIO CLEANUP ---
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- 1. FETCH CONTACTS FROM DB ---
  const fetchContacts = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${parsedUser.id}`);
      const data = await response.json();

      if (response.ok && data.trustedContacts) {
        setContacts(data.trustedContacts);
      }
    } catch (error) {
      console.error("Fetch Contacts Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [])
  );

  // --- 2. SAVE CONTACTS TO DB ---
  const saveContactsToBackend = async (updatedContacts) => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);

      await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/contacts/${parsedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: updatedContacts }),
      });
    } catch (error) {
      console.error("Save Contacts Error:", error);
      Alert.alert("Error", "Could not save changes to server.");
    }
  };

  // --- SIREN AUDIO LOGIC ---
  const playSiren = async () => {
    try {
      // Force sound to play even if phone is on silent
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      // Using a reliable public domain emergency siren audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=police-siren-21066.mp3' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      setSound(newSound);
    } catch (error) {
      console.error("Error playing siren:", error);
    }
  };

  const stopSiren = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  // --- HANDLERS ---
  const toggleSiren = async () => {
    const newState = !sirenActive;
    setSirenActive(newState);
    
    if (newState) {
      Vibration.vibrate([500, 500, 500], true); 
      await playSiren(); // Start the audio loop
    } else {
      Vibration.cancel();
      await stopSiren(); // Stop the audio loop
    }
  };

  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleSOS = async () => {
    setSosPressed(true);
    Vibration.vibrate(400); 

    try {
      // --- 1. SEND SOS TO NEARBY VOLUNTEERS (DATABASE) ---
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        
        // Get Location
        let curr_location = "Location Unknown";
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
             let { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
             let addressResponse = await Location.reverseGeocodeAsync({
               latitude: coords.latitude,
               longitude: coords.longitude
             });
             if (addressResponse.length > 0) {
               const addr = addressResponse[0];
               const parts = [addr.street, addr.city, addr.subregion, addr.region].filter(Boolean); 
               curr_location = parts.length > 0 ? parts.join(', ') : "Unknown Address";
             }
          }
        } catch (e) {
          console.warn("Location error during SOS:", e);
        }

        // Send to backend
        await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/create_request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterId: user.id || user._id,
            requesterName: user.name || user.fullName,
            inputMode: 'sos',
            category: 'Emergency', // <-- Triggers VolunteerEmergencyScreen
            location: "Immediate Emergency Alert",
            dateTime: new Date().toLocaleString(),
            notes: "URGENT SOS ACTIVATED by Elderly User.",
            curr_location: curr_location,
            isPaid: false,
            paymentAmount: 0
          })
        });
      }

      // --- 2. SEND SMS TO TRUSTED CONTACTS ---
      const recipients = contacts.map(contact => contact.phone);
      if (recipients.length > 0) {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          await SMS.sendSMSAsync(
            recipients,
            "🚨 EMERGENCY ALERT: I need help! Please contact me immediately. This is an SOS from the Sahayam App."
          );
        }
      }

      Alert.alert("SOS Sent!", "Local volunteers and your trusted contacts have been alerted.");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not complete SOS process. Call emergency services manually.");
    } finally {
      setTimeout(() => {
        setSosPressed(false);
      }, 1500);
    }
  };

  const handleAddContact = async () => {
    if (!newName || !newPhone) {
      Alert.alert("Missing Info", "Please enter at least a Name and Phone Number.");
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      relation: newRelation || 'Trusted Contact',
      initial: newName.charAt(0).toUpperCase(),
      color: '#E0F2FE',
      textColor: '#007EA7'
    };

    const updatedList = [...contacts, newContact];
    setContacts(updatedList); // Update UI immediately
    await saveContactsToBackend(updatedList); // Sync with DB

    setModalVisible(false);
    setNewName(''); setNewPhone(''); setNewRelation('');
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Remove Contact", "Are you sure you want to remove this trusted contact?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: 'destructive', 
          onPress: async () => {
            const updatedList = contacts.filter(c => c.id !== id);
            setContacts(updatedList); // Update UI
            await saveContactsToBackend(updatedList); // Sync with DB
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007EA7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Help</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: SOS HERO --- */}
        <View style={styles.sosSection}>
          <View style={[styles.sosRing, sosPressed && styles.sosRingActive]}>
            <TouchableOpacity 
              style={[styles.sosButton, sosPressed && styles.sosButtonPressed]}
              onLongPress={handleSOS}
              delayLongPress={800} 
              activeOpacity={0.9}
            >
              <View style={styles.sosInnerContent}>
                <MaterialCommunityIcons name="broadcast" size={48} color="#FFF" />
                <Text style={styles.sosText}>SOS</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.instructionText}>
            Hold for <Text style={{fontWeight: '700', color: '#EF4444'}}>3 seconds</Text> to send alert
          </Text>
        </View>

        {/* --- SECTION 2: SIREN TOGGLE --- */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={[styles.sirenBar, sirenActive ? styles.sirenBarActive : styles.sirenBarInactive]} 
            onPress={toggleSiren}
            activeOpacity={0.9}
          >
            <View style={[styles.sirenIconCircle, sirenActive ? styles.iconCircleActive : styles.iconCircleInactive]}>
              <MaterialCommunityIcons 
                name={sirenActive ? "volume-high" : "volume-off"} 
                size={24} 
                color={sirenActive ? "#EF4444" : "#64748B"} 
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.sirenTitle, sirenActive && {color: '#EF4444'}]}>
                {sirenActive ? "SIREN IS ON" : "Loud Siren"}
              </Text>
              <Text style={[styles.sirenSub, sirenActive && {color: '#EF4444', opacity: 0.8}]}>
                {sirenActive ? "Tap to silence alarm" : "Tap to alert people nearby"}
              </Text>
            </View>
            {sirenActive && <View style={styles.pulseIndicator} />}
          </TouchableOpacity>
        </View>

        {/* --- SECTION 3: QUICK DIAL --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Quick Dial Services</Text>
          <View style={styles.grid}>
            
            {/* Ambulance */}
            <TouchableOpacity style={styles.gridCard} onPress={() => callNumber('108')}>
              <View style={[styles.gridIcon, {backgroundColor: '#E0F2FE'}]}>
                <FontAwesome5 name="ambulance" size={20} color="#0284C7" />
              </View>
              <Text style={styles.gridTitle}>Ambulance</Text>
              <Text style={styles.gridNumber}>108</Text>
            </TouchableOpacity>

            {/* Police */}
            <TouchableOpacity style={styles.gridCard} onPress={() => callNumber('100')}>
              <View style={[styles.gridIcon, {backgroundColor: '#FFF7ED'}]}>
                <MaterialCommunityIcons name="police-badge" size={24} color="#EA580C" />
              </View>
              <Text style={styles.gridTitle}>Police</Text>
              <Text style={styles.gridNumber}>100</Text>
            </TouchableOpacity>

            {/* Fire */}
            <TouchableOpacity style={styles.gridCard} onPress={() => callNumber('101')}>
              <View style={[styles.gridIcon, {backgroundColor: '#FEF2F2'}]}>
                <MaterialCommunityIcons name="fire-truck" size={24} color="#DC2626" />
              </View>
              <Text style={styles.gridTitle}>Fire Force</Text>
              <Text style={styles.gridNumber}>101</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* --- SECTION 4: TRUSTED CONTACTS --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.contactHeader}>
            <Text style={styles.sectionLabel}>Trusted Contacts</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={16} color="#007EA7" />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>
          
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={[styles.contactAvatar, { backgroundColor: contact.color }]}>
                  <Text style={{ fontSize: 16, color: contact.textColor, fontWeight: '800' }}>{contact.initial}</Text>
                </View>
                
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRole}>{contact.relation}</Text>
                </View>

                <View style={styles.contactActions}>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={() => callNumber(contact.phone)}>
                    <View style={styles.callCircle}>
                        <Ionicons name="call" size={16} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteIconBtn} onPress={() => confirmDelete(contact.id)}>
                    <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>No emergency contacts added.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* --- MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Contact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.input} placeholder="Eg. Rahul" value={newName} onChangeText={setNewName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="Eg. 9876543210" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput style={styles.input} placeholder="Eg. Son, Doctor" value={newRelation} onChangeText={setNewRelation} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddContact}>
              <Text style={styles.saveBtnText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, backgroundColor: '#F8FAFC'
  },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },

  scrollContent: { paddingBottom: 40 },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

  // 1. SOS Section
  sosSection: { alignItems: 'center', marginVertical: 20 },
  sosRing: {
    padding: 8, borderRadius: 200, borderWidth: 1, borderColor: '#FECACA',
    backgroundColor: '#FEF2F2' 
  },
  sosRingActive: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  sosButton: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: "#EF4444", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8
  },
  sosButtonPressed: { transform: [{ scale: 0.96 }], backgroundColor: '#DC2626' },
  sosInnerContent: { alignItems: 'center', justifyContent: 'center' },
  sosText: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 2, marginTop: 4 },
  instructionText: { marginTop: 20, fontSize: 14, color: '#64748B' },

  // 2. Siren Toggle
  sirenBar: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20,
    borderWidth: 1, elevation: 2, shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {width: 0, height: 4}
  },
  sirenBarInactive: { backgroundColor: '#FFFFFF', borderColor: '#F1F5F9' },
  sirenBarActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  sirenIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  iconCircleInactive: { backgroundColor: '#F1F5F9' },
  iconCircleActive: { backgroundColor: '#FECACA' },
  sirenTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  sirenSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  pulseIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 8 },

  // 3. Grid Services
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    width: '31%', borderRadius: 20, paddingVertical: 20, alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#F1F5F9',
    elevation: 2, shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 8
  },
  gridIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  gridNumber: { fontSize: 16, fontWeight: '800', color: '#1E293B' },

  // 4. Contacts
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#007EA7', marginLeft: 4 },
  
  contactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#64748B', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: {width: 0, height: 2}, elevation: 1
  },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  contactDetails: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  contactRole: { fontSize: 13, color: '#64748B', marginTop: 2 },
  contactActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  
  callCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  deleteIconBtn: { padding: 4 },
  
  emptyState: { alignItems: 'center', padding: 30, backgroundColor: '#FFF', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
  emptyText: { color: '#94A3B8', marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, fontSize: 15, color: '#0F172A' },
  
  saveBtn: { backgroundColor: '#007EA7', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});