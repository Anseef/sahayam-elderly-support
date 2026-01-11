import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen({ route, navigation }) {

  const { task } = route.params || { 
    task: { 
      title: "Grocery Run", 
      date: "Today, 10:00 AM", 
      status: "Pending", 
      volunteer: null, 
      location: "Lulu Mall, Pathanamthitta" 
    } 
  };

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [showComplaintBox, setShowComplaintBox] = useState(false);

  const handleEdit = () => {
    navigation.navigate('AddServiceScreen', { existingTask: task });
  };

  const handleDelete = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this service request?",
      [
        { text: "No, Keep it", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: 'destructive',
          onPress: () => {
            Alert.alert("Request Cancelled", "The service request has been removed.");
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please tap a star to rate the service.");
      return;
    }
    Alert.alert("Thank You!", "Your feedback helps us improve.");
    navigation.goBack();
  };

  const handleReportIssue = () => {
    Alert.alert("Report Issue", "Are you sure you want to file a complaint?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes, Report", style: 'destructive', onPress: () => {
          Alert.alert("Complaint Filed", "Support will contact you.");
          navigation.goBack();
      }}
    ]);
  };

  // --- HELPER FOR STATUS COLOR ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'Accepted': return { bg: '#E3F2FD', text: '#1565C0' };
      default: return { bg: '#FFF3E0', text: '#EF6C00' };
    }
  };
  const statusColors = getStatusColor(task.status);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        
        {task.status === 'Pending' ? (
          <TouchableOpacity onPress={handleEdit} style={styles.editBadge}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* --- HERO CARD (Service Info) --- */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
                <Text style={[styles.statusText, { color: statusColors.text }]}>{task.status}</Text>
              </View>
            </View>
            
            <Text style={styles.title}>{task.title}</Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <Ionicons name="calendar-outline" size={18} color="#546E7A" />
                </View>
                <Text style={styles.metaText}>{task.date}</Text>
              </View>
              
              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <Ionicons name="location-outline" size={18} color="#546E7A" />
                </View>
                <Text style={styles.metaText} numberOfLines={2}>{task.location}</Text>
              </View>
            </View>
          </View>

          {/* --- VOLUNTEER SECTION --- */}
          <Text style={styles.sectionLabel}>ASSIGNED VOLUNTEER</Text>
          
          {(task.status === 'Accepted' || task.status === 'Completed') && task.volunteer ? (
            <View style={styles.volunteerCard}>
              <View style={styles.volunteerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{task.volunteer.charAt(0)}</Text>
                </View>
                <View style={styles.volunteerDetails}>
                  <Text style={styles.volunteerName}>{task.volunteer}</Text>
                  <View style={styles.verifiedTag}>
                    <MaterialIcons name="verified" size={14} color="#007EA7" />
                    <Text style={styles.verifiedText}>Verified Helper</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert("Calling", `Dialing ${task.volunteer}...`)}>
                <Ionicons name="call" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="hourglass-outline" size={28} color="#90A4AE" />
              </View>
              <Text style={styles.emptyTitle}>Matching in Progress</Text>
              <Text style={styles.emptySub}>We are currently looking for a volunteer nearby.</Text>
            </View>
          )}

          {/* --- RATING SECTION --- */}
          {task.status === 'Completed' && (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionLabel}>HOW WAS IT?</Text>
              <View style={styles.ratingCard}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                      <FontAwesome 
                        name={star <= rating ? "star" : "star-o"} 
                        size={40} 
                        color={star <= rating ? "#FFC107" : "#CFD8DC"} 
                        style={styles.starIcon}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.textArea}
                  placeholder="Share your experience (Optional)"
                  placeholderTextColor="#B0BEC5"
                  multiline
                  value={feedback}
                  onChangeText={setFeedback}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitReview}>
                  <Text style={styles.primaryBtnText}>Submit Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* --- ACTION SECTION --- */}
          <View style={styles.footerActions}>
            
            {/* Report Issue - Expandable */}
            <View style={[styles.complaintWrapper, showComplaintBox && styles.complaintWrapperActive]}>
              <TouchableOpacity 
                style={styles.reportHeader} 
                onPress={() => setShowComplaintBox(!showComplaintBox)}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#607D8B" />
                  <Text style={styles.reportTitle}>Report an Issue</Text>
                </View>
                <Ionicons name={showComplaintBox ? "chevron-up" : "chevron-down"} size={20} color="#607D8B" />
              </TouchableOpacity>

              {showComplaintBox && (
                <View style={styles.complaintBody}>
                  <TextInput
                    style={styles.complaintInput}
                    placeholder="Describe what happened..."
                    multiline
                    value={complaintText}
                    onChangeText={setComplaintText}
                  />
                  <TouchableOpacity style={styles.reportSubmitBtn} onPress={handleReportIssue}>
                    <Text style={styles.reportSubmitText}>Send Report</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Cancel Button */}
            {(task.status === 'Pending' || task.status === 'Accepted') && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleDelete}>
                <Ionicons name="trash-bin-outline" size={20} color="#D32F2F" />
                <Text style={styles.cancelBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            )}

          </View>
          
          <View style={{height: 30}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  iconBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: 0.5 },
  editBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editText: { fontSize: 12, fontWeight: '700', color: '#007EA7' },

  scrollContent: { padding: 20 },

  heroCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#64748B', shadowOpacity: 0.08, shadowOffset: {width: 0, height: 4}, shadowRadius: 12, elevation: 4
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 20, lineHeight: 32 },
  metaContainer: { gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  metaText: { fontSize: 15, color: '#475569', flex: 1, lineHeight: 20 },

  // Labels
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },

  // Volunteer Card
  volunteerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 30,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: {width: 0, height: 2}, shadowRadius: 8, elevation: 2
  },
  volunteerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4 },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: '#007EA7' },
  volunteerDetails: { gap: 2 },
  volunteerName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: '#007EA7', fontWeight: '600' },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007EA7', alignItems: 'center', justifyContent: 'center', shadowColor: '#007EA7', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  // Empty State
  emptyStateCard: {
    backgroundColor: '#F8FAFC', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 30,
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed'
  },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  // Rating
  feedbackSection: { marginBottom: 30 },
  ratingCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, marginBottom: 16 },
  primaryBtn: { backgroundColor: '#007EA7', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Footer Actions
  footerActions: { gap: 16 },
  complaintWrapper: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  complaintWrapperActive: { borderColor: '#94A3B8' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  reportTitle: { fontSize: 15, fontWeight: '600', color: '#475569' },
  complaintBody: { padding: 16, paddingTop: 0, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  complaintInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 12, marginTop: 12 },
  reportSubmitBtn: { backgroundColor: '#475569', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  reportSubmitText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, backgroundColor: '#FEF2F2', gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  cancelBtnText: { color: '#DC2626', fontSize: 16, fontWeight: '700' }
});