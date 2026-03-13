/**
 * CapsuleScreen — detail kapsle: odpočítávání, zadání Capsule Password, zobrazení obsahu.
 *
 * Přijímá: route.params.capsuleId (string)
 *
 * TODO (Claude Code):
 *  1. Načíst kapsli z capsuleStore podle capsuleId
 *  2. Online time check: isUnlockTimeReached(capsule.unlock_date, capsule.offline_tolerance)
 *     Zobrazit stavy:
 *       - Načítání: spinner + "Ověřuji čas…"
 *       - Zamčeno (not_yet): countdown, datum odemčení, progress bar
 *       - Zamčeno (offline_expired): "Offline příliš dlouho — potřebuji internet"
 *       - Zamčeno (no_verification): "Nikdy neproběhlo online ověření"
 *       - Zamčeno (clock_went_back): "Hodiny šly pozpátku — podezřelé!"
 *       - Odemčeno: input pro Capsule Password + tlačítko "Otevřít kapsuli"
 *
 *  3. Zadání Capsule Password + dešifrování:
 *     a) ActivityIndicator overlay "Dešifrování…" (busyOverlay stejný styl jako TimeCapsule v LifeArc)
 *     b) base64ToUint8Array(capsule.encrypted_content)
 *     c) decrypt(bytes, capsulePassword) → plaintext JSON
 *     d) JSON.parse(plaintext) → { title, content, type, ... }
 *     e) Zobrazit obsah
 *     f) Při chybě (wrong password): "Nesprávné heslo"
 *
 *  4. Obsah kapsle:
 *     - Text: Text komponenta s celým textem
 *     - Foto: ScrollView s Image (nebo placeholder "foto v plné verzi LifeArc")
 *     - Audio: TODO placeholder
 *
 *  5. Tlačítko Zpět v headeru
 *  6. Long press na kapsli v zamčeném stavu → možnost smazat
 *
 * POZNÁMKA: Capsule Password je JINÉ heslo než Master Password.
 * Master Password = heslo k .arc kontejneru (celý vault)
 * Capsule Password = heslo k obsahu jednotlivé kapsle (nastavil odesílatel v LifeArc)
 *
 * Šifrování kapsle: identické s .arc — AES-256-GCM, PBKDF2 100k, viz encryption.ts
 * encrypted_content je base64 string uložený v TimeCapsule.encrypted_content
 *
 * Helper:
 *   function base64ToUint8Array(b64: string): Uint8Array {
 *     const bin = atob(b64);
 *     const bytes = new Uint8Array(bin.length);
 *     for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
 *     return bytes;
 *   }
 *
 * Design: LifeArc_DesignSystem.md — modul Kapsle (#a78bfa dark / #7c3aed light)
 * Inspirace: LifeArc/src/screens/TimeCapsuleScreen.tsx (decrypt flow, busyOverlay)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';

export default function CapsuleScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>Detail kapsle</Text>
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
  sub: { fontSize: 11 },
});
