import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function LocationSelectScreen({ navigation }) {

  const [loading, setLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([
    { 
      id: '1', 
      label: 'Home', 
      address: 'Mangottu House, Kumbazha Road, Pathanamthitta, Kerala', 
      icon: 'home', 
      iconColor: '#475569', 
      iconBg: '#F1F5F9' 
    },
    { 
      id: '2', 
      label: 'City Hospital', 
      address: 'General Hospital Road, Pathanamthitta', 
      icon: 'hospital', 
      iconColor: '#166534', 
      iconBg: '#F0FDF4' 
    }
  ]);

  const [openMenuId, setOpenMenuId] = useState(null);

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
    const address = item.display_name;

    setSearchText(address);
    setCurrentAddress(address);
    setSuggestions([]);
    Keyboard.dismiss();

    setSavedAddresses((prevAddresses) => {

      const filteredAddresses = prevAddresses.filter(addr => addr.label !== 'Current Location');

      const newLocation = {
        id: 'current_location_id', 
        label: 'Current Location', 
        address: address,
        icon: 'location', 
        iconColor: '#0369A1',
        iconBg: '#E0F2FE'
      };

      return [newLocation, ...filteredAddresses]; 
    });
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
        const formattedAddress = `${addr.name || ''}, ${addr.street || ''}, ${addr.city}, ${addr.region}`;
        
        setCurrentAddress(formattedAddress);
        setSearchText(formattedAddress);

        setSavedAddresses((prevAddresses) => {
          const filteredAddresses = prevAddresses.filter(addr => addr.label !== 'Current Location');

          const newLocation = {
            id: 'current_location_id',
            label: 'Current Location',
            address: formattedAddress,
            icon: 'location', 
            iconColor: '#0369A1',
            iconBg: '#E0F2FE'
          };
          
          return [newLocation, ...filteredAddresses];
        });
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
      { text: "Delete", style: 'destructive', onPress: () => { setSavedAddresses(prev => prev.filter(item => item.id !== id)); closeMenu(); } }
    ]);
  };

  const handleEdit = (id) => {
    closeMenu();
    Alert.alert("Edit Address", `Edit feature for ID: ${id} coming soon.`);
  };

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

              <TouchableOpacity style={[styles.actionCard, {backgroundColor: '#FFF7ED'}]} activeOpacity={0.8}>
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
                      closeMenu();
                    }}
                  >
                    <View style={[styles.addressIconContainer, { backgroundColor: item.iconBg }]}>
                      {/* FIX: Check for 'location' icon name */}
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
                      <Text style={styles.addressText} numberOfLines={2}>{item.address}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.menuTrigger} onPress={() => toggleMenu(item.id)}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Menu Dropdown */}
                  {openMenuId === item.id && (
                    <View style={styles.menuDropdown}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleEdit(item.id)}>
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
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontStyle: 'italic' }
});