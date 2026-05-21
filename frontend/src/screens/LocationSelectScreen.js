import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, FlatList, Keyboard, Dimensions,
  TouchableWithoutFeedback, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- HELPER FUNCTION TO FILTER LOCATION ---
const formatShortAddress = (fullAddress) => {
  if (!fullAddress) return '';
  const parts = fullAddress.split(',').map(part => part.trim());
  const filteredParts = parts.filter(part => !/^\d+$/.test(part) && part.toLowerCase() !== 'india');
  
  if (filteredParts.length >= 2) {
    return `${filteredParts[filteredParts.length - 2]}, ${filteredParts[filteredParts.length - 1]}`;
  } else if (filteredParts.length === 1) {
    return filteredParts[0];
  }
  return fullAddress; 
};

export default function LocationSelectScreen({ navigation }) {

  const [loading, setLoading] = useState(true);
  const [currentAddress, setCurrentAddress] = useState(null); // The currently active short location
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [userId, setUserId] = useState(null);

  // --- MODAL STATES FOR ADD/EDIT ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLabel, setFormLabel] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // --- FETCH INITIAL DATA ---
  const fetchUserData = async () => {
    try {
        const storedUser = await AsyncStorage.getItem('user');
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);
        const uId = parsedUser.id || parsedUser._id;
        setUserId(uId);

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${uId}`);
        if (response.ok) {
            const userData = await response.json();
            setCurrentAddress(userData.location || null);

            if (userData.savedAddresses && userData.savedAddresses.length > 0) {
                setSavedAddresses(userData.savedAddresses);
            } else {
                setSavedAddresses([]); 
            }
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    } finally {
        setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUserData(); }, []));

  // --- DATABASE UPDATE LOGIC ---
  const saveToDB = async (newActiveShortLocation, newAddressArray) => {
    try {
      if (!userId) return;

      const payload = {};
      if (newActiveShortLocation) payload.location = newActiveShortLocation; // Updates Home screen header
      if (newAddressArray) payload.savedAddresses = newAddressArray;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });

      if (response.ok) {
        if (newActiveShortLocation) {
            const storedUser = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(storedUser);
            parsedUser.location = newActiveShortLocation;
            await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
        }
      }
    } catch (error) {
      console.error("Failed to sync with DB:", error);
    }
  };

  const getIconForLabel = (label) => {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('home')) return { icon: 'home', iconColor: '#475569', iconBg: '#F1F5F9' };
      if (lowerLabel.includes('hospital') || lowerLabel.includes('clinic')) return { icon: 'hospital', iconColor: '#166534', iconBg: '#F0FDF4' };
      if (lowerLabel.includes('work') || lowerLabel.includes('office')) return { icon: 'briefcase', iconColor: '#9333EA', iconBg: '#FAF5FF' };
      return { icon: 'location', iconColor: '#0369A1', iconBg: '#E0F2FE' };
  };

  // --- HANDLE MODAL SAVE ---
  const handleSaveModal = () => {
      if (!formLabel.trim() || !formAddress.trim()) {
          Alert.alert("Error", "Please fill in both fields.");
          return;
      }

      const shortAddr = formatShortAddress(formAddress);
      const styleInfo = getIconForLabel(formLabel);

      let updatedArray;
      if (editingId) {
          // Edit existing
          updatedArray = savedAddresses.map(item => 
              item.id === editingId 
                  ? { ...item, label: formLabel, fullAddress: formAddress, address: shortAddr, ...styleInfo }
                  : item
          );
      } else {
          // Add new
          const newAddressObj = {
              id: Date.now().toString(),
              label: formLabel, 
              address: shortAddr, // The short version for the DB 'location'
              fullAddress: formAddress, // The long version for the UI list
              ...styleInfo
          };
          updatedArray = [newAddressObj, ...savedAddresses];
      }

      setSavedAddresses(updatedArray);
      saveToDB(shortAddr, updatedArray);
      setCurrentAddress(shortAddr); // Automatically select it
      
      setIsModalVisible(false);
      setEditingId(null);
      setFormLabel('');
      setFormAddress('');
  };

  // --- OTHER ACTIONS ---
  const searchPlaces = async (text) => {
    setSearchText(text);
    if (text.length < 3) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${text}&countrycodes=in&limit=5`, { headers: { 'User-Agent': 'SahayamApp/1.0' } });
      const data = await response.json();
      setSuggestions(data);
    } catch (error) { console.log("Search Error", error); } finally { setIsSearching(false); }
  };

  const selectSuggestion = (item) => {
    const fullAddress = item.display_name;
    const shortAddress = formatShortAddress(fullAddress);

    setSearchText('');
    setSuggestions([]);
    Keyboard.dismiss();

    // Open modal to add a label to this found address
    setFormAddress(fullAddress);
    setFormLabel('Recent Location');
    setEditingId(null);
    setIsModalVisible(true);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Allow location access.'); return; }
      
      let location = await Location.getCurrentPositionAsync({});
      let addressResponse = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      
      if (addressResponse.length > 0) {
        let addr = addressResponse[0];
        const fullAddress = `${addr.name || ''}, ${addr.street || ''}, ${addr.city || addr.subregion}, ${addr.region}`.replace(/^, /, ''); // Clean leading comma
        
        setFormAddress(fullAddress);
        setFormLabel('Current Location');
        setEditingId(null);
        setIsModalVisible(true); // Open modal to confirm/edit before saving
      }
    } catch (error) { 
      Alert.alert("Error", "Could not fetch location."); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);
  const closeMenu = () => setOpenMenuId(null);

  const handleDelete = (id) => {
    Alert.alert("Delete Address", "Remove this location?", [
      { text: "Cancel", style: "cancel", onPress: closeMenu },
      { text: "Delete", style: 'destructive', onPress: () => { 
          const filteredArray = savedAddresses.filter(item => item.id !== id);
          setSavedAddresses(filteredArray); 
          saveToDB(null, filteredArray); 
          closeMenu(); 
      }}
    ]);
  };

  const openEditModal = (item) => {
    closeMenu();
    setFormLabel(item.label);
    setFormAddress(item.fullAddress || item.address); // Fallback to short if full doesn't exist
    setEditingId(item.id);
    setIsModalVisible(true);
  };

  if (loading) {
      return (
          <SafeAreaView style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
              <ActivityIndicator size="large" color="#007EA7" />
          </SafeAreaView>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View style={{ flex: 1 }}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Location</Text>
          </View>

          {/* SEARCH & SUGGESTIONS */}
          <View style={styles.zIndexWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput 
                placeholder="Search city, area, or street..."
                style={styles.searchInput}
                placeholderTextColor="#94A3B8"
                value={searchText}
                onChangeText={searchPlaces}
              />
              {isSearching && <ActivityIndicator size="small" color="#007EA7" style={{marginRight: 8}} />}
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                      <View style={styles.suggestionIcon}>
                        <Ionicons name="location-sharp" size={16} color="#64748B" />
                      </View>
                      <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          <View style={styles.contentLayer}>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionCard, {backgroundColor: '#E0F2FE'}]} onPress={getCurrentLocation} activeOpacity={0.8}>
                {loading ? <ActivityIndicator size="small" color="#007EA7" /> : (
                  <View style={[styles.iconCircle, {backgroundColor: '#FFF'}]}><Ionicons name="locate" size={22} color="#007EA7" /></View>
                )}
                <Text style={[styles.actionText, {color: '#0369A1'}]}>Use Current{'\n'}Location</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, {backgroundColor: '#FFF7ED'}]} onPress={() => { setFormLabel(''); setFormAddress(''); setEditingId(null); setIsModalVisible(true); }} activeOpacity={0.8}>
                <View style={[styles.iconCircle, {backgroundColor: '#FFF'}]}><Ionicons name="add" size={24} color="#EA580C" /></View>
                <Text style={[styles.actionText, {color: '#C2410C'}]}>Add New{'\n'}Address</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, {backgroundColor: '#FCE7F3'}]} onPress={() => Alert.alert("Support", "Connecting...")} activeOpacity={0.8}>
                <View style={[styles.iconCircle, {backgroundColor: '#FFF'}]}><Ionicons name="call" size={20} color="#DB2777" /></View>
                <Text style={[styles.actionText, {color: '#BE185D'}]}>Call for{'\n'}Help</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>

            <ScrollView contentContainerStyle={styles.listContent}>
              {savedAddresses.map((item) => (
                <View key={item.id} style={{ zIndex: openMenuId === item.id ? 100 : 1 }}>
                  <TouchableOpacity 
                    style={styles.addressCard} 
                    activeOpacity={0.9}
                    onPress={() => {
                      setCurrentAddress(item.address);
                      saveToDB(item.address, null); 
                      closeMenu();
                    }}
                  >
                    <View style={[styles.addressIconContainer, { backgroundColor: item.iconBg }]}>
                      {item.icon === 'home' || item.icon === 'location' ? (
                        <Ionicons name={item.icon} size={20} color={item.iconColor} />
                      ) : (
                        <FontAwesome5 name={item.icon} size={18} color={item.iconColor} />
                      )}
                    </View>
                    
                    <View style={styles.addressDetails}>
                      <View style={styles.addressTitleRow}>
                        <Text style={styles.addressTitle} numberOfLines={1}>{item.label}</Text>
                        {currentAddress === item.address && (
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>SELECTED</Text>
                          </View>
                        )}
                      </View>
                      {/* SHOW FULL ADDRESS IN THE LIST */}
                      <Text style={styles.addressText} numberOfLines={2}>{item.fullAddress || item.address}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.menuTrigger} onPress={() => toggleMenu(item.id)}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Menu Dropdown */}
                  {openMenuId === item.id && (
                    <View style={styles.menuDropdown}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => openEditModal(item)}>
                        <Ionicons name="create-outline" size={18} color="#475569" />
                        <Text style={styles.menuText}>Edit</Text>
                      </TouchableOpacity>
                      <View style={styles.menuDivider} />
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              
              {savedAddresses.length === 0 && <Text style={styles.emptyText}>No saved addresses found.</Text>}
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* --- ADD / EDIT ADDRESS MODAL --- */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingId ? "Edit Address" : "Save New Address"}</Text>
                    <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Label (e.g. Home, Office)</Text>
                <TextInput 
                    style={styles.modalInput}
                    value={formLabel}
                    onChangeText={setFormLabel}
                    placeholder="Enter label"
                />

                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput 
                    style={[styles.modalInput, styles.textArea]}
                    value={formAddress}
                    onChangeText={setFormAddress}
                    placeholder="Enter full address details"
                    multiline
                    numberOfLines={3}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveModal}>
                    <Text style={styles.saveBtnText}>Save Location</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
  zIndexWrapper: { zIndex: 100 }, 
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 24, paddingHorizontal: 16, borderRadius: 16, height: 56, shadowColor: '#64748B', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#0F172A', height: '100%' },
  suggestionsBox: { position: 'absolute', top: 65, left: 20, right: 20, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, maxHeight: 220, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  suggestionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  suggestionText: { fontSize: 14, color: '#334155', flex: 1, lineHeight: 20 },
  contentLayer: { zIndex: 1, flex: 1 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 32 },
  actionCard: { width: '31%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4 },
  actionText: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginLeft: 24, marginBottom: 12, letterSpacing: 1 },
  listContent: { paddingHorizontal: 20 },
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 16, shadowColor: '#64748B', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, position: 'relative' },
  addressIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  addressDetails: { flex: 1, marginRight: 8 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginRight: 8, flex: 1 },
  tag: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '800', color: '#166534' },
  addressText: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  menuTrigger: { padding: 4 },
  menuDropdown: { position: 'absolute', right: 10, top: 50, backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 4, width: 140, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 10 },
  menuText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 10 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontStyle: 'italic' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1E293B', marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#007EA7', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});