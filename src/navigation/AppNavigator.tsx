/**
 * AppNavigator — Stack navigator pro LifeArcRcv
 *
 * Flow: Welcome → MasterPassword → CapsuleList → Capsule → Settings
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../store/settingsStore';
import WelcomeScreen from '../screens/WelcomeScreen';
import MasterPasswordScreen from '../screens/MasterPasswordScreen';
import CapsuleListScreen from '../screens/CapsuleListScreen';
import CapsuleScreen from '../screens/CapsuleScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  MasterPassword: { arcUri: string; fileName: string };
  CapsuleList: { containerName: string };
  Capsule: { capsuleId: string };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome"        component={WelcomeScreen} />
            <Stack.Screen name="MasterPassword" component={MasterPasswordScreen} />
            <Stack.Screen name="CapsuleList"    component={CapsuleListScreen} />
            <Stack.Screen name="Capsule"        component={CapsuleScreen} />
            <Stack.Screen name="Settings"       component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
