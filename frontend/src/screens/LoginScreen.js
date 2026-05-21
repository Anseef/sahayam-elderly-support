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
  ActivityIndicator,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
 
  const handleLogin = async () => {
    if (!phone || !pin) {
      Alert.alert("Missing Info", "Please enter both your phone number and PIN.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, pin })
      });

      const data = await response.json();

      if (response.ok) {
        // Save auth data
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        // 1. CHECK FOR BANNED USERS
        if (data.user.accountStatus === 'terminated') {
            navigation.replace('BannedScreen');
            return;
        }

        // 2. CHECK FOR ADMIN
        if (data.user.role === 'admin') {
            navigation.replace('AdminDashboard');
            return;
        }

        // 3. CHECK FOR PENDING APPROVAL
        if (data.user.accountStatus === 'pending') {
            // Alert.alert(
            //   "Account Pending", 
            //   "Your account is currently under review by the admin. Please check back later."
            // );
            navigation.replace('PendingApprovalScreen')
            return; 
        }
        // 2. CHECK FOR REJECTED KYC
        if (data.user.accountStatus === 'rejected') {
            navigation.replace('RejectedScreen');
            return;
        }

        // 4. ROUTE APPROVED USERS TO RESPECTIVE DASHBOARDS
        if (data.user.role === 'volunteer') {
            navigation.replace('VolunteerDashboard');
        } else {
            navigation.replace('MainTabs');
        }

      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Network Error", "Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007EA7" />
      
      {/* 1. TOP BRANDING SECTION */}
      <View style={styles.headerContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="heart" size={50} color="#007EA7" />
        </View>
        <Text style={styles.headerTitle}>Sahayam</Text>
        <Text style={styles.headerSubtitle}>Here to help, anytime.</Text>
      </View>

      {/* 2. BOTTOM FORM SECTION */}
      <View style={styles.formContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.formContent}>
            
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>Please sign in to continue</Text>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={20} color="#90A4AE" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#CFD8DC"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>
            </View>

            {/* PIN Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Security PIN</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#90A4AE" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 4-digit PIN"
                  placeholderTextColor="#CFD8DC"
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  value={pin}
                  onChangeText={setPin}
                  maxLength={4}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
                  <Ionicons name={showPin ? "eye-off-outline" : "eye-outline"} size={20} color="#90A4AE" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to Sahayam? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>Create Account</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#007EA7' },
  
  // Header Styles
  headerContainer: {
    height: height * 0.35, // Takes up top 35%
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007EA7',
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height:4}
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  headerSubtitle: { fontSize: 16, color: '#E0F7FA', marginTop: 5, fontWeight: '500' },

  // Form Styles
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    elevation: 20, // Strong shadow for the card effect
  },
  formContent: { flex: 1 },
  
  welcomeText: { fontSize: 26, fontWeight: '800', color: '#1E293B', marginBottom: 5 },
  instructionText: { fontSize: 14, color: '#90A4AE', marginBottom: 30 },

  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#546E7A', marginBottom: 8, marginLeft: 4 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    height: 56, paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '600' },
  eyeIcon: { padding: 4 },

  loginBtn: {
    backgroundColor: '#007EA7',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007EA7', shadowOpacity: 0.4, shadowOffset: {width: 0, height: 4}, shadowRadius: 10, elevation: 8
  },
  loginBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B', fontSize: 14 },
  registerText: { color: '#007EA7', fontWeight: '800', fontSize: 14 },
});