import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('elderly');
    const [aadhaar, setAadhaar] = useState('');
    const [location, setLocation] = useState('');

    const handleRegister = () => {
        register(name, mobile, password, role, aadhaar, { address: location });
    };

    return (
        <SafeAreaProvider style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Create Account</Text>

                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'elderly' && styles.roleButtonActive]}
                        onPress={() => setRole('elderly')}
                    >
                        <Text style={[styles.roleText, role === 'elderly' && styles.roleTextActive]}>Elderly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'volunteer' && styles.roleButtonActive]}
                        onPress={() => setRole('volunteer')}
                    >
                        <Text style={[styles.roleText, role === 'volunteer' && styles.roleTextActive]}>Volunteer</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Mobile Number"
                        value={mobile}
                        onChangeText={setMobile}
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Location / Address"
                        value={location}
                        onChangeText={setLocation}
                    />

                    {role === 'volunteer' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Aadhaar Number (12 digits)"
                            value={aadhaar}
                            onChangeText={setAadhaar}
                            keyboardType="numeric"
                        />
                    )}
                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.link}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
        justifyContent: 'center',
        minHeight: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        padding: 4,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    roleButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roleText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#FF6B6B',
    },
    form: {
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#FF6B6B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    link: {
        color: '#FF6B6B',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default RegisterScreen;
