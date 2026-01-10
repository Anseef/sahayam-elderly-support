import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import RegisterScreen from './src/screens/RegisterScreen';
import ElderlyDashboard from './src/screens/ElderlyDashboard';
import LocationSelectScreen from './src/screens/LocationSelectScreen';
import EmergencyHelpScreen from './src/screens/EmergencyHelpScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import ElderlyProfile from './src/screens/ElderlyProfile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 5
        },
        tabBarActiveTintColor: route.name === 'Emergency' ? '#D32F2F' : '#007EA7',
        tabBarInactiveTintColor: '#90A4AE',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={ElderlyDashboard} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
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

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="LocationSelectScreen" component={LocationSelectScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name='ServiceDetail' component={ServiceDetailScreen}/>
        <Stack.Screen name="ElderProfile" component={ElderlyProfile} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});