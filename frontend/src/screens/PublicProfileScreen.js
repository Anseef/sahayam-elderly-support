import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

// Helper to handle base64 images
const formatImageUri = (imgString) => {
  if (!imgString) return null;
  if (imgString.startsWith('http') || imgString.startsWith('file://') || imgString.startsWith('data:image')) {
    return imgString;
  }
  return `data:image/jpeg;base64,${imgString}`;
};

export default function PublicProfileScreen({ route, navigation }) {
  const { userId, isVolunteerProfile } = route.params || {};
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- FETCH USER DETAILS ---
  useEffect(() => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing.");
      navigation.goBack();
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setProfileData(data);
        } else {
          Alert.alert("Error", data.message || "Could not load profile");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Profile Fetch Error:", error);
        Alert.alert("Network Error", "Check your connection.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // --- CALL LOGIC FOR PRIMARY USER ---
  const handleCall = () => {
    if (!profileData?.phoneNumber) {
      Alert.alert("Unavailable", "Phone number is not provided.");
      return;
    }
    const url = Platform.OS === 'android' ? `tel:${profileData.phoneNumber}` : `telprompt:${profileData.phoneNumber}`;
    Linking.openURL(url).catch((err) => {
      console.error("Dialer Error:", err);
      Alert.alert("Dialer Error", "Could not open the dialer. Are you testing on a Simulator?");
    });
  };

  // --- CALL LOGIC FOR GUARDIAN ---
  const handleCallGuardian = () => {
    // Check for guardianPhone. If you store it in a trustedContacts array, 
    // you can map it like: profileData.trustedContacts[0].phone
    const guardianPhone = profileData?.guardianPhone || (profileData?.trustedContacts && profileData.trustedContacts[0]?.phone);
    
    if (!guardianPhone) {
      Alert.alert("Unavailable", "Guardian phone number is not provided in the profile.");
      return;
    }
    
    const url = Platform.OS === 'android' ? `tel:${guardianPhone}` : `telprompt:${guardianPhone}`;
    Linking.openURL(url).catch((err) => {
      console.error("Dialer Error:", err);
      Alert.alert("Dialer Error", "Could not open the dialer.");
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007EA7" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!profileData) return null;

  const profileImgUri = formatImageUri(profileData.profileImage);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007EA7" />

      {/* --- HEADER --- */}
      <View style={styles.headerBackground}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isVolunteerProfile ? "Volunteer Profile" : "Beneficiary Profile"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* --- PROFILE CARD --- */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {profileImgUri ? (
            <Image source={{ uri: profileImgUri }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarLetter}>{profileData.fullName?.charAt(0) || "U"}</Text>
            </View>
          )}
          
          {isVolunteerProfile && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color="#FFF" />
            </View>
          )}
        </View>

        <Text style={styles.userName}>{profileData.fullName || "Unknown User"}</Text>
        
        <View style={[styles.roleTag, !isVolunteerProfile && { backgroundColor: '#F1F5F9' }]}>
          <FontAwesome5 
            name={isVolunteerProfile ? "hands-helping" : "user"} 
            size={12} 
            color={isVolunteerProfile ? "#007EA7" : "#64748B"} 
          />
          <Text style={[styles.roleText, !isVolunteerProfile && { color: '#64748B' }]}>
            {isVolunteerProfile ? "Verified Community Volunteer" : "Elderly Beneficiary"}
          </Text>
        </View>

        {isVolunteerProfile && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text> 
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Text style={styles.statValue}>4.9</Text>
                <Ionicons name="star" size={14} color="#FFC107" />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        )}
      </View>

      {/* --- DETAILS SECTION --- */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          
          <TouchableOpacity style={styles.infoRow} onPress={handleCall} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={18} color="#007EA7" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{profileData.phoneNumber || "Not provided"}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={18} color="#007EA7" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Base Location</Text>
              <Text style={styles.value}>{profileData.location || "Location not set"}</Text>
            </View>
          </View>
        </View>

        {!isVolunteerProfile && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical & Emergency</Text>
              
              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, {backgroundColor: '#FEF2F2'}]}>
                  <Ionicons name="water" size={18} color="#DC2626" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.label}>Blood Group</Text>
                  <Text style={styles.value}>{profileData.bloodGroup || "Not specified"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, {backgroundColor: '#FFFBEB'}]}>
                  <Ionicons name="medkit" size={18} color="#D97706" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.label}>Medical Conditions</Text>
                  <Text style={styles.value}>{profileData.conditions || "None reported"}</Text>
                </View>
              </View>

              {/* --- CALL GUARDIAN ROW --- */}
              {profileData.guardian && (
                <TouchableOpacity style={styles.infoRow} onPress={handleCallGuardian} activeOpacity={0.7}>
                  <View style={[styles.iconCircle, {backgroundColor: '#F0FDF4'}]}>
                    <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                  </View>
                  <View style={styles.infoText}>
                    <Text style={styles.label}>Primary Guardian</Text>
                    <Text style={styles.value}>{profileData.guardian}</Text>
                  </View>
                  <View style={styles.callIconSmall}>
                    <Ionicons name="call" size={16} color="#FFF" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
        )}

        <View style={{height: 100}} />
      </ScrollView>

      {/* --- FOOTER CALL BUTTON (Primary User) --- */}
      <View style={styles.footer}>
          <TouchableOpacity style={styles.callBigBtn} onPress={handleCall} activeOpacity={0.9}>
              <Ionicons name="call" size={24} color="#FFF" />
              <Text style={styles.callBigText}>Call {profileData.fullName?.split(' ')[0]}</Text>
          </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600' },

  headerBackground: {
    backgroundColor: '#007EA7',
    height: 160,
    paddingTop: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginTop: -60,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
    marginBottom: 24
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#F0F9FF', resizeMode: 'cover' },
  placeholderAvatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F0F9FF' },
  avatarLetter: { fontSize: 32, fontWeight: '800', color: '#007EA7' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007EA7', padding: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFF' },
  
  userName: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  roleTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 6 },
  roleText: { color: '#007EA7', fontWeight: '700', fontSize: 12 },

  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, marginTop: 20 },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: '80%', backgroundColor: '#F1F5F9' },

  scrollContent: { paddingHorizontal: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoText: { flex: 1 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  
  callIconSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFF', padding: 20, 
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10
  },
  callBigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 16, gap: 10 },
  callBigText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});