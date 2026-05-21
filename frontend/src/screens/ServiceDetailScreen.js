import React, { useState, useEffect } from 'react';
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
  Dimensions,
  ActivityIndicator,
  Image,
  Linking,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// --- BULLETPROOF BASE64 FORMATTER ---
const formatImageUri = (imgString) => {
  if (!imgString) return null;
  // If it already has the prefix or is a standard web URL, return it
  if (imgString.startsWith('http') || imgString.startsWith('file://') || imgString.startsWith('data:image')) {
    return imgString;
  }
  // Otherwise, force the base64 prefix
  return `data:image/jpeg;base64,${imgString}`;
};

export default function ServiceDetailScreen({ route, navigation }) {

  const [task, setTask] = useState(route.params?.task || null); 
  const isVolunteer = route.params?.isVolunteer;

  const [currentUser, setCurrentUser] = useState(null);
  const [targetUserProfile, setTargetUserProfile] = useState(null); // <-- NEW: Stores the live profile data
  const [loading, setLoading] = useState(false);

  // --- STATE ---
  const [rating, setRating] = useState(task?.rating || 0); 
  const [feedback, setFeedback] = useState(task?.feedback || '');
  const [complaintText, setComplaintText] = useState('');
  const [showComplaintBox, setShowComplaintBox] = useState(false);
  const [sound, setSound] = useState(null); 
  
  // --- COMPLETION STATE ---
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  // --- NEW PAYMENT STATES ---
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  if (!task) return (
    <SafeAreaView style={styles.container}><Text>No details found.</Text></SafeAreaView>
  );

  // --- FETCH BOTH CURRENT USER AND TARGET USER ---
  useEffect(() => {
    const loadData = async () => {
        // 1. Load Current User
        const stored = await AsyncStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));

        // 2. Fetch the Target User's LIVE Profile (Elderly or Volunteer)
        const targetUserId = isVolunteer ? task.requesterId : task.volunteerId;
        if (targetUserId) {
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${targetUserId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTargetUserProfile(data); // Save their live profile data
                }
            } catch (error) {
                console.log("Could not fetch live profile image.");
            }
        }
    };
    loadData();
  }, [task, isVolunteer]);

  const playVoiceNote = async () => {
    if (!task.voiceNote) return;
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: task.voiceNote },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      Alert.alert("Playback Error", "Could not play the voice note.");
    }
  };

  const handleCall = async () => {
    const targetUserId = isVolunteer ? task.requesterId : task.volunteerId;
    if (!targetUserId) {
        Alert.alert("Error", "User details not found.");
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${targetUserId}`);
      const data = await response.json();

      if (response.ok && data.phoneNumber) {
         const url = `tel:${data.phoneNumber}`;
         Linking.openURL(url).catch(() => Alert.alert("Dialer Error", "Could not open the dialer."));
      } else {
         Alert.alert("Not Found", "This user hasn't provided a valid phone number.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch contact details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
      const targetUserId = isVolunteer ? task.requesterId : task.volunteerId;
      if (!targetUserId) {
          Alert.alert("Profile Unavailable", "Could not find user details.");
          return;
      }
      navigation.navigate('PublicProfileScreen', { userId: targetUserId, isVolunteerProfile: !isVolunteer });
  };

  const handleAccept = async () => {
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
            Alert.alert("Success", "Request accepted! Thank you for helping.");
            navigation.navigate('VolunteerDashboard'); 
        } else {
            Alert.alert("Error", "Could not accept request.");
        }
    } catch (error) {
        Alert.alert("Network Error", "Check your connection.");
    } finally {
        setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/complete/${task._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completionNote }) 
        });

        if (response.ok) {
            Alert.alert("Great Job!", "Task marked as completed.");
            navigation.navigate('VolunteerDashboard');
        } else {
            Alert.alert("Error", "Could not complete request.");
        }
    } catch (error) {
        Alert.alert("Network Error", "Check your connection.");
    } finally {
        setLoading(false);
    }
  };

  const handleDropTask = () => {
    Alert.alert(
      "Drop Task", 
      "Are you sure you cannot complete this task? You can only drop a maximum of 5 tasks per month.", 
      [
        { text: "No, keep it", style: "cancel" },
        { text: "Yes, Drop Task", style: 'destructive', onPress: async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/drop/${task._id}`, { 
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ volunteerId: currentUser.id || currentUser._id })
                });

                const data = await response.json();

                if (response.ok) {
                  Alert.alert("Task Dropped", "The request has been sent back to the open feed.");
                  navigation.navigate('VolunteerDashboard');
                } else if (response.status === 403) {
                  Alert.alert("Limit Reached", data.message || "You have reached your monthly limit of 10 dropped tasks.");
                } else {
                  Alert.alert("Error", data.message || "Could not drop the request.");
                }
            } catch(e) { 
                Alert.alert("Network Error", "Check your connection.");
            } finally {
                setLoading(false);
            }
        }}
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert("Delete", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: 'destructive', onPress: async () => {
            setLoading(true);
            try {
                await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/delete/${task._id}`, { method: 'DELETE' });
                navigation.goBack();
            } catch(e) { setLoading(false); }
        }}
    ]);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) return Alert.alert("Rating Required", "Please select stars.");
    setLoading(true);
    try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/review/${task._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, feedback })
        });

        if (response.ok) {
            Alert.alert("Thank You", "Feedback submitted successfully.");
            setTask(prev => ({ ...prev, isReviewed: true, rating, feedback }));
        } else {
             Alert.alert("Error", "Could not submit review.");
        }
    } catch (error) {
         Alert.alert("Network Error", "Check your connection.");
    } finally {
        setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!complaintText.trim()) return Alert.alert("Required", "Please describe the issue.");
    if (!currentUser) return Alert.alert("Error", "User details not found.");
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/report/${task._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedBy: currentUser.id || currentUser._id,
          reporterName: currentUser.name || currentUser.fullName,
          reporterRole: currentUser.role,
          issue: complaintText,
          taskTitle: task.title || task.category
        })
      });

      if (response.ok) {
        Alert.alert("Report Sent", "The admin team has been notified of this issue. We will review it shortly.");
        setShowComplaintBox(false);
        setComplaintText('');
      } else {
        Alert.alert("Error", "Could not send report.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW MAP NAVIGATION ---
  const handleOpenMap = () => {
      // Check if we have EITHER coordinates OR a text location
      if (!task || (!task.curr_location && (!task.latitude || !task.longitude))) {
          Alert.alert("Location Error", "No location data provided for this task.");
          return;
      }

      let mapUrl = '';

      // 1. If we have exact GPS coordinates
      if (task.latitude && task.longitude) {
          if (Platform.OS === 'ios') {
              mapUrl = `http://maps.apple.com/?daddr=${task.latitude},${task.longitude}&dirflg=d`; 
          } else {
              mapUrl = `google.navigation:q=${task.latitude},${task.longitude}&mode=d`;
          }
      } 
      // 2. Fallback to using the Text Address (e.g. "Kottayam, Kerala")
      else {
          const encodedAddress = encodeURIComponent(task.curr_location);
          if (Platform.OS === 'ios') {
              mapUrl = `http://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`;
          } else {
              mapUrl = `google.navigation:q=${encodedAddress}&mode=d`;
          }
      }

      Linking.canOpenURL(mapUrl)
          .then((supported) => {
              if (supported) {
                  return Linking.openURL(mapUrl);
              } else {
                  // Fallback to browser Google Maps
                  const query = task.latitude ? `${task.latitude},${task.longitude}` : encodeURIComponent(task.curr_location);
                  const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
                  return Linking.openURL(browserUrl);
              }
          })
          .catch((err) => Alert.alert("Error", "Could not open the map application."));
  };

  // --- NEW PAYMENT METHODS ---
  const handlePayment = () => {
      setShowRazorpay(true);
  };

  const processFakePayment = async () => {
    setIsProcessingPayment(true);
    
    setTimeout(async () => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/requests/pay/${task._id}`, {
                method: 'PUT'
            });

            if (response.ok) {
                setShowRazorpay(false);
                Alert.alert("Payment Successful!", `₹${task.paymentAmount} has been securely transferred via ${selectedPaymentMethod}.`);
                setTask(prev => ({ ...prev, paymentStatus: 'Paid' }));
            } else {
                Alert.alert("Payment Failed", "Something went wrong.");
            }
        } catch (error) {
            Alert.alert("Network Error", "Could not process payment.");
        } finally {
            setIsProcessingPayment(false);
        }
    }, 2500); 
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'Accepted': return { bg: '#E3F2FD', text: '#1565C0' };
      default: return { bg: '#FFF3E0', text: '#EF6C00' };
    }
  };
  
  const statusColors = getStatusColor(task.status);
  const displayTitle = task.title || task.category || "Service Request";
  const displayDate = new Date(task.createdAt).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
  });
  const displayLocation = task.curr_location || "Location not provided";
  
  const activeVolunteerImg = (!isVolunteer && targetUserProfile?.profileImage) ? targetUserProfile.profileImage : task.volunteerImage;
  const activeRequesterImg = (isVolunteer && targetUserProfile?.profileImage) ? targetUserProfile.profileImage : task.requesterImage;

  const volunteerImgUri = formatImageUri(activeVolunteerImg);
  const requesterImgUri = formatImageUri(activeRequesterImg);
  
  const getInitial = (nameStr) => {
      if (!nameStr) return "U";
      return nameStr.charAt(0).toUpperCase();
  };

  const isEmergency = task.category === 'Emergency' || task.isEmergency === true;

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isVolunteer ? "Task Details" : "Request Details"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
                  <Text style={[styles.statusText, { color: statusColors.text }]}>{task.status}</Text>
                </View>
                
                {isEmergency && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="warning" size={14} color="#DC2626" style={{marginRight: 4}} />
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                )}
              </View>

              {task.isPaid && (
                 <View style={styles.paidBadge}>
                   <Text style={styles.paidText}>₹{task.paymentAmount}</Text>
                 </View>
              )}
            </View>
            
            <Text style={styles.title}>{displayTitle}</Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <Ionicons name="calendar-outline" size={18} color="#546E7A" />
                </View>
                <Text style={styles.metaText}>{displayDate}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <Ionicons name="location-outline" size={18} color="#546E7A" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.metaText} numberOfLines={2}>{displayLocation}</Text>
                    
                    {/* ONLY SHOW NAVIGATION BUTTON TO VOLUNTEER IF TASK IS ACCEPTED OR COMPLETED */}
                    {isVolunteer && (task.status === 'Accepted' || task.status === 'Completed') && (task.curr_location || task.latitude) && (
                        <TouchableOpacity style={styles.navigateBtn} onPress={handleOpenMap}>
                            <Ionicons name="map-outline" size={16} color="#007EA7" />
                            <Text style={styles.navigateBtnText}>Open in Maps</Text>
                            <Ionicons name="open-outline" size={14} color="#007EA7" />
                        </TouchableOpacity>
                    )}
                </View>
              </View>

              {task.notes && (
                <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{task.notes}</Text>
                </View>
              )}
              {task.voiceNote && (
                 <TouchableOpacity style={styles.voicePlayer} onPress={playVoiceNote}>
                    <Ionicons name="play-circle" size={32} color="#007EA7" />
                    <View>
                        <Text style={styles.voiceTitle}>Voice Note Attached</Text>
                        <Text style={styles.voiceSub}>Tap to listen</Text>
                    </View>
                 </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ELDERLY VIEW: Show Volunteer Info */}
          {!isVolunteer && (
            <>
              <Text style={styles.sectionLabel}>ASSIGNED VOLUNTEER</Text>
              {(task.status === 'Accepted' || task.status === 'Completed') && task.volunteerName ? (
                <View style={styles.volunteerCard}>
                  <TouchableOpacity style={styles.volunteerLeft} onPress={handleViewProfile} activeOpacity={0.7}>
                    {volunteerImgUri ? (
                        <Image source={{ uri: volunteerImgUri }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatar}><Text style={styles.avatarLetter}>{getInitial(task.volunteerName)}</Text></View>
                    )}
                    <View style={styles.volunteerDetails}>
                      <Text style={styles.volunteerName}>{task.volunteerName}</Text>
                      <View style={styles.verifiedTag}>
                        <MaterialIcons name="verified" size={14} color="#007EA7" />
                        <Text style={styles.verifiedText}>View Profile</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.callBtn} onPress={handleCall} disabled={loading}>
                    <Ionicons name="call" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="hourglass-outline" size={28} color="#90A4AE" />
                  </View>
                  <Text style={styles.emptyTitle}>Matching in Progress</Text>
                  <Text style={styles.emptySub}>Looking for a volunteer nearby.</Text>
                </View>
              )}

              {/* ELDERLY SEES VOLUNTEER'S COMPLETION NOTE */}
              {task.status === 'Completed' && task.completionNote && (
                 <View style={styles.completionSummaryCard}>
                    <View style={styles.proofHeader}>
                        <View style={styles.proofIconBg}>
                            <Ionicons name="checkmark-done" size={20} color="#007EA7" />
                        </View>
                        <Text style={styles.proofTitle}>Task Completed</Text>
                    </View>
                    <View style={styles.proofNoteContainer}>
                        <Text style={styles.proofNoteLabel}>Volunteer's Note:</Text>
                        <Text style={styles.proofText}>"{task.completionNote}"</Text>
                    </View>
                 </View>
              )}
            </>
          )}

          {/* VOLUNTEER VIEW: Show Requester Info */}
          {isVolunteer && (
              <>
                  <Text style={styles.sectionLabel}>REQUESTED BY</Text>
                  <View style={styles.requesterCard}>
                      <TouchableOpacity style={styles.reqLeft} onPress={handleViewProfile} activeOpacity={0.7}>
                          
                          {requesterImgUri ? (
                              <Image source={{ uri: requesterImgUri }} style={styles.avatarImage} />
                          ) : (
                              <View style={[styles.avatar, {backgroundColor: '#E0F2FE', borderColor: '#007EA7'}]}>
                                  <Text style={[styles.avatarLetter, {color: '#007EA7'}]}>
                                      {getInitial(task.requesterName)}
                                  </Text>
                              </View>
                          )}

                          <View style={styles.volunteerDetails}>
                              <Text style={styles.volunteerName}>{task.requesterName || "Beneficiary"}</Text>
                              <Text style={styles.reqSub}>View Profile</Text>
                          </View>
                      </TouchableOpacity>
                      
                      {task.status === 'Accepted' && (
                          <TouchableOpacity style={styles.callBtn} onPress={handleCall} disabled={loading}>
                              <Ionicons name="call" size={22} color="#FFF" />
                          </TouchableOpacity>
                      )}
                  </View>
              </>
          )}

          {/* --- FOOTER ACTIONS --- */}
          <View style={styles.footerActions}>

            {/* PAYMENT SECTION (Only for Elderly, if Paid, and Completed) */}
            {!isVolunteer && task.status === 'Completed' && task.isPaid && task.paymentStatus !== 'Paid' && (
                <View style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                        <Ionicons name="cash" size={28} color="#16A34A" />
                        <Text style={styles.paymentTitle}>Payment Required</Text>
                    </View>
                    <Text style={styles.paymentDesc}>
                        The volunteer has completed the task. Please release the payment of <Text style={{fontWeight: '800'}}>₹{task.paymentAmount}</Text> to proceed to the review.
                    </Text>
                    
                    <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
                        <Text style={styles.payBtnText}>Pay ₹{task.paymentAmount} Securely</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* RATING SECTION (Hidden until Paid, or if Free) */}
            {task.status === 'Completed' && (!task.isPaid || task.paymentStatus === 'Paid') && (
                <View style={styles.ratingCard}>
                    {/* Show Paid Success Badge if it was a paid task */}
                    {task.isPaid && task.paymentStatus === 'Paid' && (
                        <View style={styles.paidSuccessBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#166534" />
                            <Text style={styles.paidSuccessText}>Payment of ₹{task.paymentAmount} Completed</Text>
                        </View>
                    )}

                    <Text style={styles.ratingTitle}>
                        {isVolunteer 
                            ? (task.isReviewed ? "Beneficiary's Review" : "Waiting for Review...") 
                            : (task.isReviewed ? "Your Review" : "Rate Service")}
                    </Text>

                    {/* RATING LOGIC FIX: Check if task.isReviewed is false so user can click stars */}
                    {(!isVolunteer || task.isReviewed) && (
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map(s => (
                                 <TouchableOpacity 
                                    key={s} 
                                    onPress={() => !isVolunteer && !task.isReviewed && setRating(s)} 
                                    disabled={isVolunteer || task.isReviewed}
                                >
                                     <FontAwesome name={s <= rating ? "star" : "star-o"} size={36} color="#FFC107" style={{marginHorizontal: 4}}/>
                                 </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {!task.isReviewed && !isVolunteer && (
                        <>
                            <TextInput
                                style={styles.reviewInput}
                                placeholder="How was the volunteer?"
                                placeholderTextColor="#94A3B8"
                                multiline
                                value={feedback}
                                onChangeText={setFeedback}
                            />
                            <TouchableOpacity style={[styles.primaryBtn, loading && {opacity: 0.7}]} onPress={handleSubmitReview} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Submit Review</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {task.isReviewed && task.feedback ? (
                        <View style={styles.submittedReviewBox}>
                            <Text style={styles.submittedReviewText}>"{task.feedback}"</Text>
                        </View>
                    ) : null}
                </View>
            )}

            {/* ELDERLY CANCELLATION */}
            {!isVolunteer && (task.status === 'Pending' || task.status === 'Accepted') && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleDelete}>
                <Ionicons name="trash-bin-outline" size={20} color="#D32F2F" />
                <Text style={styles.cancelBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            )}

            {/* VOLUNTEER ACTIONS */}
            {isVolunteer && task.status === 'Pending' && (
                <TouchableOpacity style={[styles.acceptBtn, loading && {opacity: 0.7}]} onPress={handleAccept} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : (
                        <>
                            <Text style={styles.acceptBtnText}>Accept Request</Text>
                            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            )}

            {/* --- VOLUNTEER MARK AS COMPLETED FORM --- */}
            {isVolunteer && task.status === 'Accepted' && (
                <View style={styles.completionContainer}>
                    {!showCompletionForm ? (
                        <TouchableOpacity style={styles.completeTriggerBtn} onPress={() => setShowCompletionForm(true)}>
                            <Text style={styles.completeTriggerText}>Mark as Completed</Text>
                            <Ionicons name="checkmark-done-circle" size={24} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.completionFormBox}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12}}>
                                <View style={styles.formIconBg}>
                                    <Ionicons name="flag" size={18} color="#007EA7" />
                                </View>
                                <Text style={styles.formSectionTitle}>Task Update</Text>
                            </View>
                            
                            <Text style={styles.formHelperText}>Leave a note for the beneficiary (e.g., "Groceries left at the door, receipt under the bag").</Text>

                            <TextInput
                                style={styles.completionInput}
                                placeholder="Type your final update here..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                value={completionNote}
                                onChangeText={setCompletionNote}
                            />
                            <View style={styles.formRow}>
                                <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setShowCompletionForm(false)}>
                                    <Text style={styles.cancelFormText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.submitFormBtn} onPress={handleComplete} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#FFF" size="small"/> : <Text style={styles.submitFormText}>Confirm Finish</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* VOLUNTEER DROP TASK BUTTON */}
            {isVolunteer && task.status === 'Accepted' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleDropTask} disabled={loading}>
                <Ionicons name="close-circle-outline" size={22} color="#DC2626" />
                <Text style={styles.cancelBtnText}>Drop Task (Return to Home)</Text>
              </TouchableOpacity>
            )}

            {/* REPORT ISSUE */}
            <View style={[styles.complaintWrapper, showComplaintBox && styles.complaintWrapperActive]}>
              <TouchableOpacity style={styles.reportHeader} onPress={() => setShowComplaintBox(!showComplaintBox)}>
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

          </View>
          <View style={{height: 30}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- FAKE RAZORPAY MODAL --- */}
      <Modal visible={showRazorpay} animationType="slide" transparent>
        <View style={styles.rzpOverlay}>
            <View style={styles.rzpContainer}>
                
                {/* Razorpay Header */}
                <View style={styles.rzpHeader}>
                    <View>
                        <Text style={styles.rzpHeaderTitle}>Sahayam Trust</Text>
                        <Text style={styles.rzpAmount}>₹ {task?.paymentAmount}.00</Text>
                    </View>
                    <TouchableOpacity onPress={() => !isProcessingPayment && setShowRazorpay(false)}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Contact Info (Simulated) */}
                <View style={styles.rzpContactBar}>
                    <Ionicons name="call" size={14} color="#64748B" />
                    <Text style={styles.rzpContactText}>+91 {currentUser?.phoneNumber || "XXXXXXXXXX"}</Text>
                </View>

                {/* Payment Methods */}
                <ScrollView style={styles.rzpBody}>
                    <Text style={styles.rzpSectionTitle}>Preferred Payment Methods</Text>

                    <TouchableOpacity 
                        style={[styles.rzpMethod, selectedPaymentMethod === 'UPI' && styles.rzpMethodActive]}
                        onPress={() => setSelectedPaymentMethod('UPI')}
                    >
                        <View style={styles.rzpMethodIconBg}><Ionicons name="phone-portrait" size={20} color="#0B64F0" /></View>
                        <View style={{flex: 1}}>
                            <Text style={styles.rzpMethodText}>UPI (GPay, PhonePe, Paytm)</Text>
                            <Text style={styles.rzpMethodSub}>Pay directly from your bank account</Text>
                        </View>
                        {selectedPaymentMethod === 'UPI' && <Ionicons name="checkmark-circle" size={24} color="#0B64F0" />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.rzpMethod, selectedPaymentMethod === 'Card' && styles.rzpMethodActive]}
                        onPress={() => setSelectedPaymentMethod('Card')}
                    >
                        <View style={styles.rzpMethodIconBg}><Ionicons name="card" size={20} color="#0B64F0" /></View>
                        <View style={{flex: 1}}>
                            <Text style={styles.rzpMethodText}>Credit / Debit Card</Text>
                            <Text style={styles.rzpMethodSub}>Visa, MasterCard, RuPay</Text>
                        </View>
                        {selectedPaymentMethod === 'Card' && <Ionicons name="checkmark-circle" size={24} color="#0B64F0" />}
                    </TouchableOpacity>

                    <View style={styles.rzpSecurityBadge}>
                        <Ionicons name="lock-closed" size={14} color="#16A34A" />
                        <Text style={styles.rzpSecurityText}>100% Secure Payments by Razorpay</Text>
                    </View>
                </ScrollView>

                {/* Footer Pay Button */}
                <View style={styles.rzpFooter}>
                    <TouchableOpacity 
                        style={[styles.rzpPayBtn, isProcessingPayment && {opacity: 0.7}]}
                        onPress={processFakePayment}
                        disabled={isProcessingPayment}
                    >
                        {isProcessingPayment ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Text style={styles.rzpPayBtnText}>Pay ₹{task?.paymentAmount}</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: 0.5 },
  scrollContent: { padding: 20 },
  heroCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#64748B', shadowOpacity: 0.08, shadowOffset: {width: 0, height: 4}, shadowRadius: 12, elevation: 4 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  urgentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  urgentBadgeText: { color: '#DC2626', fontSize: 10, fontWeight: '800' },

  paidBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  paidText: { color: '#166534', fontWeight: '700', fontSize: 13 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 20, lineHeight: 32 },
  metaContainer: { gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  metaText: { fontSize: 15, color: '#475569', flex: 1, lineHeight: 20 },
  notesBox: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  notesLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#334155', fontStyle: 'italic' },
  voicePlayer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#E0F2FE', padding: 12, borderRadius: 16, gap: 12 },
  voiceTitle: { fontWeight: '700', color: '#0369A1' },
  voiceSub: { fontSize: 12, color: '#0284C7' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  volunteerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: {width: 0, height: 2}, shadowRadius: 8, elevation: 2 },
  requesterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: {width: 0, height: 2}, shadowRadius: 8, elevation: 2 },
  volunteerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  reqLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  avatarImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#E2E8F0', resizeMode: 'cover' }, 
  avatarLetter: { fontSize: 22, fontWeight: '800', color: '#007EA7' },
  volunteerDetails: { gap: 2 },
  volunteerName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  reqSub: { fontSize: 13, color: '#64748B' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: '#007EA7', fontWeight: '600' },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007EA7', alignItems: 'center', justifyContent: 'center' },
  emptyStateCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  
  completionSummaryCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#BAE6FD', borderLeftWidth: 6, borderLeftColor: '#007EA7', marginBottom: 24, shadowColor: '#007EA7', shadowOpacity: 0.06, shadowOffset: {width: 0, height: 6}, shadowRadius: 12, elevation: 3 },
  proofHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  proofIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  proofTitle: { fontSize: 17, fontWeight: '800', color: '#007EA7' },
  proofNoteContainer: { backgroundColor: '#F0F9FF', padding: 16, borderRadius: 16 },
  proofNoteLabel: { fontSize: 13, fontWeight: '800', color: '#0369A1', marginBottom: 6, textTransform: 'uppercase' },
  proofText: { fontSize: 15, color: '#0C4A6E', fontStyle: 'italic', lineHeight: 24 },

  completionContainer: { marginBottom: 16 },
  completeTriggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, backgroundColor: '#007EA7', gap: 10, shadowColor: '#007EA7', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 10, elevation: 5 },
  completeTriggerText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  completionFormBox: { backgroundColor: '#FFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOpacity: 0.06, shadowOffset: {width: 0, height: 8}, shadowRadius: 16, elevation: 4 },
  formIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  formSectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  formHelperText: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 22 },
  completionInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, minHeight: 110, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, fontSize: 15, color: '#1E293B' },
  formRow: { flexDirection: 'row', gap: 12 },
  cancelFormBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelFormText: { color: '#475569', fontWeight: '800', fontSize: 15 },
  submitFormBtn: { flex: 1.5, paddingVertical: 16, borderRadius: 16, backgroundColor: '#007EA7', alignItems: 'center' },
  submitFormText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  footerActions: { gap: 16 },

  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, backgroundColor: '#FEF2F2', gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  cancelBtnText: { color: '#DC2626', fontSize: 17, fontWeight: '800' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, backgroundColor: '#007EA7', gap: 10, shadowColor: '#007EA7', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 10, elevation: 5 },
  acceptBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  
  ratingCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.04, shadowOffset: {width: 0, height: 4}, shadowRadius: 12, elevation: 3 },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  ratingTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  reviewInput: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, fontSize: 15, color: '#1E293B' },
  submittedReviewBox: { flexDirection: 'row', width: '100%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'flex-start' },
  submittedReviewText: { color: '#334155', fontStyle: 'italic', fontSize: 15, flex: 1, lineHeight: 22 },
  primaryBtn: { width: '100%', backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  complaintWrapper: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  complaintWrapperActive: { borderColor: '#94A3B8' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  reportTitle: { fontSize: 16, fontWeight: '800', color: '#334155' },
  complaintBody: { padding: 20, paddingTop: 0, backgroundColor: '#FFF' },
  complaintInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 16, fontSize: 15, color: '#1E293B' },
  reportSubmitBtn: { backgroundColor: '#475569', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  reportSubmitText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  paymentCard: { backgroundColor: '#F0FDF4', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 16, shadowColor: '#16A34A', shadowOpacity: 0.1, shadowOffset: {width: 0, height: 4}, shadowRadius: 12, elevation: 3 },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  paymentTitle: { fontSize: 20, fontWeight: '900', color: '#166534' },
  paymentDesc: { fontSize: 14, color: '#15803D', lineHeight: 22, marginBottom: 20 },
  payBtn: { backgroundColor: '#16A34A', paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  payBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  
  paidSuccessBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 16 },
  paidSuccessText: { color: '#166534', fontWeight: '700', fontSize: 13 },

  // --- FAKE RAZORPAY STYLES ---
  rzpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  rzpContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: Dimensions.get('window').height * 0.75, shadowColor: '#000', shadowOffset: {width:0, height:-4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  rzpHeader: { backgroundColor: '#0B64F0', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rzpHeaderTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rzpAmount: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  rzpContactBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 8 },
  rzpContactText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  rzpBody: { padding: 24 },
  rzpSectionTitle: { fontSize: 12, color: '#94A3B8', fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  rzpMethod: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, marginBottom: 12 },
  rzpMethodActive: { borderColor: '#0B64F0', backgroundColor: '#EFF6FF' },
  rzpMethodIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  rzpMethodText: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  rzpMethodSub: { fontSize: 12, color: '#64748B' },
  rzpSecurityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, marginBottom: 40 },
  rzpSecurityText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  rzpFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFF', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  rzpPayBtn: { backgroundColor: '#0B64F0', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  rzpPayBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // --- NAVIGATION BUTTON STYLES ---
  navigateBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#E0F2FE', // Matches the light blue accent backgrounds in your app
      paddingHorizontal: 14, 
      paddingVertical: 10, 
      borderRadius: 12, 
      alignSelf: 'flex-start',
      marginTop: 10,
      gap: 6,
      borderWidth: 1,
      borderColor: '#BAE6FD'
  },
  navigateBtnText: { 
      color: '#007EA7', // Matches your primary brand color
      fontSize: 13, 
      fontWeight: '800' 
  },
});