/**
 * MasterPasswordScreen — zadání Master Password pro dešifrování .arc kontejneru.
 *
 * Přijímá: route.params.arcUri, route.params.fileName
 * Po úspěšném dešifrování přidá kapsle do store a naviguje na CapsuleList.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import { useCapsuleStore } from '../store/capsuleStore';
import { decryptArcFile } from '../services/importer';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList, 'MasterPassword'>;
type RouteParam = RouteProp<RootStackParamList, 'MasterPassword'>;

export default function MasterPasswordScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParam>();
  const { arcUri, fileName } = route.params;

  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const addCapsule = useCapsuleStore((s) => s.addCapsule);

  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accent = dark ? '#a78bfa' : '#7c3aed';

  const handleOpen = async () => {
    if (!password.trim()) {
      setError('Zadejte heslo');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await decryptArcFile(arcUri, password.trim());
      if (!result.success || !result.capsules) {
        if (result.error === 'no_capsules') {
          setError('.arc soubor neobsahuje žádné kapsle');
        } else {
          setError('Nesprávné heslo nebo poškozený soubor');
        }
        return;
      }
      for (const c of result.capsules) {
        addCapsule(c);
      }
      const containerName = fileName.replace(/\.arc$/i, '');
      navigation.replace('CapsuleList', { containerName });
    } catch {
      setError('Neznámá chyba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: accent, fontSize: 15 }}>← Zpět</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
          <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
            Master Password
          </Text>
          <Text style={[styles.fileName, { color: accent }]} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={[styles.hint, { color: dark ? '#666' : '#aaa' }]}>
            Heslo k .arc kontejneru (nastavil odesílatel)
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, {
                color: dark ? '#f0f0f0' : '#1a1a2e',
                borderColor: error ? '#ff4a4a' : (dark ? '#2e2e4a' : '#dde2f0'),
                backgroundColor: dark ? '#16162a' : '#fff',
              }]}
              placeholder="Master heslo"
              placeholderTextColor={dark ? '#555' : '#bbb'}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              onSubmitEditing={handleOpen}
              autoFocus
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(v => !v)}>
              <Text style={{ fontSize: 20 }}>{showPwd ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accent, opacity: loading ? 0.7 : 1 }]}
            onPress={handleOpen}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Otevřít kontejner</Text>
            }
          </TouchableOpacity>

          {loading && (
            <Text style={[styles.loadingHint, { color: dark ? '#555' : '#bbb' }]}>
              Dešifrování kontejneru… (může trvat pár sekund)
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  fileName: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  hint: { fontSize: 12, marginBottom: 28 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    flex: 1, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
  },
  eyeBtn: { padding: 10, marginLeft: 8 },
  error: { color: '#ff4a4a', fontSize: 13, marginBottom: 12 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  loadingHint: { fontSize: 12, textAlign: 'center', marginTop: 12 },
});
