import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BannedScreen({ navigation }) {
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="warning" size={80} color="#DC2626" />
      <Text style={styles.title}>Account Suspended</Text>
      <Text style={styles.message}>
        Your account has been suspended due to violations of our community guidelines. 
        If you believe this is a mistake, please contact support.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnText}>Return to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#991B1B', marginTop: 20, marginBottom: 10 },
  message: { fontSize: 16, color: '#7F1D1D', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  btn: { backgroundColor: '#DC2626', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});