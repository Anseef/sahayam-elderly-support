import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, Image, Modal, Dimensions, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { height } = Dimensions.get('window');

export default function AdminDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('users'); 
  const [userSubTab, setUserSubTab] = useState('Approvals'); 
  const [taskFilter, setTaskFilter] = useState('All'); 
  
  // --- DATA STATES ---
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeVolunteers, setActiveVolunteers] = useState([]);
  const [activeElderly, setActiveElderly] = useState([]); 
  const [bannedUsers, setBannedUsers] = useState([]); // <-- NEW STATE FOR BANNED USERS
  const [allTasks, setAllTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL STATES ---
  const [isImgModalVisible, setImgModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // --- FETCH DATA ---
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';
      const [pRes, vRes, eRes, bRes, tRes, rRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/pending-users`),
        fetch(`${baseUrl}/api/admin/all-volunteers`),
        fetch(`${baseUrl}/api/admin/all-elderly`), 
        fetch(`${baseUrl}/api/admin/banned-users`), // <-- FETCH BANNED USERS
        fetch(`${baseUrl}/api/admin/all-requests`),
        fetch(`${baseUrl}/api/admin/all-reports`)
      ]);
      
      if (pRes.ok) setPendingUsers(await pRes.json());
      if (vRes.ok) setActiveVolunteers(await vRes.json());
      if (eRes.ok) setActiveElderly(await eRes.json()); 
      if (bRes.ok) setBannedUsers(await bRes.json()); // <-- SET BANNED USERS
      if (tRes.ok) setAllTasks(await tRes.json());
      if (rRes.ok) setReports(await rRes.json());
    } catch (error) {
      Alert.alert("Error", "Check server connection");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAdminData(); }, []));

  // --- ACTIONS ---
  const handleCall = (phone) => {
    if (!phone) return Alert.alert("Error", "Phone number not available");
    Linking.openURL(`tel:${phone}`);
  };

  const handleVerifyUser = async (userId, isApproved) => {
    const status = isApproved ? 'approved' : 'rejected';
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/admin/verify-user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        Alert.alert("Success", `User ${status} successfully.`);
        fetchAdminData();
      }
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  // --- MODIFIED: NOW JUST UPDATES STATUS ---
  const handleBanUser = (userId, name) => {
    Alert.alert("Ban User", `Suspend ${name}'s account? They will lose access to the app.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Suspend", style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/admin/delete-user/${userId}`, { method: 'DELETE' });
            if (res.ok) { 
                Alert.alert("Success", "User has been suspended."); 
                setUserModalVisible(false);
                fetchAdminData(); 
            }
          } catch (e) { Alert.alert("Error", "Action failed."); }
      }}
    ]);
  };

  // --- NEW: UNBAN USER ACTION ---
  const handleUnbanUser = (userId, name) => {
    Alert.alert("Restore Access", `Allow ${name} back into the app?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Restore", style: 'default', onPress: async () => {
          try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/admin/unban-user/${userId}`, { method: 'PUT' });
            if (res.ok) { 
                Alert.alert("Success", "User access restored."); 
                setUserModalVisible(false);
                fetchAdminData(); 
            }
          } catch (e) { Alert.alert("Error", "Action failed."); }
      }}
    ]);
  };

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  const formatImageUri = (imgString) => {
    if (!imgString) return null;
    if (imgString.startsWith('http') || imgString.startsWith('file://') || imgString.startsWith('data:image')) {
      return imgString;
    }
    return `data:image/jpeg;base64,${imgString}`;
  };

  const handleUserPress = (user) => {
      const targetId = String(user._id);
      let statCount = 0;
      let avgRating = "0.0";
      let displayRole = "Elderly User";

      if (user.role === 'volunteer') {
          displayRole = "Verified Volunteer";
          const volunteerTasks = allTasks.filter(t => t.status === 'Completed' && t.volunteerId && String(t.volunteerId) === targetId);
          statCount = volunteerTasks.length;

          const ratedTasks = volunteerTasks.filter(t => t.rating && Number(t.rating) > 0);
          if (ratedTasks.length > 0) {
              const sum = ratedTasks.reduce((acc, curr) => acc + Number(curr.rating), 0);
              avgRating = (sum / ratedTasks.length).toFixed(1);
          }
      } else {
          const elderlyTasks = allTasks.filter(t => t.requesterId && String(t.requesterId) === targetId);
          statCount = elderlyTasks.length;
      }

      setSelectedUser({ ...user, stats: { count: statCount, rating: avgRating }, displayRole });
      setUserModalVisible(true);
  };

  const handleReportPress = async (report) => {
      const relatedTask = allTasks.find(t => t._id === report.taskId);
      
      let volunteerDetails = null;

      // If the task has a volunteer assigned, fetch their full profile data
      if (relatedTask && relatedTask.volunteerId) {
          try {
              const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${relatedTask.volunteerId}`);
              if (res.ok) {
                  volunteerDetails = await res.json();
              }
          } catch (error) {
              console.log("Could not fetch volunteer details for report modal", error);
          }
      }

      setSelectedReport({ 
          ...report, 
          fullTaskDetails: relatedTask,
          volunteerProfile: volunteerDetails // Store the full volunteer object here!
      });
      setReportModalVisible(true);
  };

  const handleResolveReport = (reportId) => {
    Alert.alert("Resolve Issue", "Are you sure you want to mark this complaint as resolved?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Resolve", 
        style: 'default', 
        onPress: async () => {
          try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/admin/resolve-report/${reportId}`, { method: 'PUT' });
            if (res.ok) { 
              Alert.alert("Success", "Report marked as resolved."); 
              setReportModalVisible(false);
              fetchAdminData(); 
            }
          } catch (e) { Alert.alert("Error", "Could not resolve report."); }
        }
      }
    ]);
  };

  const handleContactReporter = async (reporterId) => {
    if (!reporterId) return Alert.alert("Error", "Reporter ID missing.");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${reporterId}`);
      const data = await res.json();
      if (res.ok && data.phoneNumber) {
        handleCall(data.phoneNumber); 
      } else {
        Alert.alert("Not Found", "User phone number not available.");
      }
    } catch (e) {
      Alert.alert("Network Error", "Could not fetch contact details.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = allTasks.filter(t => {
    if (taskFilter === 'All') return true;
    return t.status === taskFilter;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007EA7" />

      {/* --- NEW ELDER-THEMED HEADER --- */}
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']} />
        <View style={styles.headerNav}>
          <View>
            <Text style={styles.greetingText}>Sahayam Workspace</Text>
            <Text style={styles.headerTitle}>Admin Control</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await AsyncStorage.clear(); navigation.replace('Login'); }}>
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MAIN TABS --- */}
      <View style={styles.tabBar}>
        {['users', 'tasks', 'reports'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
           <ActivityIndicator size="large" color="#007EA7" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
              <>
                {/* --- ADDED BANNED SUB-TAB --- */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                    <View style={styles.subTabRow}>
                        {['Approvals', 'Volunteer List', 'Elderly List', 'Banned'].map(st => (
                          <TouchableOpacity key={st} style={[styles.subTab, userSubTab === st && styles.subTabActive, st === 'Banned' && userSubTab !== 'Banned' && {backgroundColor: '#FEF2F2'}]} onPress={() => setUserSubTab(st)}>
                            <Text style={[styles.subTabText, userSubTab === st && styles.subTabTextActive, st === 'Banned' && userSubTab !== 'Banned' && {color: '#DC2626'}]}>{st}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {userSubTab === 'Approvals' ? (
                  pendingUsers.length > 0 ? pendingUsers.map(user => (
                    <View key={user._id} style={styles.verifyCard}>
                       <View style={styles.verifyHeader}>
                          <TouchableOpacity onPress={() => {setSelectedImage(user.profileImage); setImgModalVisible(true)}}>
                             <Image source={{ uri: `data:image/jpeg;base64,${user.profileImage}` }} style={styles.bigAvatar} />
                          </TouchableOpacity>
                          <View style={{flex: 1, marginLeft: 15}}>
                            <Text style={styles.userName}>{user.fullName}</Text>
                            <Text style={styles.userRole}>New {user.role}</Text>
                          </View>
                       </View>
                       
                       <Text style={styles.idLabel}>IDENTITY PROOF (AADHAAR):</Text>
                       <TouchableOpacity style={styles.aadhaarBox} onPress={() => {setSelectedImage(user.aadhaarCardImage); setImgModalVisible(true)}}>
                          <Image source={{ uri: `data:image/jpeg;base64,${user.aadhaarCardImage}` }} style={styles.aadhaarImg} />
                          <View style={styles.zoomIcon}><Ionicons name="expand" size={20} color="#FFF" /></View>
                       </TouchableOpacity>

                       <View style={styles.btnRow}>
                          <TouchableOpacity style={styles.btnApprove} onPress={() => handleVerifyUser(user._id, true)}><Text style={styles.btnText}>Approve</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.btnReject} onPress={() => handleVerifyUser(user._id, false)}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
                       </View>
                    </View>
                  )) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkmark-circle-outline" size={40} color="#CBD5E1" />
                      <Text style={styles.emptyText}>No pending approvals.</Text>
                    </View>
                  )
                ) : userSubTab === 'Volunteer List' ? (
                  activeVolunteers.length > 0 ? activeVolunteers.map(v => (
                    <TouchableOpacity key={v._id} style={styles.listCard} onPress={() => handleUserPress(v)}>
                       <Image source={{ uri: formatImageUri(v.profileImage) }} style={styles.smallAvatar} />
                       <View style={{flex: 1, marginLeft: 12}}>
                          <Text style={styles.listName}>{v.fullName}</Text>
                          <Text style={styles.listSub}>{v.phoneNumber}</Text>
                       </View>
                       <View style={{flexDirection: 'row', gap: 10}}>
                          <TouchableOpacity style={styles.callIconBtn} onPress={() => handleCall(v.phoneNumber)}><Ionicons name="call" size={18} color="#007EA7" /></TouchableOpacity>
                       </View>
                    </TouchableOpacity>
                  )) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={40} color="#CBD5E1" />
                      <Text style={styles.emptyText}>No active volunteers found.</Text>
                    </View>
                  )
                ) : userSubTab === 'Elderly List' ? (
                  activeElderly.length > 0 ? activeElderly.map(e => (
                    <TouchableOpacity key={e._id} style={styles.listCard} onPress={() => handleUserPress(e)}>
                       {e.profileImage ? (
                          <Image source={{ uri: formatImageUri(e.profileImage) }} style={styles.smallAvatar} />
                       ) : (
                          <View style={[styles.smallAvatar, {alignItems: 'center', justifyContent: 'center'}]}>
                             <Text style={{color: '#007EA7', fontWeight: 'bold', fontSize: 18}}>{e.fullName?.charAt(0)}</Text>
                          </View>
                       )}
                       <View style={{flex: 1, marginLeft: 12}}>
                          <Text style={styles.listName}>{e.fullName}</Text>
                          <Text style={styles.listSub}>{e.phoneNumber}</Text>
                       </View>
                       <View style={{flexDirection: 'row', gap: 10}}>
                          <TouchableOpacity style={styles.callIconBtn} onPress={() => handleCall(e.phoneNumber)}><Ionicons name="call" size={18} color="#007EA7" /></TouchableOpacity>
                       </View>
                    </TouchableOpacity>
                  )) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={40} color="#CBD5E1" />
                      <Text style={styles.emptyText}>No active elderly users found.</Text>
                    </View>
                  )
                ) : (
                  // --- NEW BANNED LIST RENDERING ---
                  bannedUsers.length > 0 ? bannedUsers.map(b => (
                    <TouchableOpacity key={b._id} style={[styles.listCard, {borderLeftWidth: 4, borderLeftColor: '#DC2626'}]} onPress={() => handleUserPress(b)}>
                       {b.profileImage ? (
                          <Image source={{ uri: formatImageUri(b.profileImage) }} style={styles.smallAvatar} />
                       ) : (
                          <View style={[styles.smallAvatar, {alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2'}]}>
                             <Text style={{color: '#DC2626', fontWeight: 'bold', fontSize: 18}}>{b.fullName?.charAt(0)}</Text>
                          </View>
                       )}
                       <View style={{flex: 1, marginLeft: 12}}>
                          <Text style={styles.listName}>{b.fullName}</Text>
                          <Text style={[styles.listSub, {color: '#DC2626'}]}>Suspended ({b.role})</Text>
                       </View>
                    </TouchableOpacity>
                  )) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="shield-checkmark-outline" size={40} color="#CBD5E1" />
                      <Text style={styles.emptyText}>No suspended users.</Text>
                    </View>
                  )
                )}
              </>
            )}

            {/* --- TASKS TAB --- */}
            {activeTab === 'tasks' && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                  {['All', 'Pending', 'Accepted', 'Completed'].map(f => (
                    <TouchableOpacity 
                      key={f} 
                      onPress={() => setTaskFilter(f)}
                      style={[styles.filterChip, taskFilter === f && styles.activeFilterChip]}
                    >
                      <Text style={[styles.filterText, taskFilter === f && styles.activeFilterText]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                {filteredTasks.length > 0 ? filteredTasks.map(task => (
                  <TouchableOpacity key={task._id} style={styles.taskCard} onPress={() => handleTaskPress(task)}>
                    <View style={styles.rowBetween}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                          <View style={styles.cardIconBox}>
                            <FontAwesome5 name={task.category === "Health" ? "heartbeat" : (task.category === "Transport" ? "car" : task.category === "Emergency" ? "exclamation-triangle" : "shopping-basket")} size={14} color="#007EA7" />
                          </View>
                          <Text style={styles.taskTitle}>{task.category}</Text>
                        </View>
                        <View style={[styles.statusTag, {backgroundColor: task.status === 'Completed' ? '#E8F5E9' : task.status === 'Accepted' ? '#E0F2FE' : '#FFF3E0'}]}>
                          <Text style={{fontSize: 10, color: task.status === 'Completed' ? '#2E7D32' : task.status === 'Accepted' ? '#0284C7' : '#EF6C00', fontWeight: 'bold'}}>{task.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.taskSub}>Req: {task.requesterName} • {new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                )) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="list-outline" size={40} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No tasks found in this category.</Text>
                  </View>
                )}
              </>
            )}

            {/* --- REPORTS TAB --- */}
            {activeTab === 'reports' && (
              reports.filter(r => r.status !== 'Resolved').length > 0 ? 
              reports.filter(r => r.status !== 'Resolved').map(report => (
                <TouchableOpacity key={report._id} style={styles.reportCard} onPress={() => handleReportPress(report)}>
                   <View style={styles.reportHeaderRow}>
                      <View style={styles.alertIconBox}>
                        <MaterialIcons name="report-problem" size={18} color="#DC2626" />
                      </View>
                      <Text style={styles.reportTitle}>Issue: {report.taskTitle}</Text>
                   </View>
                   <View style={styles.reportQuoteBox}>
                      <Text style={styles.reportText} numberOfLines={2}>"{report.issue}"</Text>
                   </View>
                   <View style={styles.reportFooter}>
                      <Text style={styles.reportByText}>By: {report.reporterName}</Text>
                      <Text style={{fontSize: 12, color: '#007EA7', fontWeight: 'bold'}}>Review Issue →</Text>
                   </View>
                </TouchableOpacity>
              )) : (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-checkmark-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No active complaints.</Text>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>

      {/* --- USER DETAILS MODAL (VOLUNTEER, ELDERLY, OR BANNED) --- */}
      <Modal visible={isUserModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.taskModalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderTitle}>User Profile</Text>
                    <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                        <Ionicons name="close-circle" size={30} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={{alignItems: 'center', marginBottom: 20}}>
                    {selectedUser?.profileImage ? (
                        <Image source={{ uri: formatImageUri(selectedUser.profileImage) }} style={{width: 90, height: 90, borderRadius: 45, marginBottom: 12, borderWidth: 3, borderColor: selectedUser?.accountStatus === 'terminated' ? '#FECACA' : '#E0F2FE'}} />
                    ) : (
                        <View style={{width: 90, height: 90, borderRadius: 45, backgroundColor: selectedUser?.accountStatus === 'terminated' ? '#FEF2F2' : '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: selectedUser?.accountStatus === 'terminated' ? '#FECACA' : '#BAE6FD'}}>
                            <Text style={{fontSize: 32, color: selectedUser?.accountStatus === 'terminated' ? '#DC2626' : '#007EA7', fontWeight: 'bold'}}>{selectedUser?.fullName?.charAt(0)}</Text>
                        </View>
                    )}
                    <Text style={{fontSize: 22, fontWeight: '800', color: '#1E293B'}}>{selectedUser?.fullName}</Text>
                    <Text style={{fontSize: 14, color: selectedUser?.accountStatus === 'terminated' ? '#DC2626' : '#007EA7', fontWeight: '600'}}>
                        {selectedUser?.accountStatus === 'terminated' ? 'SUSPENDED' : selectedUser?.displayRole}
                    </Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Contact Information</Text>
                    <Text style={styles.detailValue}>Phone: {selectedUser?.phoneNumber}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Identity</Text>
                    <Text style={styles.detailValue}>Aadhaar: {selectedUser?.aadhaarNumber}</Text>
                    {selectedUser?.accountStatus !== 'terminated' && (
                        <Text style={{color: '#10B981', fontWeight: 'bold', marginTop: 5}}>✓ Verified Document</Text>
                    )}
                </View>

                <View style={{flexDirection: 'row', gap: 12, marginTop: 10}}>
                    {selectedUser?.accountStatus === 'terminated' ? (
                        <TouchableOpacity style={[styles.adminActionBtn, {flex: 1, backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', gap: 8}]} onPress={() => handleUnbanUser(selectedUser?._id, selectedUser?.fullName)}>
                            <Ionicons name="refresh" size={18} color="#FFF" />
                            <Text style={styles.adminActionText}>Restore Access</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity style={[styles.adminActionBtn, {flex: 1, backgroundColor: '#007EA7', flexDirection: 'row', justifyContent: 'center', gap: 8}]} onPress={() => handleCall(selectedUser?.phoneNumber)}>
                                <Ionicons name="call" size={18} color="#FFF" />
                                <Text style={styles.adminActionText}>Call User</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, {backgroundColor: '#FEF2F2', paddingHorizontal: 16}]} onPress={() => handleBanUser(selectedUser?._id, selectedUser?.fullName)}>
                                <Ionicons name="warning" size={22} color="#DC2626" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
      </Modal>

      {/* --- REPORT DETAILS MODAL --- */}
      <Modal visible={isReportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.taskModalContent}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalHeaderTitle, {color: '#DC2626'}]}>Complaint Details</Text>
                    <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                        <Ionicons name="close-circle" size={30} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Issue Reported</Text>
                        <View style={{backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA'}}>
                            <Text style={{fontSize: 16, color: '#991B1B', fontStyle: 'italic', lineHeight: 24}}>"{selectedReport?.issue}"</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={{flex: 1}}>
                            <Text style={styles.detailLabel}>Reported By</Text>
                            <Text style={styles.detailValue}>{selectedReport?.reporterName}</Text>
                            <Text style={{fontSize: 12, color: '#64748B'}}>{selectedReport?.reporterRole}</Text>
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>{selectedReport ? new Date(selectedReport.createdAt).toLocaleDateString() : ''}</Text>
                        </View>
                    </View>

<View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Associated Task</Text>
                        <Text style={styles.detailValue}>{selectedReport?.taskTitle}</Text>
                        {selectedReport?.fullTaskDetails && (
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                                <Text style={{color: '#64748B'}}>Volunteered by: </Text>
                                
                                {selectedReport.volunteerProfile ? (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            // Close report modal and open the user profile modal!
                                            setReportModalVisible(false);
                                            handleUserPress(selectedReport.volunteerProfile);
                                        }}
                                    >
                                        <Text style={{color: '#007EA7', fontWeight: '800', textDecorationLine: 'underline'}}>
                                            {selectedReport.fullTaskDetails.volunteerName}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={{color: '#64748B'}}>{selectedReport.fullTaskDetails.volunteerName || 'Unknown'}</Text>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View style={{flexDirection: 'row', gap: 12, marginTop: 10}}>
                    <TouchableOpacity 
                        style={[styles.adminActionBtn, {flex: 1, backgroundColor: '#007EA7', flexDirection: 'row', justifyContent: 'center', gap: 8}]} 
                        onPress={() => handleContactReporter(selectedReport?.reportedBy)}
                    >
                        <Ionicons name="call" size={18} color="#FFF" />
                        <Text style={styles.adminActionText}>Contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.adminActionBtn, {flex: 1.5, backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', gap: 8}]} 
                        onPress={() => handleResolveReport(selectedReport._id)}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                        <Text style={styles.adminActionText}>Mark Resolved</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- TASK DETAILS MODAL --- */}
      <Modal visible={isTaskModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.taskModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Task Details</Text>
              <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Service Category</Text>
                <Text style={styles.detailValue}>{selectedTask?.category}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, {color: '#007EA7'}]}>{selectedTask?.status}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={{flex: 1}}>
                    <Text style={styles.detailLabel}>Requested By</Text>
                    <Text style={styles.detailValue}>{selectedTask?.requesterName}</Text>
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.detailLabel}>Volunteer</Text>
                    <Text style={styles.detailValue}>{selectedTask?.volunteerName || "Waiting..."}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{selectedTask?.curr_location || "Location not provided"}</Text>
              </View>

              {selectedTask?.notes && (
                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedTask.notes}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.adminActionBtn} onPress={() => setTaskModalVisible(false)}>
                <Text style={styles.adminActionText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- IMAGE VIEWER MODAL --- */}
      <Modal visible={isImgModalVisible} transparent animationType="fade">
        <View style={styles.modalImgContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setImgModalVisible(false)}>
             <Ionicons name="close-circle" size={44} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
             <Image source={{ uri: `data:image/jpeg;base64,${selectedImage}` }} style={styles.fullImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // NEW ELDER THEME HEADER
  headerBackground: {
    backgroundColor: '#007EA7',
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#007EA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { color: '#E0F2FE', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', marginTop: -15, paddingTop: 20, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0', zIndex: 1 },
  tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTabItem: { borderBottomWidth: 3, borderColor: '#007EA7' },
  tabLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  activeTabLabel: { color: '#007EA7' },
  
  scrollContainer: { padding: 20, paddingBottom: 40 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 12, fontSize: 14, fontWeight: '600' },

  // Sub Tabs
  subTabRow: { flexDirection: 'row', gap: 6, paddingRight: 10 },
  subTab: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E0F2FE', alignItems: 'center', marginRight: 8 },
  subTabActive: { backgroundColor: '#007EA7' },
  subTabText: { color: '#007EA7', fontWeight: 'bold', fontSize: 12 },
  subTabTextActive: { color: '#FFF' },

  // Verification Card
  verifyCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  bigAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#E0F2FE' },
  userName: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  userRole: { fontSize: 13, color: '#007EA7', fontWeight: 'bold', marginTop: 2 },
  idLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 10, letterSpacing: 0.5 },
  aadhaarBox: { height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  aadhaarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  zoomIcon: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 10 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnApprove: { flex: 2, backgroundColor: '#10B981', padding: 16, borderRadius: 14, alignItems: 'center' },
  btnReject: { flex: 1, backgroundColor: '#FEF2F2', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  rejectText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },

  // Volunteer List Card
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  smallAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0F2FE', borderWidth: 2, borderColor: '#F0F9FF', overflow: 'hidden' },
  listName: { fontWeight: '800', fontSize: 16, color: '#1E293B' },
  listSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  callIconBtn: { padding: 12, backgroundColor: '#F0F9FF', borderRadius: 12 },

  // Tasks Tab
  filterBar: { marginBottom: 20, paddingBottom: 5 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  activeFilterChip: { backgroundColor: '#007EA7', borderColor: '#007EA7' },
  filterText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  activeFilterText: { color: '#FFF' },
  
  taskCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 14, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  taskSub: { fontSize: 13, color: '#64748B', marginTop: 12, fontWeight: '500' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

  // Report Card
  reportCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 16, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#FEE2E2' },
  reportHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  alertIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontWeight: '800', color: '#1E293B', fontSize: 16, flex: 1 },
  reportQuoteBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#DC2626' },
  reportText: { fontSize: 14, color: '#475569', fontStyle: 'italic', lineHeight: 20 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 },
  reportByText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  taskModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: height * 0.85, shadowColor: '#000', shadowOffset: {width:0, height:-4}, shadowOpacity: 0.1, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalHeaderTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  detailSection: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', marginBottom: 20 },
  detailLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#334155', fontWeight: '600' },
  
  adminActionBtn: { backgroundColor: '#007EA7', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  adminActionText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  modalImgContent: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullImg: { width: '100%', height: '80%' },
  closeBtn: { position: 'absolute', top: 60, right: 24, zIndex: 10 }
});