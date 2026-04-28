import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import AppNavigator, { navigationRef, extractFileName } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { useCapsuleStore } from './src/store/capsuleStore';
import { requestNotificationPermission } from './src/services/notifications';

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadPersistedSettings);
  const loadCapsules = useCapsuleStore((s) => s.loadCapsules);
  const [initialArcUri, setInitialArcUri] = useState<string | undefined>(undefined);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      loadSettings();
      loadCapsules();
      requestNotificationPermission().catch(() => {});
      const url = await Linking.getInitialURL();
      if (url) setInitialArcUri(url);
      setInitialized(true);
    }
    init();

    // Appka už běží — uživatel otevřel .arc soubor z file manageru
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MasterPassword', {
          arcUri: url,
          fileName: extractFileName(url),
        });
      }
    });
    return () => sub.remove();
  }, []);

  if (!initialized) return null;
  return <AppNavigator initialArcUri={initialArcUri} />;
}
