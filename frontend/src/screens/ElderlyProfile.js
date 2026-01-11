import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ElderlyProfile = ({ navigation }) => {

  const [user, setUser] = useState({
    name: "Saraswathi Amma",
    phone: "+91 98765 43210",
    aadhaar: "XXXX XXXX 1234",
    address: "Mangottu House, Kumbazha Road, Pathanamthitta",
    bloodGroup: "O+",
    conditions: "Diabetes, Hypertension",
    guardian: "Rahul (Son) - +91 98989 89898",
    avatar: 'https://ui-avatars.com/api/?name=Saraswathi+Amma&background=E0F7FA&color=006064&size=128' // Default Image
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to change the photo.');
      return;
    }

    // Launch the gallery
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setUser({ ...user, avatar: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditElderlyProfile', { 
            currentUser: user,       
            onSave: (newData) => setUser(newData) 
          })}
        >
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- PROFILE CARD --- */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            
            {/* Display the image from state (remote URL or local URI) */}
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatar} 
            />
            
            {/* 3. Made this TouchableOpacity to trigger image picker */}
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>

          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <View style={styles.locationTag}>
            <Ionicons name="location-sharp" size={12} color="#546E7A" />
            <Text style={styles.locationText}>Pathanamthitta</Text>
          </View>
        </View>

        {/* --- SECTION 1: PERSONAL DETAILS --- */}
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="card-outline" label="Aadhaar Number" value={user.aadhaar} />
          <View style={styles.divider} />
          <InfoRow icon="home-outline" label="Home Address" value={user.address} />
        </View>

        {/* --- SECTION 2: MEDICAL INFO --- */}
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="water-outline" label="Blood Group" value={user.bloodGroup} />
          <View style={styles.divider} />
          <InfoRow icon="fitness-outline" label="Medical Conditions" value={user.conditions} />
        </View>

        {/* --- SECTION 3: EMERGENCY CONTACT --- */}
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="call-outline" label="Primary Guardian" value={user.guardian} />
        </View>

        {/* --- LOGOUT BUTTON --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => alert("Logged Out")}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

// --- HELPER COMPONENT FOR ROWS ---
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={20} color="#007EA7" />
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1E29',
  },
  editBtn: {
    color: '#007EA7',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Profile Header Card
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#E0F7FA',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#007EA7',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A1E29',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 8,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#546E7A',
    fontWeight: '600',
  },

  // Info Cards (Same as before)
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#90A4AE',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#78909C',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#0A1E29',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
    marginLeft: 56, 
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: 8,
    marginTop: 10,
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: '700',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#B0BEC5',
    fontSize: 12,
  },
});

export default ElderlyProfile;