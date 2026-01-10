import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'; // Standard Expo Icons

export default function ElderlyDashboard({navigation}) {
  
  // Dummy Data for Active Tasks (Non-completed)
  const [activeTasks, setActiveTasks] = useState([
    { id: '1', title: 'Grocery Run', date: 'Today, 10:00 AM', status: 'Pending', location: 'Lulu Mall' },
    { id: '2', title: 'Hospital Visit', date: 'Tomorrow, 09:00 AM', status: 'Accepted', location: 'General Hospital' },
  ]);

  // Dummy Data for Completed Tasks
  const [completedTasks, setCompletedTasks] = useState([
    { id: '3', title: 'Medicine Pickup', date: 'Yesterday', status: 'Completed', volunteer: 'Arun K.' },
    { id: '4', title: 'Utility Bill Payment', date: '08 Jan 2026', status: 'Completed', volunteer: 'Sneha R.' },
  ]);

  // Render a single task card
  const renderTaskCard = ({ item, isCompleted }) => (
    <TouchableOpacity 
    activeOpacity={0.9}
    onPress={() => navigation.navigate('ServiceDetail', { task: item })}
    >
        <View style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
            <FontAwesome5 
                name={item.title.includes("Hospital") ? "hospital" : "shopping-basket"} 
                size={20} 
                color={isCompleted ? "#78909C" : "#007EA7"} 
            />
            </View>
            <View style={styles.cardContent}>
            <Text style={[styles.taskTitle, isCompleted && styles.completedText]}>{item.title}</Text>
            <Text style={styles.taskDate}>{item.date}</Text>
            </View>
            <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'Pending' ? '#FFF3E0' : (isCompleted ? '#E8F5E9' : '#E3F2FD') }
            ]}>
            <Text style={[
                styles.statusText, 
                { color: item.status === 'Pending' ? '#EF6C00' : (isCompleted ? '#2E7D32' : '#1565C0') }
            ]}>
                {item.status}
            </Text>
            </View>
        </View>
        {!isCompleted && (
            <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#546E7A" />
            <Text style={styles.locationText}>{item.location}</Text>
            </View>
        )}
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.addressSection}>
            
            {/* Wrap this part in TouchableOpacity */}
            <TouchableOpacity 
            style={styles.addressTitleRow} 
            onPress={() => navigation.navigate('LocationSelectScreen')}
            >
            <Ionicons name="home" size={18} color="#007EA7" />
            <Text style={styles.addressLabel}>Home</Text>
            <Ionicons name="chevron-down" size={16} color="#546E7A" />
            </TouchableOpacity>

            <Text style={styles.addressText} numberOfLines={1}>
            Pathanamthitta, Kerala, India
            </Text>
        </View>
                
        <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('ElderProfile')}
        >
          <Ionicons name="person-circle-outline" size={32} color="#007EA7" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: ACTIVE REQUESTS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          {activeTasks.length > 0 ? (
            activeTasks.map(task => <View key={task.id}>{renderTaskCard({ item: task, isCompleted: false })}</View>)
          ) : (
            <Text style={styles.emptyText}>No active requests.</Text>
          )}
        </View>

        {/* --- SECTION 2: HISTORY --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past History</Text>
          {completedTasks.length > 0 ? (
            completedTasks.map(task => <View key={task.id}>{renderTaskCard({ item: task, isCompleted: true })}</View>)
          ) : (
            <Text style={styles.emptyText}>No history available.</Text>
          )}
        </View>
        
        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />

      </ScrollView>

      {/* --- FAB: ADD BUTTON --- */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => alert("Navigate to 'Add Request' Screen")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FB",
  },
  scrollContent: {
    padding: 20,
  },
  
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF1",
  },
  addressSection: {
    flex: 1,
    marginRight: 10,
  },
  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A1E29",
  },
  addressText: {
    fontSize: 13,
    color: "#546E7A",
  },
  profileButton: {
    padding: 4,
  },

  // Section Styles
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A1E29",
    marginBottom: 15,
  },
  emptyText: {
    color: "#90A4AE",
    fontStyle: "italic",
  },

  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#007EA7",
  },
  completedCard: {
    backgroundColor: "#F9FAFB",
    borderLeftColor: "#CFD8DC",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A1E29",
  },
  completedText: {
    color: "#78909C",
    textDecorationLine: "line-through",
  },
  taskDate: {
    fontSize: 12,
    color: "#78909C",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 52, // Align with text
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#546E7A",
  },

  // FAB Styles
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007EA7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007EA7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});