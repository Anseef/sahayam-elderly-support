import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Helper to format Base64 strings for React Native Image component
const formatImageUri = (imgString) => {
    if (!imgString) return null;
    if (imgString.startsWith('http') || imgString.startsWith('file://') || imgString.startsWith('data:image')) {
      return imgString;
    }
    return `data:image/jpeg;base64,${imgString}`;
};

export default function VolunteerProfile({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Start stats at 0 instead of mocked data
  const [stats, setStats] = useState({ completed: 0, rating: "0.0" });

  // --- FETCH DATA ---
  const fetchProfile = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        navigation.replace('Login');
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser.id || parsedUser._id;

      // 1. Fetch User Details
      const userRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`);
      const userData = await userRes.json();

      if (userRes.ok) {
        setUser(userData);
      } else {
        setUser(parsedUser);
      }

      // 2. Fetch Tasks to Calculate Real Stats
      const tasksRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/all`);
      
      if (tasksRes.ok) {
          const allTasks = await tasksRes.json();
          
          // Ensure ID is a string for accurate matching
          const targetId = String(userId);

          // Find completed tasks for this volunteer
          const volunteerTasks = allTasks.filter(t => {
             return t.status === 'Completed' && t.volunteerId && String(t.volunteerId) === targetId;
          });
          
          const completedCount = volunteerTasks.length;

          // Calculate average rating
          const ratedTasks = volunteerTasks.filter(t => t.rating && Number(t.rating) > 0);
          let avgRating = "0.0";
          
          if (ratedTasks.length > 0) {
              const sum = ratedTasks.reduce((acc, curr) => acc + Number(curr.rating), 0);
              avgRating = (sum / ratedTasks.length).toFixed(1);
          }

          // Update real stats!
          setStats({ completed: completedCount, rating: avgRating });
      }

    } catch (error) {
      console.error("Profile Error:", error);
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  // --- HANDLE IMAGE PICKER & UPLOAD ---
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Image = result.assets[0].base64;
        uploadProfileImage(base64Image);
    }
  };

  const uploadProfileImage = async (base64String) => {
      setUploadingImage(true);
      try {
          const userId = user._id || user.id;
          
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileImage: base64String })
          });

          if (response.ok) {
              setUser(prev => ({ ...prev, profileImage: base64String }));
              
              const storedUser = await AsyncStorage.getItem('user');
              if (storedUser) {
                  const parsed = JSON.parse(storedUser);
                  parsed.profileImage = base64String;
                  await AsyncStorage.setItem('user', JSON.stringify(parsed));
              }
              Alert.alert("Success", "Profile picture updated!");
          } else {
              Alert.alert("Error", "Failed to update profile picture on server.");
          }
      } catch (error) {
          console.error("Upload Error:", error);
          Alert.alert("Network Error", "Could not connect to server.");
      } finally {
          setUploadingImage(false);
      }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const handleEdit = () => {
      navigation.navigate('EditVolunteerProfile');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007EA7" />
      </View>
    );
  }

  const imageUri = formatImageUri(user?.profileImage);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007EA7" />

      {/* --- 1. HEADER BACKGROUND --- */}
      <View style={styles.headerBackground}>
        <View style={styles.headerNav}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
            <Ionicons name="pencil" size={18} color="#FFF" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- 2. PROFILE CARD --- */}
      <View style={styles.profileCard}>
        
        {/* AVATAR WITH UPLOAD OPTION */}
        <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handlePickImage} 
            activeOpacity={0.8}
            disabled={uploadingImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : "V"}</Text>
            </View>
          )}
          
          {uploadingImage ? (
              <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
              </View>
          ) : (
              <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="#FFF" />
              </View>
          )}
        </TouchableOpacity>

        <Text style={styles.userName}>{user?.fullName || "Volunteer Name"}</Text>
        
        <View style={styles.roleTag}>
          <FontAwesome5 name="hands-helping" size={12} color="#007EA7" />
          <Text style={styles.roleText}>Verified Volunteer</Text>
        </View>

        {/* --- DYNAMIC STATS ROW --- */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Helped</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Text style={styles.statValue}>{stats.rating}</Text>
              <Ionicons name="star" size={14} color="#FFC107" />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </View>

      {/* --- 3. DETAILS SECTION --- */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={18} color="#007EA7" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{user?.phoneNumber || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="card" size={18} color="#007EA7" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Aadhaar ID</Text>
              <Text style={styles.value}>{user?.aadhaarNumber || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={18} color="#007EA7" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Base Location</Text>
              <Text style={styles.value}>{user?.location || "Not Set"}</Text>
            </View>
          </View>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={22} color="#546E7A" />
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CFD8DC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={22} color="#546E7A" />
              <Text style={styles.menuText}>Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CFD8DC" />
          </TouchableOpacity>
        </View> */}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerBackground: {
    backgroundColor: '#007EA7',
    height: 180,
    paddingTop: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  editBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginTop: -80, 
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
    marginBottom: 24
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#F0F9FF', resizeMode: 'cover' },
  placeholderAvatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F0F9FF' },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#007EA7' },
  
  // Camera & Loading Overlay
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007EA7', padding: 8, borderRadius: 16, borderWidth: 2, borderColor: '#FFF', elevation: 4 },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  
  userName: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  roleTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6, marginBottom: 20 },
  roleText: { color: '#166534', fontWeight: '700', fontSize: 12 },

  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: '80%', backgroundColor: '#F1F5F9' },

  // Content
  scrollContent: { paddingHorizontal: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoText: { flex: 1 },
  label: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  value: { fontSize: 15, color: '#1E293B', fontWeight: '600' },

  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#334155' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 18, borderRadius: 16, marginTop: 10, gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
});