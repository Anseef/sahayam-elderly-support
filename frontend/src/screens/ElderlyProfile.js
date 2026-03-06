import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import Storage
import { useFocusEffect } from '@react-navigation/native'; // Import Focus Effect

const ElderlyProfile = ({ navigation }) => {

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    name: "Demo User",
    phone: "",
    aadhaar: "",
    address: "Not set",
    bloodGroup: "Not set",
    conditions: "None listed",
    guardian: "Not set",
    avatar: null,
    location:"No location"
  });

  const fetchProfile = async () => {
    try {
      // 1. Get ID from Local Storage
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        navigation.replace('Login');
        return;
      }
      const parsedUser = JSON.parse(storedUser);

      // 2. Call Backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/profile/${parsedUser.id}`);
      const data = await response.json();

      if (response.ok) {
        // 3. Map Backend Data to UI State
        setUser({
          name: data.fullName || "User",
          phone: data.phoneNumber || "",
          aadhaar: data.aadhaarNumber || "",
          location: data.location || "No Location",
          address: data.address || "Tap 'Edit' to add address", 
          bloodGroup: data.bloodGroup || "Not set",
          conditions: data.conditions || "None",
          guardian: data.guardian || "Not set",
          avatar: data.profileImage || null
        });
      } else {
        Alert.alert("Error", "Could not fetch profile");
      }
    } catch (error) {
      console.error("Profile Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when screen opens
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  // --- IMAGE PICKER ---
const pickImage = async () => {
    // 1. Permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    // 2. Pick Image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // Required for MongoDB storage
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${selectedAsset.base64}`;

      // Optimistic Update
      setUser({ ...user, avatar: base64Image });

      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);

        // CHECK IP HERE!
        // Replace '192.168.1.5' with your real computer IP if needed.
        const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${parsedUser.id}`;
        
        console.log("🚀 Uploading to:", apiUrl);

        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profileImage: base64Image }),
        });

        // READ SERVER RESPONSE
        const textData = await response.text(); 
        console.log("📩 Server Says:", textData);

        if (!response.ok) {
          Alert.alert("Upload Failed", "Server Error: " + textData);
        } else {
          Alert.alert("Success", "Profile photo updated!");
        }

      } catch (error) {
        console.error("❌ Network Error:", error);
        Alert.alert("Connection Error", "Could not reach server. Check IP address.");
      }
    }
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user'); // Clear Session
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#007EA7" />
      </View>
    );
  }

  // Generate Default Avatar based on Name
  const defaultAvatar = `https://ui-avatars.com/api/?name=${user.name.replace(" ", "+")}&background=E0F7FA&color=006064&size=128`;

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
            onSave: (newData) => setUser(newData) // This handles local updates immediately
          })}
        >
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- PROFILE CARD --- */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user.avatar ? user.avatar : defaultAvatar }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <View style={styles.locationTag}>
            <Ionicons name="location-sharp" size={12} color="#546E7A" />
            <Text style={styles.locationText}>{user.location}</Text>
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

// ... (Helper Components and Styles remain exactly the same as your previous code) ...
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
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEFF1' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0A1E29' },
  editBtn: { color: '#007EA7', fontWeight: '600', fontSize: 14 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileCard: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', backgroundColor: '#E0F7FA' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 4, backgroundColor: '#007EA7', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#fff', elevation: 2 },
  userName: { fontSize: 20, fontWeight: '800', color: '#0A1E29', marginBottom: 4 },
  userPhone: { fontSize: 14, color: '#546E7A', marginBottom: 8 },
  locationTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECEFF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  locationText: { fontSize: 12, color: '#546E7A', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#90A4AE', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  rowContent: { flex: 1 },
  label: { fontSize: 12, color: '#78909C', marginBottom: 2 },
  value: { fontSize: 15, color: '#0A1E29', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12, marginLeft: 56 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2', gap: 8, marginTop: 10 },
  logoutText: { color: '#D32F2F', fontWeight: '700', fontSize: 16 },
  versionText: { textAlign: 'center', marginTop: 20, color: '#B0BEC5', fontSize: 12 },
});

export default ElderlyProfile;