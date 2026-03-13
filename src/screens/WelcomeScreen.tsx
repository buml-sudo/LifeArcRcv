/**
 * WelcomeScreen — úvodní obrazovka, zobrazí se pokud nemáme žádné uložené kapsle.
 *
 * TODO (Claude Code):
 *  1. Logo / ikona LifeArc Receiver (velká fialová ikona 🔒)
 *  2. Nadpis: "LifeArc Receiver", podtitulek: "Přijímač časových kapslí"
 *  3. Popis: "Obdrželi jste .arc soubor? Otevřete ho zde."
 *  4. Tlačítko "Otevřít .arc soubor" (full width, accent fialová)
 *     → navigace na MasterPasswordScreen s cestou k souboru
 *     → nebo rovnou otevřít DocumentPicker a navigovat s výsledkem
 *  5. Volitelně: malý text "Co je LifeArc?" s odkazem
 *
 * Design: tmavé pozadí #0d0d14, centrovaný layout, accent #a78bfa
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';

export default function WelcomeScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.center}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
          LifeArc Receiver
        </Text>
        <Text style={[styles.sub, { color: dark ? '#888' : '#999' }]}>
          Přijímač časových kapslí
        </Text>
        <Text style={[styles.desc, { color: dark ? '#666' : '#aaa' }]}>
          Obdrželi jste .arc soubor?{'\n'}Otevřete ho zde.
        </Text>
        {/* TODO: onPress → DocumentPicker → navigace na MasterPasswordScreen */}
        <TouchableOpacity style={[styles.btn, { backgroundColor: dark ? '#a78bfa' : '#7c3aed' }]}>
          <Text style={styles.btnText}>Otevřít .arc soubor</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  sub: { fontSize: 13, marginBottom: 24 },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
