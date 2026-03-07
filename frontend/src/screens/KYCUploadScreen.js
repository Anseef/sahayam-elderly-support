import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function KYCUploadScreen({ route, navigation }) {
  // Get the newly registered userId from the route parameters
  const { userId } = route.params;

  const [aadhaarImage, setAadhaarImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (setImageFunc) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3, // Keep quality low so the Base64 string doesn't crash MongoDB
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageFunc(result.assets[0].base64);
    }
  };

  const handleSubmit = async () => {
    if (!aadhaarImage || !selfieImage) {
      Alert.alert("Incomplete", "Please upload both your Aadhaar card and a current photo.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'}/api/user/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aadhaarCardImage: aadhaarImage, 
          profileImage: selfieImage // Also sets their main profile picture!
        })
      });

      if (response.ok) {
        Alert.alert(
          "Verification Submitted", 
          "Your documents have been sent to the admin. Please log in to check your status.",
          [{ text: "Go to Login", onPress: () => navigation.replace('Login') }]
        );
      } else {
        Alert.alert("Error", "Could not upload documents.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check" size={40} color="#007EA7" />
          </View>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>To keep our community safe, volunteers must verify their identity.</Text>
        </View>

        {/* 1. AADHAAR UPLOAD CARD */}
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>1. Upload Aadhaar Card</Text>
          <Text style={styles.cardSub}>Clear photo of the front side</Text>
          
          <TouchableOpacity 
            style={[styles.imageBox, aadhaarImage && styles.imageBoxSuccess]} 
            onPress={() => pickImage(setAadhaarImage)}
            activeOpacity={0.8}
          >
            {aadhaarImage ? (
              <Image source={{ uri: `data:image/jpeg;base64,${aadhaarImage}` }} style={styles.uploadedImg} />
            ) : (
              <>
                <Ionicons name="card-outline" size={40} color="#94A3B8" />
                <Text style={styles.uploadText}>Tap to upload Aadhaar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. SELFIE UPLOAD CARD */}
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>2. Upload Current Photo</Text>
          <Text style={styles.cardSub}>A clear selfie for your profile</Text>
          
          <TouchableOpacity 
            style={[styles.imageBox, selfieImage && styles.imageBoxSuccess]} 
            onPress={() => pickImage(setSelfieImage)}
            activeOpacity={0.8}
          >
            {selfieImage ? (
              <Image source={{ uri: `data:image/jpeg;base64,${selfieImage}` }} style={styles.uploadedImg} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                <Text style={styles.uploadText}>Tap to take selfie</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, (!aadhaarImage || !selfieImage || loading) && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={!aadhaarImage || !selfieImage || loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Text style={styles.submitBtnText}>Submit Verification</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  
  uploadCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowOffset: {width: 0, height: 4}, shadowRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#94A3B8', marginBottom: 16 },
  imageBox: { height: 160, backgroundColor: '#F1F5F9', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imageBoxSuccess: { borderStyle: 'solid', borderColor: '#BAE6FD', borderWidth: 1 },
  uploadedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 12 },

  submitBtn: { flexDirection: 'row', backgroundColor: '#007EA7', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10, shadowColor: '#007EA7', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});