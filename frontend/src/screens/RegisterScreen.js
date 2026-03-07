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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('elderly'); // Default role: 'elderly' or 'volunteer'
  
const handleRegister = async () => {
    // 1. Validation
    if (!name || aadhaar.length < 12 || phone.length < 10 || pin.length < 4 || !role) {
      Alert.alert(
        "Missing Info",
        "Please ensure all fields are filled correctly:\n• Aadhaar: 12 digits\n• Phone: 10 digits\n• PIN: 4 digits\n• Role Selected"
      );
      return;
    }

    try {
      // 2. API Call to Backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: name,
          aadhaarNumber: aadhaar,
          phoneNumber: phone,
          pin: pin,
          role: role,
        }),
      });

      const data = await response.json();

      // 4. Handle Response
      if (response.ok) {
        await AsyncStorage.removeItem('user');

        if (role === 'volunteer') {
          Alert.alert(
            "Step 1 Complete", 
            "Your account is created. Please upload your identity documents to proceed.", 
            [
              { 
                text: "Continue", 
                // Pass the insertedId to the KYC screen
                onPress: () => navigation.replace('KYCUploadScreen', { userId: data.userId }) 
              }
            ]
          );
        } else {
          Alert.alert(
            "Account Created", 
            "Welcome to Sahayam! Please log in to continue.", 
            [
              { text: "Log In", onPress: () => navigation.replace('Login') }
            ]
          );
        }
      } else {
        Alert.alert("Registration Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#37474F" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.subTitle}>Join the Sahayam community.</Text>

          <View style={styles.formContainer}>
            
            {/* ROLE SELECTION */}
            <View style={styles.roleContainer}>
              
              {/* Elderly Card */}
              <TouchableOpacity 
                style={[styles.roleCard, role === 'elderly' && styles.roleCardActive]} 
                onPress={() => setRole('elderly')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, role === 'elderly' ? styles.iconActive : styles.iconInactive]}>
                  <FontAwesome5 name="user" size={24} color={role === 'elderly' ? '#FFF' : '#78909C'} />
                </View>
                <Text style={[styles.roleText, role === 'elderly' && styles.roleTextActive]}>Elderly</Text>
              </TouchableOpacity>

              {/* Volunteer Card */}
              <TouchableOpacity 
                style={[styles.roleCard, role === 'volunteer' && styles.roleCardActive]} 
                onPress={() => setRole('volunteer')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, role === 'volunteer' ? styles.iconActive : styles.iconInactive]}>
                  <FontAwesome5 name="hands-helping" size={24} color={role === 'volunteer' ? '#FFF' : '#78909C'} />
                </View>
                <Text style={[styles.roleText, role === 'volunteer' && styles.roleTextActive]}>Volunteer</Text>
              </TouchableOpacity>

            </View>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={20} color="#78909C" />
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Saraswathi Amma" 
                value={name} 
                onChangeText={setName} 
              />
            </View>

            {/* Aadhaar Number */}
            <Text style={styles.label}>Aadhaar Number</Text>
            <View style={styles.inputGroup}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#78909C" />
              <TextInput 
                style={styles.input} 
                placeholder="12-digit Aadhaar Number" 
                keyboardType="numeric" 
                maxLength={12}
                value={aadhaar} 
                onChangeText={setAadhaar} 
              />
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={20} color="#78909C" />
              <TextInput 
                style={styles.input} 
                placeholder="10-digit Mobile Number" 
                keyboardType="phone-pad" 
                maxLength={10}
                value={phone} 
                onChangeText={setPhone} 
              />
            </View>

            {/* 4-Digit PIN */}
            <Text style={styles.label}>Set a 4-Digit PIN</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="key-outline" size={20} color="#78909C" />
              <TextInput 
                style={styles.input} 
                placeholder="****" 
                keyboardType="numeric" 
                maxLength={4}
                secureTextEntry
                value={pin} 
                onChangeText={setPin} 
              />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already a member?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 24, flexGrow: 1 },
  
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F7F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#007EA7' },
  subTitle: { fontSize: 16, color: '#78909C', marginTop: 8, marginBottom: 24 },

  formContainer: { gap: 16 }, // Reduced gap slightly to fit more content
  label: { fontSize: 14, fontWeight: '700', color: '#37474F', marginBottom: -8, marginLeft: 4 }, // Adjusted margin
  
  // Role Selector Styles
  roleContainer: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  roleCard: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 10
  },
  roleCardActive: {
    backgroundColor: '#E0F7FA',
    borderColor: '#007EA7',
  },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center'
  },
  iconInactive: { backgroundColor: '#ECEFF1' },
  iconActive: { backgroundColor: '#007EA7' },
  roleText: { fontSize: 16, fontWeight: '600', color: '#78909C' },
  roleTextActive: { color: '#007EA7', fontWeight: '800' },

  // Inputs
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#CFD8DC', gap: 12 },
  input: { flex: 1, fontSize: 16, color: '#263238', fontWeight: '500' },

  registerBtn: { backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 24, shadowColor: '#007EA7', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  registerBtnText: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 40, gap: 6 },
  footerText: { fontSize: 15, color: '#78909C' },
  loginLink: { fontSize: 15, color: '#007EA7', fontWeight: '800' },
});