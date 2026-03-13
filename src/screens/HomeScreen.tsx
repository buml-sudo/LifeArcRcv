/**
 * HomeScreen — seznam importovaných kapslí + tlačítko importu.
 *
 * TODO (Claude Code):
 *  1. FlatList kapslí z useCapsuleStore
 *  2. Každá kapsle = CapsuleCard (borderLeftWidth 2.5, accent #a78bfa dark / #7c3aed light)
 *     - Ikona 🔐 v ikonBoxu (36x36, bg #1e1a30 dark / #f0eeff light)
 *     - Název, datum odemknutí, progress bar (čas uplynulý / celkový)
 *     - Stav: "Zamčeno" / "Čas OK — zadej heslo"
 *  3. Tap na kapsli → navigace na CapsuleScreen s capsule.id
 *  4. Long press → Alert smazat
 *  5. Tlačítko "+ Importovat kapsli (.arc)" dole (full width, accent bg)
 *     - Otevře DocumentPicker (.arc)
 *     - Načte soubor jako base64, dekóduje jako vault JSON
 *     - Extrahuje všechny TimeCapsule objekty z VaultData.time_capsules
 *     - Uloží do capsuleStore jako ReceivedCapsule[]
 *     - Viz src/services/importer.ts (připravit)
 *  6. Header: LIFEARC RCV / "Časové kapsle" / "{count} kapslí čeká"
 *
 * Design: viz LifeArc_DesignSystem.md — modul Kapsle (fialová accent)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { getColors } from '../theme';

export default function HomeScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const c = getColors(dark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>Časové kapsle</Text>
        <Text style={[styles.sub, { color: dark ? '#888' : '#999' }]}>TODO: implementovat</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
  sub:   { fontSize: 11 },
});
