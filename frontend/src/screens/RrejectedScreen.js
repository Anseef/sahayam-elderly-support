import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RejectedScreen({ navigation }) {
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="close-circle" size={80} color="#DC2626" />
        </View>

        <Text style={styles.title}>Registration Declined</Text>
        
        <Text style={styles.subtitle}>
          Unfortunately, your volunteer application could not be approved at this time. This is usually due to a mismatch in Aadhaar details or incomplete verification.
        </Text>
        
        <View style={styles.infoBox}>
          <Ionicons name="mail-outline" size={20} color="#991B1B" />
          <Text style={styles.infoText}>
            If you believe this is a mistake, please contact our support team at support@sahayam.in.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#FECACA' },
  title: { fontSize: 26, fontWeight: '900', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  infoBox: { flexDirection: 'row', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#991B1B', lineHeight: 20, fontWeight: '500' },
  footer: { paddingHorizontal: 30, paddingBottom: 40 },
  logoutBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, backgroundColor: '#0F172A' },
  logoutBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});