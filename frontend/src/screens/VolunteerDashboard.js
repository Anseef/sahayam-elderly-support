import React, { useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; 

const { width } = Dimensions.get('window');

// --- DATE FORMATTER HELPER ---
const formatDateTime = (dateString) => {
  if (!dateString) return "No date provided";

  if (typeof dateString === 'string' && /^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(dateString.trim())) {
    const parts = dateString.trim().split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; 
    return `${hours}:${minutes} ${ampm}`;
  }

  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${formattedDate} • ${formattedTime}`;
  }
  return dateString;
};

export default function VolunteerDashboard({ navigation }) {
  
  const [activeTab, setActiveTab] = useState('feed'); 
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- FILTER & SORT STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaid, setFilterPaid] = useState('all'); // 'all', 'paid', 'free'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser.id || parsedUser._id;

      const profileUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`;
      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();
      setCurrentUser(profileResponse.ok ? profileData : parsedUser);

      const feedUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/available`;
      const feedRes = await fetch(feedUrl);
      const feedData = await feedRes.json();
      if (feedRes.ok) setAvailableTasks(feedData);

      const myTasksUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/volunteer/${userId}`;
      const myTasksRes = await fetch(myTasksUrl);
      const myTasksData = await myTasksRes.json();
      
      if (myTasksRes.ok) {
        setMyTasks(myTasksData.active || []);
        setHistoryTasks(myTasksData.history || []);
      }

    } catch (error) {
      console.error("Volunteer Dashboard Error:", error);
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

  // --- APPLY FILTERS & SORTING ---
  const filteredAvailableTasks = useMemo(() => {
    let result = [...availableTasks];

    // 1. Search Location Filter
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(task => {
        const currLocMatch = task.curr_location && task.curr_location.toLowerCase().includes(lowerQuery);
        const typedLocMatch = task.location && task.location.toLowerCase().includes(lowerQuery);
        return currLocMatch || typedLocMatch;
      });
    }

    // 2. Paid / Free Filter
    if (filterPaid === 'paid') {
      result = result.filter(task => task.isPaid === true);
    } else if (filterPaid === 'free') {
      result = result.filter(task => !task.isPaid);
    }

    // 3. Sort by Distance (Base Location Match) AND Date
    const userLocation = currentUser?.location ? currentUser.location.toLowerCase().trim() : '';

    result.sort((a, b) => {
      // Prioritize tasks matching volunteer's base location
      if (userLocation) {
        const aLoc = (a.curr_location || a.location || '').toLowerCase();
        const bLoc = (b.curr_location || b.location || '').toLowerCase();
        
        const aMatches = aLoc.includes(userLocation);
        const bMatches = bLoc.includes(userLocation);

        if (aMatches && !bMatches) return -1; // A comes first
        if (!aMatches && bMatches) return 1;  // B comes first
      }

      // If location logic ties (both match or both don't), sort by date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [availableTasks, searchQuery, filterPaid, sortOrder, currentUser]);


  // --- UI HELPERS ---
  const getCategoryIcon = (category) => {
    switch (category) {
        case "Health": return "heartbeat";
        case "Transport": return "car";
        case "Groceries": return "shopping-basket";
        case "Medicine": return "pills";
        case "Emergency": return "exclamation-triangle";
        default: return "hands-helping";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return { bg: '#FFF7ED', text: '#EA580C' };
      case 'Accepted': return { bg: '#EFF6FF', text: '#2563EB' };
      case 'Completed': return { bg: '#F0FDF4', text: '#16A34A' };
      default: return { bg: '#F8FAFC', text: '#64748B' };
    }
  };

  const renderTaskCard = ({ item, isHistory }) => {
    const statusColors = getStatusColor(item.status);
    const rawDate = item.dateTime || item.createdAt;
    
    // Check if this specific task matches the user's base location
    const userLocation = currentUser?.location ? currentUser.location.toLowerCase().trim() : '';
    const itemLocationStr = (item.curr_location || item.location || '').toLowerCase();
    
    const isNearby = userLocation && itemLocationStr.includes(userLocation) && !isHistory;
    const isEmergency = item.category === 'Emergency' || item.isEmergency;
    
    // --- NEW: Only show the red card body if it's an ACTIVE emergency ---
    const isActiveEmergency = isEmergency && !isHistory;

    return (
      <TouchableOpacity 
        activeOpacity={0.95}
        onPress={() => navigation.navigate('ServiceDetail', { task: item, isVolunteer: true })}
        style={styles.cardContainer}
      >
        {isNearby && !isEmergency && (
           <View style={styles.nearbyBadgeTop}>
               <Ionicons name="flash" size={12} color="#FFF" />
               <Text style={styles.nearbyTextTop}>Near You</Text>
           </View>
        )}
        
        {/* Urgent Tag remains regardless of history status */}
        {isEmergency && (
           <View style={[styles.nearbyBadgeTop, { backgroundColor: '#DC2626' }]}>
               <Ionicons name="warning" size={12} color="#FFF" />
               <Text style={styles.nearbyTextTop}>URGENT</Text>
           </View>
        )}
        
        <View style={[styles.card, isNearby && styles.cardHighlight, isActiveEmergency && { borderColor: '#FECACA', borderWidth: 2 }]}>
          <View style={styles.cardRow}>
            {/* Icon Box */}
            <View style={[styles.iconBox, isHistory && styles.iconBoxHistory, isActiveEmergency && { backgroundColor: '#FEF2F2' }]}>
              <FontAwesome5 
                name={getCategoryIcon(item.category)} 
                size={20} 
                color={isHistory ? "#94A3B8" : (isEmergency ? "#DC2626" : "#007EA7")} 
              />
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, isHistory && styles.textHistory, isActiveEmergency && { color: '#DC2626' }]}>
                {item.category}
              </Text>
              <Text style={styles.cardDate}>
                {formatDateTime(rawDate)}
              </Text>
            </View>

            {/* Status or Action Badge */}
            {activeTab === 'feed' ? (
                <View style={[styles.acceptBadge, isActiveEmergency && { backgroundColor: '#DC2626' }]}>
                    <Text style={styles.acceptText}>View</Text>
                    <Ionicons name="arrow-forward" size={12} color="#FFF" />
                </View>
            ) : (
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {item.status}
                    </Text>
                </View>
            )}
          </View>

          {/* Location Footer */}
          <View style={styles.cardFooter}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.locationText} numberOfLines={1}>
                  {item.location && item.location !== "Voice Request Location" && item.location !== "Voice Request" 
                     ? item.location 
                     : (item.curr_location || "Voice Location")}
              </Text>
              
              {/* Show "Paid" tag if relevant */}
              {item.isPaid && (
                  <View style={styles.miniPaidTag}>
                      <Text style={styles.miniPaidText}>₹{item.paymentAmount}</Text>
                  </View>
              )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Check if there are active emergencies for the red notification dot
  const hasEmergencies = availableTasks.some(t => t.category === 'Emergency' || t.isEmergency === true);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#007EA7" />

      {/* --- HEADER BLOCK --- */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTopRow}>
            <View>
                <Text style={styles.greetingText}>Welcome Volunteer,</Text>
                <Text style={styles.userNameText}>{currentUser?.fullName || "Helper"}</Text>
            </View>

            {/* --- EMERGENCY ALERTS / NOTIFICATION BUTTON --- */}
            <TouchableOpacity 
                style={styles.notificationBtn}
                onPress={() => navigation.navigate('VolunteerEmergencyScreen')}
                activeOpacity={0.8}
            >
                <Ionicons name="notifications" size={24} color="#FFF" />
                {hasEmergencies && (
                    <View style={styles.notificationDot} />
                )}
            </TouchableOpacity>
        </View>

        {/* --- TABS --- */}
        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'feed' && styles.activeTab]}
                onPress={() => setActiveTab('feed')}
            >
                <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>New Requests</Text>
                {availableTasks.length > 0 && (
                    <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{availableTasks.length}</Text></View>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'myTasks' && styles.activeTab]}
                onPress={() => setActiveTab('myTasks')}
            >
                <Text style={[styles.tabText, activeTab === 'myTasks' && styles.activeTabText]}>My Tasks</Text>
                {myTasks.length > 0 && (
                    <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{myTasks.length}</Text></View>
                )}
            </TouchableOpacity>
        </View>
      </View>

      {/* --- CONTENT CONTAINER --- */}
      <View style={styles.contentContainer}>
        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007EA7"]} />}
        >
            
            {loading ? (
                <ActivityIndicator size="large" color="#007EA7" style={{ marginTop: 40 }} />
            ) : (
                <>
                    {/* --- FEED VIEW (WITH SEARCH & FILTERS) --- */}
                    {activeTab === 'feed' && (
                        <>
                            {/* SEARCH BAR & SORT */}
                            <View style={styles.searchSortContainer}>
                                <View style={styles.searchBar}>
                                    <Ionicons name="search" size={20} color="#94A3B8" style={{marginLeft: 4}} />
                                    <TextInput 
                                        style={styles.searchInput}
                                        placeholder="Search by location..."
                                        placeholderTextColor="#94A3B8"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                
                                <TouchableOpacity 
                                    style={styles.sortBtn} 
                                    onPress={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                >
                                    <Ionicons name="calendar-outline" size={18} color="#007EA7" />
                                    <Ionicons name={sortOrder === 'newest' ? "arrow-down" : "arrow-up"} size={14} color="#007EA7" />
                                </TouchableOpacity>
                            </View>

                            {/* FILTER CHIPS */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
                                <TouchableOpacity 
                                    style={[styles.filterChip, filterPaid === 'all' && styles.filterChipActive]} 
                                    onPress={() => setFilterPaid('all')}
                                >
                                    <Text style={[styles.filterChipText, filterPaid === 'all' && styles.filterChipTextActive]}>All Requests</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.filterChip, filterPaid === 'paid' && styles.filterChipActive]} 
                                    onPress={() => setFilterPaid('paid')}
                                >
                                    <Text style={[styles.filterChipText, filterPaid === 'paid' && styles.filterChipTextActive]}>Paid Only</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.filterChip, filterPaid === 'free' && styles.filterChipActive]} 
                                    onPress={() => setFilterPaid('free')}
                                >
                                    <Text style={[styles.filterChipText, filterPaid === 'free' && styles.filterChipTextActive]}>Free Service</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Requests</Text>
                                <Text style={styles.resultCountText}>{filteredAvailableTasks.length} found</Text>
                            </View>
                            
                            {/* RENDER TASKS */}
                            {filteredAvailableTasks.length > 0 ? (
                                filteredAvailableTasks.map(task => <View key={task._id}>{renderTaskCard({ item: task, isHistory: false })}</View>)
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Ionicons name={availableTasks.length === 0 ? "search" : "filter"} size={40} color="#CBD5E1" />
                                    <Text style={styles.emptyTitle}>
                                        {availableTasks.length === 0 ? "No new requests" : "No exact matches"}
                                    </Text>
                                    <Text style={styles.emptySub}>
                                        {availableTasks.length === 0 
                                            ? "Check back later for people needing help."
                                            : "Try adjusting your search or filters."}
                                    </Text>
                                    {availableTasks.length > 0 && (
                                        <TouchableOpacity style={styles.clearFilterBtn} onPress={() => {setSearchQuery(''); setFilterPaid('all');}}>
                                            <Text style={styles.clearFilterText}>Clear Filters</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </>
                    )}

                    {/* --- MY TASKS VIEW (NO FILTERS NEEDED HERE TYPICALLY) --- */}
                    {activeTab === 'myTasks' && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>In Progress</Text>
                            </View>
                            {myTasks.length > 0 ? (
                                myTasks.map(task => <View key={task._id}>{renderTaskCard({ item: task, isHistory: false })}</View>)
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Ionicons name="checkmark-done-circle-outline" size={40} color="#CBD5E1" />
                                    <Text style={styles.emptyTitle}>No active tasks</Text>
                                    <Text style={styles.emptySub}>Accept a request from the feed to get started.</Text>
                                </View>
                            )}

                            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                                <Text style={styles.sectionTitle}>Completed History</Text>
                            </View>
                            {historyTasks.length > 0 ? (
                                historyTasks.map(task => <View key={task._id}>{renderTaskCard({ item: task, isHistory: true })}</View>)
                            ) : (
                                <Text style={styles.noHistoryText}>No completed tasks yet.</Text>
                            )}
                        </>
                    )}
                </>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#007EA7" },

  // --- HEADER ---
  headerBlock: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 24, backgroundColor: "#007EA7" },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greetingText: { fontSize: 16, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  userNameText: { fontSize: 26, color: "#FFF", fontWeight: "800" },
  
  notificationBtn: { 
      width: 44, height: 44, borderRadius: 22, 
      backgroundColor: 'rgba(255, 255, 255, 0.2)', 
      alignItems: 'center', justifyContent: 'center', 
  },
  notificationDot: { 
      position: 'absolute', top: 10, right: 10, 
      width: 12, height: 12, borderRadius: 6, 
      backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#007EA7' 
  },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  activeTab: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#007EA7', fontWeight: '800' },
  tabBadge: { backgroundColor: '#FF5252', paddingHorizontal: 6, borderRadius: 8, height: 16, justifyContent: 'center' },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  // --- CONTENT ---
  contentContainer: { flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: "hidden" },
  scrollContent: { padding: 24, paddingTop: 20 },

  // Filters & Search
  searchSortContainer: { flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 4 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#64748B', shadowOpacity: 0.04, shadowOffset: {width: 0, height: 2}, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A' },
  sortBtn: { width: 52, backgroundColor: '#E0F2FE', borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2, borderWidth: 1, borderColor: '#BAE6FD' },
  
  chipScroll: { marginBottom: 24 },
  chipContent: { gap: 10, paddingRight: 20 }, 
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#007EA7', borderColor: '#007EA7' },
  filterChipText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  filterChipTextActive: { color: '#FFF', fontWeight: '800' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  resultCountText: { fontSize: 13, fontWeight: "600", color: "#94A3B8", marginBottom: 2 },

  // Cards
  cardContainer: { marginBottom: 16, position: 'relative' },
  nearbyBadgeTop: { position: 'absolute', top: -10, left: 16, zIndex: 10, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  nearbyTextTop: { color: '#FFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: "#F1F5F9" },
  cardHighlight: { borderColor: '#10B981', borderWidth: 1.5 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#E0F2FE", alignItems: "center", justifyContent: "center", marginRight: 16 },
  iconBoxHistory: { backgroundColor: "#F1F5F9" },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  textHistory: { color: "#64748B" },
  cardDate: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },

  // Badges
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  acceptBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#007EA7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  acceptText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F8FAFC", flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 13, color: "#64748B", flex: 1 },
  miniPaidTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  miniPaidText: { color: '#166534', fontSize: 11, fontWeight: '700' },

  // Empty States
  emptyCard: { alignItems: "center", padding: 30, backgroundColor: "#FFF", borderRadius: 20, borderStyle: "dashed", borderWidth: 2, borderColor: "#E2E8F0" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#475569", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#94A3B8", marginTop: 4, textAlign: 'center' },
  clearFilterBtn: { marginTop: 16, backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  clearFilterText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  noHistoryText: { textAlign: "center", color: "#94A3B8", marginTop: 20, fontStyle: "italic" },
});