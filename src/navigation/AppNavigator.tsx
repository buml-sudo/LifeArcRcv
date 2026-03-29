/**
 * AppNavigator — Stack navigator pro LifeArcRcv
 *
 * Flow: Welcome → MasterPassword → CapsuleList → Capsule → Settings
 */

import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function extractFileName(uri: string): string {
  const decoded = decodeURIComponent(uri);
  const last = decoded.split('/').pop() ?? 'soubor.arc';
  return last.endsWith('.arc') ? last : 'soubor.arc';
}

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator({ initialArcUri }: { initialArcUri?: string }) {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';

  const initialState = initialArcUri
    ? { index: 0, routes: [{ name: 'MasterPassword' as const, params: { arcUri: initialArcUri, fileName: extractFileName(initialArcUri) } }] }
    : undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <NavigationContainer ref={navigationRef} initialState={initialState}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
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
