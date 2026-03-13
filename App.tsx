import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { useCapsuleStore } from './src/store/capsuleStore';

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadPersistedSettings);
  const loadCapsules = useCapsuleStore((s) => s.loadCapsules);

  useEffect(() => {
    loadSettings();
    loadCapsules();
  }, []);

  return <AppNavigator />;
}
