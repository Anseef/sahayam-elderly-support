import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ElderlyDashboard({navigation}) {
  
  const [activeTasks, setActiveTasks] = useState([
    { id: '1', title: 'Grocery Run', date: 'Today, 10:00 AM', status: 'Pending', location: 'Lulu Mall' },
    { id: '2', title: 'Hospital Visit', date: 'Tomorrow, 09:00 AM', status: 'Accepted', volunteer: 'Sam', location: 'General Hospital' },
  ]);

  const [completedTasks, setCompletedTasks] = useState([
    { id: '3', title: 'Medicine Pickup', date: 'Yesterday', status: 'Completed', volunteer: 'Arun K.' },
    { id: '4', title: 'Utility Bill Payment', date: '08 Jan 2026', status: 'Completed', volunteer: 'Sneha R.' },
  ]);

  const getStatusColor = (status, isCompleted) => {
    if (status === 'Pending') return { bg: '#FFF3E0', text: '#EF6C00', dot: '#EF6C00' };
    if (isCompleted) return { bg: '#E8F5E9', text: '#2E7D32', dot: '#2E7D32' };
    return { bg: '#E0F2FE', text: '#0284C7', dot: '#0284C7' }; // Accepted
  };

  const renderTaskCard = ({ item, isCompleted }) => {
    const statusColors = getStatusColor(item.status, isCompleted);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ServiceDetail', { task: item })}
        style={styles.cardContainer}
      >
        <View style={[styles.card, isCompleted && styles.completedCard]}>
          
          {/* Card Top: Icon & Title */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, isCompleted && styles.iconBoxCompleted]}>
              <FontAwesome5 
                name={item.title.includes("Hospital") ? "hospital" : "shopping-basket"} 
                size={22} 
                color={isCompleted ? "#94A3B8" : "#007EA7"} 
              />
            </View>
            
            <View style={styles.cardTextContent}>
              <Text style={[styles.taskTitle, isCompleted && styles.textCompleted]}>{item.title}</Text>
              <Text style={styles.taskDate}>{item.date}</Text>
            </View>

            {/* Status Pill */}
            <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Card Bottom: Location (If Active) */}
          {!isCompleted && (
            <View style={styles.cardFooter}>
              <View style={styles.locationBadge}>
                <Ionicons name="location-sharp" size={14} color="#64748B" />
                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
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
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.addressSection}>
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
          <Ionicons name="person" size={32} color="#007EA7" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: ACTIVE REQUESTS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          {activeTasks.length > 0 ? (
            activeTasks.map(task => <View key={task.id}>{renderTaskCard({ item: task, isCompleted: false })}</View>)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>No active requests right now.</Text>
            </View>
          )}
        </View>

        {/* --- SECTION 2: HISTORY --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {completedTasks.length > 0 ? (
            completedTasks.map(task => <View key={task.id}>{renderTaskCard({ item: task, isCompleted: true })}</View>)
          ) : (
            <View style={styles.emptyState}>
               <Ionicons name="time-outline" size={40} color="#CBD5E1" />
               <Text style={styles.emptyText}>No history available.</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* --- FAB --- */}
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
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 20,
  },
  
  // Header
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
  profileBtn: {
    width: 30,
    height: 30,
    backgroundColor: "#E0F2FE",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 16,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 14,
  },

  // Cards
  cardContainer: {
    marginBottom: 14,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
  },
  completedCard: {
    backgroundColor: "#FCFCFC",
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconBoxCompleted: {
    backgroundColor: "#F1F5F9",
  },
  cardTextContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  textCompleted: {
    color: "#64748B",
    textDecorationLine: 'line-through',
  },
  taskDate: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  
  // Status Pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Card Footer
  cardFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#007EA7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007EA7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});