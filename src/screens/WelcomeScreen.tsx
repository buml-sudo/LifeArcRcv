/**
 * WelcomeScreen — úvodní obrazovka.
 *
 * Pokud existují uložené kapsle → zobrazí tlačítko "Zobrazit kapsle".
 * Vždy zobrazí "Otevřít .arc soubor" → DocumentPicker → MasterPasswordScreen.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import { useCapsuleStore } from '../store/capsuleStore';
import { pickArcFile } from '../services/importer';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavProp>();
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const capsules = useCapsuleStore((s) => s.capsules);
  const [picking, setPicking] = useState(false);

  const accent = dark ? '#a78bfa' : '#7c3aed';
  const iconBg = dark ? '#1e1a30' : '#f0eeff';

  const handleOpenArc = async () => {
    setPicking(true);
    try {
      const file = await pickArcFile();
      if (!file) return;
      navigation.navigate('MasterPassword', {
        arcUri: file.uri,
        fileName: file.fileName,
      });
    } finally {
      setPicking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.center}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
          LifeArc Receiver
        </Text>
        <Text style={[styles.sub, { color: dark ? '#888' : '#999' }]}>
          Přijímač časových kapslí
        </Text>
        <Text style={[styles.desc, { color: dark ? '#666' : '#aaa' }]}>
          Obdrželi jste .arc soubor?{'\n'}Otevřete ho zde.
        </Text>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accent }]}
          onPress={handleOpenArc}
          disabled={picking}
        >
          {picking
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Otevřít .arc soubor</Text>
          }
        </TouchableOpacity>

        {capsules.length > 0 && (
          <TouchableOpacity
            style={[styles.btnGhost, { borderColor: accent }]}
            onPress={() =>
              navigation.navigate('CapsuleList', { containerName: 'Uložené kapsle' })
            }
          >
            <Text style={[styles.btnGhostText, { color: accent }]}>
              Zobrazit uložené kapsle ({capsules.length})
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.settingsLink}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={[styles.settingsText, { color: dark ? '#555' : '#bbb' }]}>Nastavení</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconBox: {
    width: 88, height: 88, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  sub: { fontSize: 13, marginBottom: 16 },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    alignItems: 'center', width: '100%', marginBottom: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnGhost: {
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32,
    alignItems: 'center', width: '100%', borderWidth: 1.5, marginBottom: 8,
  },
  btnGhostText: { fontSize: 14, fontWeight: '500' },
  settingsLink: { marginTop: 24, padding: 8 },
  settingsText: { fontSize: 13 },
});
