/**
 * CapsuleListScreen — seznam kapslí z otevřeného kontejneru.
 *
 * Přijímá: route.params.containerName (string) — název .arc souboru
 *
 * TODO (Claude Code):
 *  1. FlatList kapslí z useCapsuleStore()
 *  2. Každá karta (CapsuleCard) — borderLeftWidth 2.5, accent #a78bfa dark / #7c3aed light:
 *     - Ikona 🔒/🔓 v iconBoxu (36x36, bg #1e1a30 dark / #f0eeff light)
 *     - Název kapsle (cardTitle, 13px, weight 500)
 *     - Stav (9px, accent): "Zamčeno" / "Odemčeno — zadej heslo"
 *     - Datum odemčení (card_meta, 9px, text_disabled)
 *     - Progress bar 3px: uplynulý čas od vytvoření do unlock_date
 *     - Countdown: "Za X dní Y hodin" / "Čas nastane dnes!" / "Odemčeno"
 *  3. Tap na odemčenou kapsuli → navigace na CapsuleScreen (detail + heslo)
 *  4. Tap na zamčenou kapsuli → Alert s datem odemčení
 *  5. Long press → Alert smazat kapsli
 *  6. Header: "LIFEARC RCV" / containerName / "{count} kapslí"
 *  7. Prázdný stav: "Tento kontejner neobsahuje žádné kapsle."
 *  8. Tlačítko "+" nebo odkaz → importovat další .arc soubor (WelcomeScreen)
 *
 *  Countdown logika:
 *    const now = new Date()
 *    const unlock = new Date(capsule.unlock_date)
 *    const diffMs = unlock.getTime() - now.getTime()
 *    const days = Math.floor(diffMs / 86400000)
 *    const hours = Math.floor((diffMs % 86400000) / 3600000)
 *    isUnlocked = diffMs <= 0
 *
 *  Aktualizuj countdown každou minutu (setInterval v useEffect).
 *
 * Design: LifeArc_DesignSystem.md — modul Kapsle (fialová)
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { useCapsuleStore } from '../store/capsuleStore';

export default function CapsuleListScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const capsules = useCapsuleStore((s) => s.capsules);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>Časové kapsle</Text>
        <Text style={[styles.sub, { color: dark ? '#888' : '#999' }]}>
          {capsules.length} {capsules.length === 1 ? 'kapsle' : 'kapslí'}
        </Text>
      </View>
      {/* TODO: FlatList s CapsuleCard komponentami */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
  sub: { fontSize: 11 },
});
