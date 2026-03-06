import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditVolunteerProfile({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- FETCH CURRENT DATA ---
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (!storedUser) return navigation.replace('Login');
        
        const parsedUser = JSON.parse(storedUser);
        const id = parsedUser.id || parsedUser._id;
        setUserId(id);

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${id}`);
        const data = await response.json();

        if (response.ok) {
          setFullName(data.fullName || '');
          setPhoneNumber(data.phoneNumber || '');
          setLocation(data.location || '');
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // --- SAVE LOGIC ---
  const handleSave = async () => {
    if (!fullName || !phoneNumber) {
      Alert.alert("Required", "Name and Phone Number cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      // Using your generic /profile/:id route!
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          location
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007EA7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.formCard}>
            
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="10-digit phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Base Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City or Neighborhood"
                placeholderTextColor="#94A3B8"
              />
            </View>

          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, saving && {opacity: 0.7}]} 
            onPress={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F8FAFC' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: {width: 0, height: 2}, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  scrollContent: { padding: 24 },
  
  formCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowOffset: {width: 0, height: 4}, shadowRadius: 8, elevation: 3 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  
  saveBtn: { backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#007EA7', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 10, elevation: 5 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});