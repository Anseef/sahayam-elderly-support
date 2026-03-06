import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function VolunteerEmergencyScreen({ navigation }) {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // --- PULSE ANIMATION FOR URGENCY ---
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const fetchEmergencies = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/available`);
      const data = await response.json();

      if (response.ok) {
        const emergencyTasks = data.filter(task => 
          (task.category === 'Emergency' || task.isEmergency === true) && 
          task.status === 'Pending'
        );
        setEmergencies(emergencyTasks);
      }
    } catch (error) {
      console.error("Emergency Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEmergencies();
      const interval = setInterval(fetchEmergencies, 10000); 
      return () => clearInterval(interval);
    }, [])
  );

  const handleAcceptEmergency = async (task) => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/accept/${task._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                volunteerId: currentUser.id || currentUser._id,
                volunteerName: currentUser.name || currentUser.fullName,
                volunteerImage: currentUser.profileImage 
            })
        });

        if (response.ok) {
            Alert.alert("Emergency Accepted!", "Please proceed to the location immediately.");
            navigation.replace('ServiceDetail', { task: { ...task, status: 'Accepted' }, isVolunteer: true });
        } else {
            Alert.alert("Error", "Could not accept request. Someone else may have taken it.");
            fetchEmergencies(); 
        }
    } catch (error) {
        Alert.alert("Network Error", "Check your connection.");
    } finally {
        setLoading(false);
    }
  };

  if (loading && emergencies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Scanning for Emergencies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ACTIVE ALERTS</Text>
        <View style={styles.headerIconBg}>
            <Ionicons name="warning" size={22} color="#DC2626" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {emergencies.length > 0 ? (
          emergencies.map(task => (
            <View key={task._id} style={styles.emergencyCard}>
              
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.urgentBadge}>
                    <Animated.View style={[styles.pulsingDot, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={styles.urgentText}>URGENT SOS</Text>
                </View>
                <Text style={styles.cardTime}>
                  {new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>

              {/* Name Details */}
              <Text style={styles.requesterName}>{task.requesterName || "Elderly User"}</Text>
              <Text style={styles.subText}>Has triggered an emergency alert and requires immediate assistance.</Text>
              
              {/* Location Box */}
              <View style={styles.locationBox}>
                <View style={styles.locIconWrap}>
                    <Ionicons name="location" size={22} color="#DC2626" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.locLabel}>Exact Location</Text>
                    <Text style={styles.locationText}>{task.curr_location || task.location || "Location Unknown"}</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={() => handleAcceptEmergency(task)}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptBtnText}>RESPOND NOW</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
              
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shield-checkmark" size={60} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySub}>There are no emergency requests in your area right now. Thank you for being on standby.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, 
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 16, color: '#DC2626', fontWeight: '700', fontSize: 16 },

  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: '#DC2626', 
    paddingTop: 55, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#DC2626', shadowOpacity: 0.4, shadowOffset: {width: 0, height: 6}, shadowRadius: 12, elevation: 10
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
  headerIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 24, paddingTop: 30 },

  emergencyCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#DC2626', shadowOpacity: 0.12, shadowOffset: {width: 0, height: 8}, shadowRadius: 16, elevation: 6
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 8 },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  urgentText: { color: '#DC2626', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  cardTime: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  
  requesterName: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  subText: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 24 },
  
  locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  locIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  locLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  locationText: { fontSize: 16, fontWeight: '700', color: '#1E293B', lineHeight: 22 },

  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626', paddingVertical: 20, borderRadius: 20, gap: 12, shadowColor: '#DC2626', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset:{width:0, height:6}, elevation: 6 },
  acceptBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#D1FAE5' },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#065F46', marginBottom: 12 },
  emptySub: { fontSize: 16, color: '#64748B', textAlign: 'center', paddingHorizontal: 30, lineHeight: 24 },
});