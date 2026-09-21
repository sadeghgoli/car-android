import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { SelectPhoneScreen } from '../screens/Auth/SelectPhoneScreen';
import { VerifyOtpScreen } from '../screens/Auth/VerifyOtpScreen';
import { SelectVehicleScreen } from '../screens/Auth/SelectVehicleScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { OpenRequestsScreen } from '../screens/Requests/OpenRequestsScreen';
import { RequestDetailScreen } from '../screens/Requests/RequestDetailScreen';
import { DocumentsScreen } from '../screens/Documents/DocumentsScreen';
import { CompleteRequestScreen } from '../screens/Documents/CompleteRequestScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SelectPhone" component={SelectPhoneScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="SelectVehicle" component={SelectVehicleScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="OpenRequests" component={OpenRequestsScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen name="Documents" component={DocumentsScreen} />
        <Stack.Screen name="CompleteRequest" component={CompleteRequestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
