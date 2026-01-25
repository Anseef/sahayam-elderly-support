import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state

  const handleLogin = async () => {
    // 1. Basic Validation
    if (phone.length < 10 || pin.length < 4) {
      Alert.alert("Invalid Input", "Please enter a valid phone number and 4-digit PIN.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone,
          pin: pin,
        }),
      });

      const data = await response.json();

      setLoading(false); // Stop loading

      // 3. Handle Response
      if (response.ok) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user)); 

        const userRole = data.user.role;
        if (userRole === 'volunteer') navigation.replace('VolunteerDashboard');
        else if (userRole === 'admin') navigation.replace('AdminDashboard');
        else navigation.replace('MainTabs'); 

      } else {
        // Show error from backend (e.g., "Invalid PIN")
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }

    } catch (error) {
      setLoading(false);
      console.error("Login Error:", error);
      Alert.alert("Network Error", "Could not connect to the server. Check your IP.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          
          {/* LOGO AREA */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart-circle" size={80} color="#007EA7" />
            </View>
            <Text style={styles.appName}>Sahayam</Text>
            <Text style={styles.tagline}>Caring for you, always.</Text>
          </View>

          {/* FORM AREA */}
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            
            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={20} color="#546E7A" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#B0BEC5"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </View>

            {/* PIN Input */}
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color="#546E7A" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="4-Digit PIN"
                placeholderTextColor="#B0BEC5"
                keyboardType="numeric"
                secureTextEntry={!showPin}
                value={pin}
                onChangeText={setPin}
                maxLength={4}
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                <Ionicons name={showPin ? "eye-off-outline" : "eye-outline"} size={20} color="#B0BEC5" />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create New</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { backgroundColor: '#E0F7FA', borderRadius: 50, padding: 4, marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: '800', color: '#007EA7' },
  tagline: { fontSize: 16, color: '#546E7A', marginTop: 4 },

  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  welcomeText: { fontSize: 20, fontWeight: '700', color: '#263238', marginBottom: 24, textAlign: 'center' },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7F9', borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 16, borderWidth: 1, borderColor: '#ECEFF1' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#263238', fontWeight: '500' },
  
  loginBtn: { backgroundColor: '#007EA7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8, elevation: 2 },
  loginBtnDisabled: { backgroundColor: '#90A4AE' }, // Disabled color
  loginBtnText: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 6 },
  footerText: { fontSize: 15, color: '#546E7A' },
  registerLink: { fontSize: 15, color: '#007EA7', fontWeight: '800' },
});