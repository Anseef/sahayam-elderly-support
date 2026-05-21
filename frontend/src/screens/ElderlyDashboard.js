import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; 

export default function ElderlyDashboard({ navigation }) {
  
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLabel, setCurrentLabel] = useState("Home");
  const [currentIcon, setCurrentIcon] = useState("home");

  // --- FETCH DATA FUNCTION ---
  const fetchData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser.id || parsedUser._id; 
      
      const profileUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`;
      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      if (profileResponse.ok) {
        setCurrentUser(profileData);
        
        const activeLocation = profileData.location;
        const savedList = profileData.savedAddresses || [];
        const matchingAddress = savedList.find(addr => addr.address === activeLocation);
        
        if (matchingAddress) {
            setCurrentLabel(matchingAddress.label);
            setCurrentIcon(matchingAddress.icon || "location");
        } else if (activeLocation) {
            setCurrentLabel("Current Location"); 
            setCurrentIcon("location");
        } else {
            setCurrentLabel("Home"); 
            setCurrentIcon("home");
        }

      } else {
        setCurrentUser(parsedUser);
      }

      const requestsUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/requests/user/${userId}`;
      const requestResponse = await fetch(requestsUrl);
      const requestData = await requestResponse.json();

      if (requestResponse.ok) {
        setActiveTasks(requestData.active);
        setCompletedTasks(requestData.history);
      } 

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return { bg: '#FFF3E0', text: '#EF6C00', dot: '#EF6C00' };
      case 'Accepted': return { bg: '#E0F2FE', text: '#0284C7', dot: '#0284C7' };
      case 'Completed': return { bg: '#E8F5E9', text: '#2E7D32', dot: '#2E7D32' };
      default: return { bg: '#F1F5F9', text: '#64748B', dot: '#64748B' };
    }
  };

  const renderTaskCard = ({ item, isHistory }) => {
    const statusColors = getStatusColor(item.status);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ServiceDetail', { task: item })}
        style={styles.cardContainer}
      >
        <View style={[styles.card, isHistory && styles.completedCard]}>
          
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, isHistory && styles.iconBoxCompleted]}>
              <FontAwesome5 
                name={
                  item.category === "Health" ? "heartbeat" : 
                  item.category === "Transport" ? "car" : 
                  item.category === "Emergency" ? "exclamation-triangle" : // ADDED EMERGENCY ICON
                  "shopping-basket" // Default for Groceries/Others
                } 
                size={22} 
                color={
                  isHistory ? "#94A3B8" : 
                  item.category === "Emergency" ? "#007EA7" : // Make Emergency icon red
                  "#007EA7"
                } 
              />
            </View>
            
            <View style={styles.cardTextContent}>
              <Text style={[styles.taskTitle, isHistory && styles.textCompleted]}>
                {item.category}
              </Text>
              
              <Text style={styles.taskDate}>
                {new Date(item.createdAt).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                })}
              </Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {item.status}
              </Text>
            </View>
          </View>

          {!isHistory && (
            <View style={styles.cardFooter}>
              <View style={styles.locationBadge}>
                <Ionicons name="location-sharp" size={14} color="#64748B" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.curr_location || "View details for location"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
      <View style={styles.addressSection}>
            <TouchableOpacity
              style={styles.addressTitleRow}
              onPress={() => navigation.navigate('LocationSelectScreen')}
            >
              {/* --- DYNAMIC ICON LOGIC --- */}
              {currentIcon === 'home' || currentIcon === 'location' || currentIcon === 'briefcase'? (
                <Ionicons name={currentIcon} size={18} color="#007EA7" />
              ) : (
                <FontAwesome5 name={currentIcon} size={16} color="#007EA7" />
              )}
              
              <Text style={styles.addressLabel}>{currentLabel}</Text>
              <Ionicons name="chevron-down" size={16} color="#546E7A" />
            </TouchableOpacity>
            
            <Text style={styles.addressText} numberOfLines={1}>
              {currentUser?.location || currentUser?.name || "No Location"}
            </Text>
        </View>

        <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ElderProfile')}
        >
          {/* --- FIXED IMAGE RENDERING --- */}
          {currentUser?.profileImage ? (
             <Image 
               source={{ uri: currentUser.profileImage }} 
               style={styles.headerProfileImage} 
             />
          ) : (
             <Ionicons name="person" size={24} color="#007EA7" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* LOADING STATE */}
        {loading ? (
          <ActivityIndicator size="large" color="#007EA7" style={{marginTop: 50}} />
        ) : (
          <>
            {/* ACTIVE REQUESTS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Requests</Text>
              {activeTasks.length > 0 ? (
                activeTasks.map(task => (
                  <View key={task._id}>{renderTaskCard({ item: task, isHistory: false })}</View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No active requests.</Text>
                </View>
              )}
            </View>

            {/* HISTORY */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent History</Text>
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <View key={task._id}>{renderTaskCard({ item: task, isHistory: true })}</View>
                ))
              ) : (
                <View style={styles.emptyState}>
                   <Ionicons name="time-outline" size={40} color="#CBD5E1" />
                   <Text style={styles.emptyText}>No history yet.</Text>
                </View>
              )}
            </View>
          </>
        )}
        
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddServiceScreen')}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ECEFF1" },
  addressSection: { flex: 1, marginRight: 10 },
  addressTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  addressLabel: { fontSize: 16, fontWeight: "700", color: "#0A1E29" },
  addressText: { fontSize: 13, color: "#546E7A" },
  
  // --- UPDATED PROFILE BUTTON STYLES ---
  profileButton: {
    width: 44,
    height: 44,
    backgroundColor: "#E0F2FE",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: 'hidden', // Crucial for clipping the image
    borderWidth: 1,
    borderColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  headerProfileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // -------------------------------------

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 16, marginLeft: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#FFF', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
  emptyText: { marginTop: 8, color: "#94A3B8", fontSize: 14 },
  cardContainer: { marginBottom: 14, shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16 },
  completedCard: { backgroundColor: "#FCFCFC", opacity: 0.9 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#E0F2FE", alignItems: "center", justifyContent: "center", marginRight: 14 },
  iconBoxCompleted: { backgroundColor: "#F1F5F9" },
  cardTextContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  textCompleted: { color: "#64748B", textDecorationLine: 'line-through' },
  taskDate: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  fab: { position: "absolute", bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: "#007EA7", alignItems: "center", justifyContent: "center", shadowColor: "#007EA7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
});