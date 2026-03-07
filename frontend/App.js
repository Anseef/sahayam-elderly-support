import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// --- SCREENS ---
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Elderly Screens
import ElderlyDashboard from './src/screens/ElderlyDashboard';
import EmergencyHelpScreen from './src/screens/EmergencyHelpScreen';
import LocationSelectScreen from './src/screens/LocationSelectScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import ElderlyProfile from './src/screens/ElderlyProfile';
import EditElderlyProfile from './src/screens/EditElderlyProfile';
import AddServiceScreen from './src/screens/AddServiceScreen';

// Volunteer Screens
import VolunteerDashboardScreen from './src/screens/VolunteerDashboard'; // Renamed import to avoid conflict
import VolunteerProfile from './src/screens/VolunteerProfile';
import PublicProfileScreen from './src/screens/PublicProfileScreen';
import EditVolunteerProfile from './src/screens/EditVolunteerProfile';
import VolunteerEmergencyScreen from './src/screens/VolunteerEmergencyScreen';


import AdminDashboard from './src/screens/AdminDashboard';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';
import RejectedScreen from './src/screens/RrejectedScreen';
import KYCUploadScreen from './src/screens/KYCUploadScreen';



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. ELDERLY TAB NAVIGATION ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: route.name === 'Emergency' ? '#D32F2F' : '#007EA7',
        tabBarInactiveTintColor: '#90A4AE',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
        tabBarIconStyle: { marginTop: 5 }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={ElderlyDashboard} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      <Tab.Screen 
        name="Emergency" 
        component={EmergencyHelpScreen} 
        options={{
          tabBarLabel: 'Emergency',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name="alert-octagon" 
              size={28} 
              color={focused ? '#D32F2F' : color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- 2. VOLUNTEER TAB NAVIGATION (NEW) ---
function VolunteerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#007EA7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
        tabBarIconStyle: { marginTop: 5 }
      }}
    >
      <Tab.Screen 
        name="VolunteerHome" 
        component={VolunteerDashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />,
        }}
      />

      <Tab.Screen 
        name="VolunteerProfileTab" 
        component={VolunteerProfile} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-alt" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// --- 3. ROOT STACK ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>

        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} /> 
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name='PendingApprovalScreen' component={PendingApprovalScreen} />
        <Stack.Screen name='RejectedScreen' component={RejectedScreen} />

        {/* Elderly Flow */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="LocationSelectScreen" component={LocationSelectScreen} />
        <Stack.Screen name='AddServiceScreen' component={AddServiceScreen} />
        <Stack.Screen name="ElderProfile" component={ElderlyProfile} />
        <Stack.Screen name="EditElderlyProfile" component={EditElderlyProfile} />

        {/* Volunteer Flow */}
        {/* We map "VolunteerDashboard" to the Tabs so Login logic works automatically */}
        <Stack.Screen name="VolunteerDashboard" component={VolunteerTabs} />
        <Stack.Screen name="VolunteerProfile" component={VolunteerProfile} />
        <Stack.Screen name="PublicProfileScreen" component={PublicProfileScreen} />
        <Stack.Screen name="EditVolunteerProfile" component={EditVolunteerProfile} />

        {/* Shared */}
        <Stack.Screen name='ServiceDetail' component={ServiceDetailScreen}/>
        <Stack.Screen 
            name="VolunteerEmergencyScreen" 
            component={VolunteerEmergencyScreen} 
            options={{ presentation: 'modal' }} // Makes it slide up like an urgent alert!
        />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="KYCUploadScreen" component={KYCUploadScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: { 
    height: 65, 
    paddingBottom: 10, 
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 }
  },
});