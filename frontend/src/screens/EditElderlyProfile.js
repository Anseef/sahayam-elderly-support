import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function EditElderlyProfile({ route, navigation }) {
  const { currentUser, onSave } = route.params;
  const [formData, setFormData] = useState(currentUser);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert("Error", "Name and Phone are required.");
      return;
    }

    onSave(formData);
    
    Alert.alert("Success", "Profile updated successfully!");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          
          <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
          <InputField label="Full Name" value={formData.name} onChangeText={(t) => handleChange('name', t)} />
          <InputField label="Phone Number" value={formData.phone} onChangeText={(t) => handleChange('phone', t)} keyboardType="phone-pad" />
          <InputField label="Address" value={formData.address} onChangeText={(t) => handleChange('address', t)} multiline />
          <InputField label="Aadhaar Number" value={formData.aadhaar} onChangeText={(t) => handleChange('aadhaar', t)} keyboardType="numeric" />

          <Text style={styles.sectionLabel}>MEDICAL INFO</Text>
          <InputField label="Blood Group" value={formData.bloodGroup} onChangeText={(t) => handleChange('bloodGroup', t)} />
          <InputField label="Medical Conditions" value={formData.conditions} onChangeText={(t) => handleChange('conditions', t)} />

          <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
          <InputField label="Guardian Name & Phone" value={formData.guardian} onChangeText={(t) => handleChange('guardian', t)} />

          <TouchableOpacity style={styles.saveButtonMain} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InputField = ({ label, value, onChangeText, multiline, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEFF1'
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { color: '#007EA7', fontWeight: '700', fontSize: 16 },
  formContainer: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#90A4AE', marginBottom: 15, marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#455A64', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#CFD8DC', borderRadius: 10,
    padding: 12, fontSize: 16, color: '#0A1E29'
  },
  saveButtonMain: {
    backgroundColor: '#007EA7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});