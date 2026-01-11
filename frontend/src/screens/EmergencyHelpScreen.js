import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EmergencyHelpScreen({ navigation }) {
  // --- STATE (UNCHANGED LOGIC) ---
  const [sirenActive, setSirenActive] = useState(false);
  const [sosPressed, setSosPressed] = useState(false);

  const [contacts, setContacts] = useState([
    { id: '1', name: 'Son (Rahul)', relation: 'Primary Contact', phone: '9876543210', initial: 'S', color: '#E8F5E9', textColor: '#2E7D32' },
    { id: '2', name: 'Dr. Anjali', relation: 'Family Doctor', phone: '9123456789', initial: 'D', color: '#F3E5F5', textColor: '#7B1FA2' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  // --- HANDLERS (UNCHANGED LOGIC) ---
  const toggleSiren = () => {
    const newState = !sirenActive;
    setSirenActive(newState);
    if (newState) {
      Vibration.vibrate([500, 500, 500], true); 
      Alert.alert("Loud Siren", "🔊 [LOUD ALARM SOUND PLAYING]");
    } else {
      Vibration.cancel();
    }
  };

  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleSOS = () => {
    setSosPressed(true);
    Vibration.vibrate(400); 
    setTimeout(() => {
      setSosPressed(false);
      Alert.alert("SOS SENT!", "Emergency contacts and nearby volunteers have been notified.");
    }, 1500);
  };

  const handleAddContact = () => {
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
      color: '#E3F2FD',
      textColor: '#1565C0'
    };

    setContacts([...contacts, newContact]);
    setModalVisible(false);
    setNewName(''); setNewPhone(''); setNewRelation('');
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Remove Contact", "Are you sure you want to remove this trusted contact?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: 'destructive', onPress: () => setContacts(contacts.filter(c => c.id !== id)) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <MaterialIcons name="health-and-safety" size={24} color="#D32F2F" />
        </View>
        <Text style={styles.headerTitle}>Emergency Help</Text>
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
                <MaterialCommunityIcons name="broadcast" size={40} color="rgba(255,255,255,0.9)" />
                <Text style={styles.sosText}>SOS</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.instructionText}>
            Hold for <Text style={{fontWeight: '700', color: '#D32F2F'}}>3 seconds</Text> to send alert
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
                color={sirenActive ? "#D32F2F" : "#546E7A"} 
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.sirenTitle, sirenActive && {color: '#FFF'}]}>
                {sirenActive ? "SIREN IS ON" : "Loud Siren"}
              </Text>
              <Text style={[styles.sirenSub, sirenActive && {color: 'rgba(255,255,255,0.8)'}]}>
                {sirenActive ? "Tap to silence alarm" : "Tap to alert people nearby"}
              </Text>
            </View>
            {sirenActive && <View style={styles.pulseIndicator} />}
          </TouchableOpacity>
        </View>

        {/* --- SECTION 3: SERVICES GRID --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>QUICK DIAL SERVICES</Text>
          <View style={styles.grid}>
            
            {/* Ambulance */}
            <TouchableOpacity style={[styles.gridCard, {backgroundColor: '#E3F2FD'}]} onPress={() => callNumber('108')}>
              <View style={[styles.gridIcon, {backgroundColor: '#BBDEFB'}]}>
                <FontAwesome5 name="ambulance" size={20} color="#1565C0" />
              </View>
              <Text style={[styles.gridTitle, {color: '#1565C0'}]}>Ambulance</Text>
              <Text style={[styles.gridNumber, {color: '#0D47A1'}]}>108</Text>
            </TouchableOpacity>

            {/* Police */}
            <TouchableOpacity style={[styles.gridCard, {backgroundColor: '#FFF3E0'}]} onPress={() => callNumber('100')}>
              <View style={[styles.gridIcon, {backgroundColor: '#FFE0B2'}]}>
                <MaterialCommunityIcons name="police-badge" size={24} color="#E65100" />
              </View>
              <Text style={[styles.gridTitle, {color: '#E65100'}]}>Police</Text>
              <Text style={[styles.gridNumber, {color: '#BF360C'}]}>100</Text>
            </TouchableOpacity>

            {/* Fire */}
            <TouchableOpacity style={[styles.gridCard, {backgroundColor: '#FFEBEE'}]} onPress={() => callNumber('101')}>
              <View style={[styles.gridIcon, {backgroundColor: '#FFCDD2'}]}>
                <MaterialCommunityIcons name="fire-truck" size={24} color="#C62828" />
              </View>
              <Text style={[styles.gridTitle, {color: '#C62828'}]}>Fire Force</Text>
              <Text style={[styles.gridNumber, {color: '#B71C1C'}]}>101</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* --- SECTION 4: CONTACTS --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.contactHeader}>
            <Text style={styles.sectionLabel}>TRUSTED CONTACTS</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={18} color="#007EA7" />
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
                  <TouchableOpacity style={styles.actionIconBtn} onPress={() => confirmDelete(contact.id)}>
                    <Ionicons name="trash-outline" size={18} color="#B0BEC5" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.callBtn} onPress={() => callNumber(contact.phone)}>
                    <Ionicons name="call" size={18} color="#FFF" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No contacts added yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* --- ADD MODAL (Modernized) --- */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Emergency Contact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#90A4AE" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputIconBox}><Ionicons name="person-outline" size={18} color="#546E7A" /></View>
              <TextInput style={styles.input} placeholder="Name (e.g. Rahul)" value={newName} onChangeText={setNewName} />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIconBox}><Ionicons name="call-outline" size={18} color="#546E7A" /></View>
              <TextInput style={styles.input} placeholder="Phone Number" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIconBox}><Ionicons name="heart-outline" size={18} color="#546E7A" /></View>
              <TextInput style={styles.input} placeholder="Relation (e.g. Son)" value={newRelation} onChangeText={setNewRelation} />
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  headerIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#B71C1C' },

  scrollContent: { paddingBottom: 40 },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#90A4AE', marginBottom: 12, letterSpacing: 1 },

  // 1. SOS Section
  sosSection: { alignItems: 'center', marginVertical: 30 },
  sosRing: {
    padding: 10, borderRadius: 200, borderWidth: 1, borderColor: '#FFEBEE',
    backgroundColor: '#FFEBEE' // Outer glow
  },
  sosRingActive: { backgroundColor: '#FFCDD2', borderColor: '#EF9A9A' },
  sosButton: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#D32F2F',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: "#D32F2F", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10
  },
  sosButtonPressed: { transform: [{ scale: 0.96 }], backgroundColor: '#B71C1C' },
  sosInnerContent: { alignItems: 'center', justifyContent: 'center' },
  sosText: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: 2, marginTop: -4 },
  instructionText: { marginTop: 24, fontSize: 14, color: '#546E7A' },

  // 2. Siren Toggle
  sirenBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16,
    borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width: 0, height: 2}
  },
  sirenBarInactive: { backgroundColor: '#FFF', borderColor: '#ECEFF1' },
  sirenBarActive: { backgroundColor: '#D32F2F', borderColor: '#B71C1C' },
  sirenIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconCircleInactive: { backgroundColor: '#ECEFF1' },
  iconCircleActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  sirenTitle: { fontSize: 16, fontWeight: '700', color: '#263238' },
  sirenSub: { fontSize: 12, color: '#78909C' },
  pulseIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF', marginRight: 8 },

  // 3. Grid Services
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    width: '31%', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)'
  },
  gridIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  gridTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  gridNumber: { fontSize: 14, fontWeight: '800' },

  // 4. Contacts
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F7FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#007EA7', marginLeft: 2 },
  
  contactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, elevation: 1
  },
  contactAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactDetails: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#263238' },
  contactRole: { fontSize: 12, color: '#90A4AE' },
  contactActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIconBtn: { padding: 4 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4
  },
  callBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#B0BEC5', fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#263238' },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7F8', borderRadius: 12, paddingHorizontal: 12, marginBottom: 14, borderWidth: 1, borderColor: '#ECEFF1' },
  inputIconBox: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#263238' },
  
  saveBtn: { backgroundColor: '#007EA7', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});