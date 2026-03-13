/**
 * SettingsScreen — minimální nastavení (jazyk, motiv).
 *
 * TODO (Claude Code):
 *  1. Přepínač Light / Dark theme (useSettingsStore.setTheme)
 *  2. Přepínač jazyka CS / EN (useSettingsStore.setLanguage)
 *  3. Sekce "O aplikaci": verze, popis "LifeArc Receiver — pouze pro otevírání kapslí"
 *
 * Design: viz LifeArc_DesignSystem.md — Nastavení (accent #888 dark / #999 light)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';

export default function SettingsScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>Nastavení</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
});
