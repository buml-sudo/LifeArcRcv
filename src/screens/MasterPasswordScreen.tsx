/**
 * MasterPasswordScreen — zadání Master Password pro dešifrování .arc kontejneru.
 *
 * Přijímá: route.params.arcUri (string) — cesta k .arc souboru
 *
 * TODO (Claude Code):
 *  1. Zobrazit název souboru (z arcUri)
 *  2. TextInput pro Master Password (secureTextEntry, s show/hide)
 *  3. Tlačítko "Otevřít kontejner" → spustit dešifrování
 *     a) FileSystem.readAsStringAsync(arcUri, { encoding: 'base64' })
 *     b) base64ToUint8Array(base64data)
 *     c) decrypt(bytes, masterPassword) → VaultData JSON
 *     d) JSON.parse(plaintext) → VaultData
 *     e) Extrahovat time_capsules z VaultData
 *     f) Uložit do capsuleStore jako ReceivedCapsule[]
 *        (každá TimeCapsule dostane wrapper s id, importedAt)
 *     g) navigace.replace('CapsuleList', { containerName: fileName })
 *  4. Při chybě: "Nesprávné heslo nebo poškozený soubor"
 *  5. ActivityIndicator + overlay "Dešifrování kontejneru…" při načítání
 *  6. Tlačítko Zpět
 *
 * POZNÁMKA: Master Password = heslo k .arc EXPORTU (z LifeArc).
 * Toto je JINÉ heslo než Capsule Password (heslo k obsahu jednotlivé kapsle).
 *
 * Šifrování .arc souboru:
 *   Formát: [16B salt][12B nonce][ciphertext + 16B GCM tag] → base64
 *   Viz: src/services/encryption.ts → decrypt()
 *
 * Struktura VaultData (po dešifrování):
 * {
 *   meta: { name, created, version },
 *   time_capsules: TimeCapsule[],   ← hlavní payload
 *   calendar_events: [...],         ← ignorovat
 *   notes: [...],                   ← ignorovat
 *   todos: [...],                   ← ignorovat
 * }
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';

export default function MasterPasswordScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
        <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>Master Password</Text>
        <Text style={[styles.sub, { color: dark ? '#888' : '#999' }]}>TODO: zobrazit název souboru</Text>

        {/* TODO: implementovat plnou logiku */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: dark ? '#f0f0f0' : '#1a1a2e', borderColor: dark ? '#2e2e4a' : '#dde2f0', backgroundColor: dark ? '#16162a' : '#fff' }]}
            placeholder="Master heslo"
            placeholderTextColor={dark ? '#555' : '#bbb'}
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(v => !v)}>
            <Text style={{ fontSize: 20 }}>{showPwd ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, { backgroundColor: dark ? '#a78bfa' : '#7c3aed' }]}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Otevřít kontejner</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  sub: { fontSize: 12, marginBottom: 32 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    padding: 12, fontSize: 15,
  },
  eyeBtn: { padding: 10, marginLeft: 8 },
  error: { color: '#ff4a4a', fontSize: 13, marginBottom: 12 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
