import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Vibration,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function EmergencyHelpScreen({ navigation }) {
  const [sirenActive, setSirenActive] = useState(false);
  const [sosPressed, setSosPressed] = useState(false);

  // --- FUNCTION: Handle Siren Toggle ---
  const toggleSiren = () => {
    // In a real app, you would use 'expo-av' to play an mp3 file here.
    const newState = !sirenActive;
    setSirenActive(newState);
    
    if (newState) {
      // Start Vibrate Pattern (SOS code: ... --- ...)
      Vibration.vibrate([500, 500, 500], true); 
      Alert.alert("Loud Siren", "🔊 [LOUD ALARM SOUND PLAYING]");
    } else {
      Vibration.cancel();
    }
  };

  // --- FUNCTION: Call Number ---
  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  // --- FUNCTION: Handle SOS Long Press ---
  const handleSOS = () => {
    setSosPressed(true);
    Vibration.vibrate(400); // Haptic feedback
    
    // Simulate sending location to backend
    setTimeout(() => {
      setSosPressed(false);
      Alert.alert(
        "SOS SENT!", 
        "Emergency contacts and nearby volunteers have been notified with your location."
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Help</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: GIANT SOS BUTTON --- */}
        <View style={styles.sosContainer}>
          <Text style={styles.instructionText}>Hold for 3 seconds to send alert</Text>
          
          <TouchableOpacity 
            style={[styles.sosButton, sosPressed && styles.sosButtonPressed]}
            onLongPress={handleSOS}
            delayLongPress={800} // Time to hold before activating
            activeOpacity={0.9}
          >
            <View style={[styles.sosInnerCircle, sosPressed && styles.sosInnerPressed]}>
              <Text style={styles.sosText}>SOS</Text>
              <MaterialCommunityIcons name="broadcast" size={32} color="#fff" style={{ marginTop: 5 }} />
            </View>
          </TouchableOpacity>

          <Text style={styles.subText}>Notifies Family & Volunteers</Text>
        </View>

        {/* --- SECTION 2: LOUD SIREN --- */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.sirenCard, sirenActive && styles.sirenActive]} 
            onPress={toggleSiren}
          >
            <MaterialCommunityIcons 
              name={sirenActive ? "volume-high" : "volume-off"} 
              size={32} 
              color={sirenActive ? "#fff" : "#D32F2F"} 
            />
            <Text style={[styles.sirenText, sirenActive && { color: '#fff' }]}>
              {sirenActive ? "STOP SIREN" : "LOUD SIREN"}
            </Text>
            {sirenActive && <View style={styles.pulseDot} />}
          </TouchableOpacity>
        </View>

        {/* --- SECTION 3: QUICK DIAL SERVICES --- */}
        <Text style={styles.sectionTitle}>Emergency Services</Text>
        <View style={styles.grid}>
          
          {/* Ambulance */}
          <TouchableOpacity style={styles.gridItem} onPress={() => callNumber('108')}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome5 name="ambulance" size={24} color="#1565C0" />
            </View>
            <Text style={styles.gridLabel}>Ambulance</Text>
            <Text style={styles.gridNumber}>108</Text>
          </TouchableOpacity>

          {/* Police */}
          <TouchableOpacity style={styles.gridItem} onPress={() => callNumber('100')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="police-badge" size={28} color="#EF6C00" />
            </View>
            <Text style={styles.gridLabel}>Police</Text>
            <Text style={styles.gridNumber}>100</Text>
          </TouchableOpacity>

          {/* Fire Force */}
          <TouchableOpacity style={styles.gridItem} onPress={() => callNumber('101')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="fire-truck" size={28} color="#D32F2F" />
            </View>
            <Text style={styles.gridLabel}>Fire Force</Text>
            <Text style={styles.gridNumber}>101</Text>
          </TouchableOpacity>

        </View>

        {/* --- SECTION 4: SAVED CONTACTS --- */}
        <Text style={styles.sectionTitle}>Trusted Contacts</Text>
        
        <TouchableOpacity style={styles.contactRow} onPress={() => callNumber('9876543210')}>
          <View style={[styles.avatar, { backgroundColor: '#E8F5E9' }]}>
            <Text style={{ fontSize: 18, color: '#2E7D32' }}>S</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Son (Rahul)</Text>
            <Text style={styles.contactRelation}>Primary Contact</Text>
          </View>
          <View style={styles.callButton}>
            <Ionicons name="call" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={() => callNumber('9123456789')}>
          <View style={[styles.avatar, { backgroundColor: '#F3E5F5' }]}>
            <Text style={{ fontSize: 18, color: '#7B1FA2' }}>D</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Dr. Anjali</Text>
            <Text style={styles.contactRelation}>Family Doctor</Text>
          </View>
          <View style={styles.callButton}>
            <Ionicons name="call" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D32F2F', // Urgent Red
  },

  // SOS Section
  sosContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  instructionText: {
    color: '#757575',
    marginBottom: 20,
    fontSize: 14,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFEBEE', // Light Red Glow
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for pulse effect
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.95 }], // Shrink effect
  },
  sosInnerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#D32F2F', // Deep Red
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#B71C1C',
  },
  sosInnerPressed: {
    backgroundColor: '#B71C1C', // Darker Red on press
  },
  sosText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  subText: {
    marginTop: 20,
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 16,
  },

  // Siren Section
  actionRow: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sirenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#D32F2F',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 10,
  },
  sirenActive: {
    backgroundColor: '#D32F2F', // Solid red when active
  },
  sirenText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D32F2F',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginLeft: 5,
  },

  // Grid Services
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 20,
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
  },
  gridNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginTop: 2,
  },

  // Contacts
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  contactRelation: {
    fontSize: 13,
    color: '#757575',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50', // Green for call
    alignItems: 'center',
    justifyContent: 'center',
  },
});