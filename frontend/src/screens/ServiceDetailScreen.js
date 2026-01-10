import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

export default function ServiceDetailScreen({ route, navigation }) {
  // Get data passed from Dashboard (or use defaults if testing)
  const { task } = route.params || { 
    task: { 
      title: "Grocery Run", 
      date: "Today, 10:00 AM", 
      status: "Completed", 
      volunteer: "Arun Kumar", 
      location: "Lulu Mall, Pathanamthitta" 
    } 
  };

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [showComplaintBox, setShowComplaintBox] = useState(false);

  // --- HANDLER: Submit Feedback ---
  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please tap a star to rate the service.");
      return;
    }
    Alert.alert("Thank You!", "Your feedback helps us improve.");
    navigation.goBack();
  };

  // --- HANDLER: Submit Complaint ---
  const handleReportIssue = () => {
    Alert.alert(
      "Report Issue",
      "Are you sure you want to file a formal complaint regarding this service?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Report", 
          style: 'destructive',
          onPress: () => {
            Alert.alert("Complaint Filed", "Our support team will contact you shortly.");
            navigation.goBack();
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* --- SECTION 1: SERVICE INFO --- */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.serviceTitle}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: task.status === 'Completed' ? '#E8F5E9' : '#FFF3E0' }]}>
                <Text style={[styles.statusText, { color: task.status === 'Completed' ? '#2E7D32' : '#EF6C00' }]}>
                  {task.status}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>{task.date}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#546E7A" />
              <Text style={styles.locationText}>{task.location}</Text>
            </View>
          </View>

          {/* --- SECTION 2: VOLUNTEER DETAILS --- */}
          <Text style={styles.sectionHeader}>Assigned Volunteer</Text>
          {task.volunteer ? (
            <View style={styles.volunteerCard}>
              <View style={styles.volunteerInfo}>
                <View style={styles.avatar}>
                  {/* SAFE CODE: Use optional chaining (?) or a fallback */}
                  <Text style={styles.avatarText}>
                    {task.volunteer?.charAt(0) || 'V'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.volunteerName}>{task.volunteer}</Text>
                  <Text style={styles.volunteerRole}>Verified Volunteer</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.callButton} 
                onPress={() => Alert.alert("Calling", `Dialing ${task.volunteer}...`)}
              >
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            // FALLBACK: Show this if no volunteer is assigned yet
            <View style={[styles.volunteerCard, { borderStyle: 'dashed', backgroundColor: '#FAFAFA' }]}>
              <View style={styles.volunteerInfo}>
                <View style={[styles.avatar, { backgroundColor: '#ECEFF1' }]}>
                  <Ionicons name="time-outline" size={24} color="#90A4AE" />
                </View>
                <View>
                  <Text style={[styles.volunteerName, { color: '#78909C' }]}>Matching in progress...</Text>
                  <Text style={styles.volunteerRole}>We are looking for a volunteer.</Text>
                </View>
              </View>
            </View>
          )}

          {/* --- SECTION 3: RATING & FEEDBACK --- */}
          {task.status === 'Completed' && (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionHeader}>Rate your experience</Text>
              
              {/* Star Rating */}
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <FontAwesome 
                      name={star <= rating ? "star" : "star-o"} 
                      size={36} 
                      color="#FFD700" 
                      style={{ marginHorizontal: 8 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Text Feedback */}
              <TextInput
                style={styles.input}
                placeholder="Write a review (optional)..."
                placeholderTextColor="#90A4AE"
                multiline
                value={feedback}
                onChangeText={setFeedback}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- SECTION 4: COMPLAINTS --- */}
          <View style={styles.complaintSection}>
            <TouchableOpacity 
              style={styles.complaintButton} 
              onPress={() => setShowComplaintBox(!showComplaintBox)}
            >
              <Ionicons name="warning-outline" size={20} color="#D32F2F" />
              <Text style={styles.complaintButtonText}>Something went wrong? Report Issue</Text>
            </TouchableOpacity>

            {showComplaintBox && (
              <View style={styles.complaintBox}>
                <Text style={styles.complaintLabel}>Describe the issue:</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="e.g., Volunteer was rude, late, etc."
                  multiline
                  value={complaintText}
                  onChangeText={setComplaintText}
                />
                <TouchableOpacity style={styles.fileComplaintBtn} onPress={handleReportIssue}>
                  <Text style={styles.fileComplaintText}>File Complaint</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1E29',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Service Info
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A1E29',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    color: '#546E7A',
    fontSize: 14,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#546E7A',
    fontSize: 14,
  },

  // Volunteer
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 12,
    marginLeft: 4,
  },
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  volunteerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006064',
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1E29',
  },
  volunteerRole: {
    fontSize: 12,
    color: '#007EA7',
    fontWeight: '600',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007EA7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  // Feedback
  feedbackSection: {
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007EA7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Complaint
  complaintSection: {
    marginTop: 10,
  },
  complaintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#EF9A9A',
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    gap: 8,
  },
  complaintButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  complaintBox: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  complaintLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 8,
  },
  fileComplaintBtn: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  fileComplaintText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});