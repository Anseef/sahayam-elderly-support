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
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function LocationSelectScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  
  // --- NEW: Search State ---
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- FUNCTION 1: Fetch Search Suggestions (OpenStreetMap) ---
  const searchPlaces = async (text) => {
    setSearchText(text);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Free API endpoint (Restricted to India for better results)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${text}&countrycodes=in&limit=5`,
        {
          headers: {
            'User-Agent': 'SahayamApp/1.0' // Required by OpenStreetMap
          }
        }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.log("Search Error", error);
    } finally {
      setIsSearching(false);
    }
  };

  // --- FUNCTION 2: Select a Suggestion ---
  const selectSuggestion = (item) => {
    setSearchText(item.display_name); // Fill input with address
    setCurrentAddress(item.display_name); // Set as current selected
    setSuggestions([]); // Clear list
    Keyboard.dismiss(); // Close keyboard
  };

  // --- FUNCTION 3: Get GPS Location ---
  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to detect your address.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        let addr = addressResponse[0];
        const formattedAddress = `${addr.name || ''}, ${addr.street || ''}, ${addr.city}, ${addr.region}`;
        setCurrentAddress(formattedAddress);
        setSearchText(formattedAddress); // Auto-fill search bar
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Location</Text>
      </View>

      {/* --- SEARCH BAR SECTION --- */}
      <View style={styles.zIndexWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search an area or address"
            style={styles.searchInput}
            placeholderTextColor="#9E9E9E"
            value={searchText}
            onChangeText={searchPlaces} // Calls API on typing
          />
          {isSearching && <ActivityIndicator size="small" color="#007EA7" />}
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); }}>
              <Ionicons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>

        {/* --- SUGGESTIONS LIST (Absolute Positioned) --- */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem} 
                  onPress={() => selectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#757575" style={{ marginRight: 10 }} />
                  <Text style={styles.suggestionText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* --- NORMAL CONTENT (Action Grid) --- */}
      <View style={styles.contentLayer}>
        <View style={styles.actionGrid}>
          {/* Turn on Location */}
          <TouchableOpacity style={styles.actionCard} onPress={getCurrentLocation}>
            {loading ? (
              <ActivityIndicator size="small" color="#007EA7" />
            ) : (
              <View style={styles.iconCircle}>
                 <Ionicons name="locate" size={24} color="#007EA7" />
              </View>
            )}
            <Text style={styles.actionText}>Turn on{'\n'}Location</Text>
          </TouchableOpacity>

          {/* Add New Address */}
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.iconCircle, { borderColor: '#FF9800' }]}>
              <Ionicons name="add" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Add New{'\n'}Address</Text>
          </TouchableOpacity>

          {/* Request Address */}
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert("Support", "Connecting to support team...")}
          >
            <View style={[styles.iconCircle, { borderColor: '#E91E63' }]}>
              <Ionicons name="call" size={24} color="#E91E63" />
            </View>
            <Text style={styles.actionText}>Call for{'\n'}Help</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>

        <ScrollView contentContainerStyle={styles.listContent}>
          <TouchableOpacity style={styles.addressCard}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="home-outline" size={20} color="#333" />
            </View>
            
            <View style={styles.addressDetails}>
              <View style={styles.addressTitleRow}>
                <Text style={styles.addressTitle}>Home</Text>
                {currentAddress && <View style={styles.tag}><Text style={styles.tagText}>SELECTED</Text></View>}
              </View>
              <Text style={styles.addressText} numberOfLines={2}>
                {currentAddress || "No location selected yet."}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 16, color: '#000' },

  // --- Search Styles ---
  zIndexWrapper: { zIndex: 10 }, // Ensures suggestions appear ON TOP
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  
  // --- Suggestions Dropdown Styles ---
  suggestionsBox: {
    position: 'absolute',
    top: 70, // Just below search bar
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },

  // --- Content Styles ---
  contentLayer: { zIndex: 1 }, // Pushes this behind suggestions
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 },
  actionCard: {
    backgroundColor: '#fff', width: '30%', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', elevation: 2,
  },
  iconCircle: { marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '600', textAlign: 'center', color: '#424242' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9E9E9E', marginLeft: 16, marginBottom: 12 },
  listContent: { paddingHorizontal: 16 },
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  addressIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addressDetails: { flex: 1, marginRight: 8 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginRight: 8 },
  tag: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },
  addressText: { fontSize: 13, color: '#616161', lineHeight: 18 },
});