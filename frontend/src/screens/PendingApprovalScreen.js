import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PendingApprovalScreen({ navigation }) {
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const handleRefresh = () => {
    // A simple UX trick: When they click refresh, send them to login to re-authenticate
    // This forces the app to hit the backend and get their latest account status
    handleLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.content}>
        {/* Animated-looking Icon Box */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-account-outline" size={70} color="#007EA7" />
          </View>
          <View style={styles.badge}>
            <Ionicons name="time" size={24} color="#FFF" />
          </View>
        </View>

        <Text style={styles.title}>Account Under Review</Text>
        
        <Text style={styles.subtitle}>
          For the safety and security of our elderly community, our admin team is currently verifying your Aadhaar details. 
        </Text>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0284C7" />
          <Text style={styles.infoText}>
            This process usually takes a few hours. Once verified, you will be able to access all features of Sahayam.
          </Text>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.8}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.refreshBtnText}>Check Status Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 30,
  },
  iconCircle: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: '#E0F2FE', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#BAE6FD'
  },
  badge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#F59E0B', // Warning Orange
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8FAFC'
  },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#1E293B', 
    marginBottom: 16,
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 30 
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center'
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
    fontWeight: '500'
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    gap: 16
  },
  refreshBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18, 
    borderRadius: 16, 
    backgroundColor: '#007EA7',
    gap: 8,
    shadowColor: '#007EA7',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  refreshBtnText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: 16 
  },
  logoutBtn: { 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18, 
    borderRadius: 16, 
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  logoutBtnText: { 
    color: '#64748B', 
    fontWeight: '700', 
    fontSize: 16 
  }
});