import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import { useCapsuleStore } from '../store/capsuleStore';
import { useTranslation } from '../i18n';
import { isUnlockTimeReached, TimeCheckResult } from '../services/timecheck';
import { decrypt } from '../services/encryption';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList, 'Capsule'>;
type RouteParam = RouteProp<RootStackParamList, 'Capsule'>;

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function formatDateTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function formatCountdown(unlockDateIso: string, language: string): string {
  const diffMs = new Date(unlockDateIso).getTime() - Date.now();
  if (diffMs <= 0) return '';
  const days  = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const mins  = Math.floor((diffMs % 3600000) / 60000);
  if (language === 'en') {
    if (days > 0)  return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
  if (days > 0)  return `Za ${days} dní ${hours} hodin`;
  if (hours > 0) return `Za ${hours} h ${mins} min`;
  return `Za ${mins} minut`;
}

interface CapsuleContent {
  text?: string;
  photos?: string[];
  audio?: string;
  [key: string]: unknown;
}

export default function CapsuleScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParam>();
  const { capsuleId } = route.params;

  const { theme } = useSettingsStore();
  const { t, language } = useTranslation();
  const dark = theme === 'dark';
  const { capsules, removeCapsule } = useCapsuleStore();

  const rc     = capsules.find((c) => c.id === capsuleId);
  const accent = dark ? '#a78bfa' : '#7c3aed';
  const locale = language === 'cs' ? 'cs-CZ' : 'en-GB';

  const [timeCheck, setTimeCheck]       = useState<TimeCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(true);
  const [password, setPassword]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [decrypting, setDecrypting]     = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [content, setContent]           = useState<CapsuleContent | null>(null);

  useEffect(() => {
    if (!rc) return;
    setCheckLoading(true);
    isUnlockTimeReached(rc.capsule.unlock_date, rc.capsule.offline_tolerance)
      .then((result) => setTimeCheck(result))
      .finally(() => setCheckLoading(false));
  }, [rc?.capsule.unlock_date]);

  const handleDelete = () => {
    if (!rc) return;
    Alert.alert(
      t('capsule_delete_title'),
      `„${rc.capsule.title}" ${t('capsule_delete_body')}`,
      [
        { text: t('button_cancel'), style: 'cancel' },
        {
          text: t('button_delete'), style: 'destructive', onPress: () => {
            removeCapsule(rc.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDecrypt = async () => {
    if (!rc) return;
    if (!password.trim()) { setDecryptError(t('error_empty_password')); return; }
    if (!rc.capsule.encrypted_content) {
      setDecryptError(t('capsule_no_encrypted'));
      return;
    }
    setDecrypting(true);
    setDecryptError('');
    try {
      const bytes = base64ToUint8Array(rc.capsule.encrypted_content);
      const plaintext = await decrypt(bytes, password.trim());
      setContent(JSON.parse(plaintext) as CapsuleContent);
    } catch {
      setDecryptError(t('capsule_wrong_password'));
    } finally {
      setDecrypting(false);
    }
  };

  const bg      = dark ? '#0d0d14' : '#f2f4f8';
  const surface = dark ? '#16162a' : '#fff';

  // ── Kapsle nenalezena ────────────────────────────────────────────────────────
  if (!rc) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: accent, fontSize: 15 }}>{t('btn_back')}</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: dark ? '#888' : '#999', fontSize: 14 }}>
            {t('capsule_not_found')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const capsule = rc.capsule;

  // ── Obsah dešifrován ─────────────────────────────────────────────────────────
  if (content) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: accent, fontSize: 15 }}>{t('btn_back')}</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.card, { backgroundColor: surface, borderLeftColor: '#4ade80' }]}>
            <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>
              {t('capsule_content_label')}
            </Text>
            <Text style={[styles.capsuleTitle, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
              {capsule.title}
            </Text>
            <Text style={{ color: '#4ade80', fontSize: 11, marginBottom: 16 }}>
              {t('capsule_unlocked_on')} {formatDateTime(capsule.unlock_date, locale)}
            </Text>

            {content.text ? (
              <Text style={[styles.contentText, { color: dark ? '#d0d0e8' : '#2a2a3a' }]}>
                {content.text}
              </Text>
            ) : null}

            {content.photos && content.photos.length > 0 ? (
              <Text style={[styles.placeholder, { color: dark ? '#888' : '#999' }]}>
                📷 {content.photos.length} {t('capsule_photo_hint')}
              </Text>
            ) : null}

            {content.audio ? (
              <Text style={[styles.placeholder, { color: dark ? '#888' : '#999' }]}>
                🎵 {t('capsule_audio_hint')}
              </Text>
            ) : null}

            {!content.text && !content.photos?.length && !content.audio ? (
              <Text style={[styles.placeholder, { color: dark ? '#888' : '#999' }]}>
                {t('capsule_no_text')}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
            <Text style={{ color: '#ff4a4a', fontSize: 13 }}>{t('capsule_delete_link')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Hlavní view (time check + heslo) ─────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: accent, fontSize: 15 }}>{t('btn_back')}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.pad}>
        {/* Hlavička kapsle */}
        <View style={[styles.card, { backgroundColor: surface, borderLeftColor: accent }]}>
          <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
          <Text style={[styles.capsuleTitle, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
            {capsule.title}
          </Text>
          <Text style={{ color: dark ? '#888' : '#999', fontSize: 11 }}>
            {t('capsule_opens_at_colon')} {formatDateTime(capsule.unlock_date, locale)}
          </Text>
        </View>

        {/* Time check */}
        {checkLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={accent} />
            <Text style={[styles.statusText, { color: dark ? '#888' : '#999' }]}>
              {t('capsule_verifying')}
            </Text>
          </View>

        ) : timeCheck?.allowed ? (
          // ── Odemčeno ──────────────────────────────────────────────────────────
          <View style={[styles.card, { backgroundColor: surface }]}>
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🔓</Text>
            <Text style={[styles.unlockTitle, { color: '#4ade80' }]}>
              {t('capsule_time_arrived')}
            </Text>
            <Text style={[styles.statusText, { color: dark ? '#888' : '#999', textAlign: 'center', marginBottom: 20 }]}>
              {t('capsule_enter_pwd')}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {
                  color: dark ? '#f0f0f0' : '#1a1a2e',
                  borderColor: decryptError ? '#ff4a4a' : (dark ? '#2e2e4a' : '#dde2f0'),
                  backgroundColor: dark ? '#0d0d14' : '#f2f4f8',
                }]}
                placeholder={t('capsule_pwd_placeholder')}
                placeholderTextColor={dark ? '#555' : '#bbb'}
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={(v) => { setPassword(v); setDecryptError(''); }}
                onSubmitEditing={handleDecrypt}
                returnKeyType="go"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                <Text style={{ fontSize: 20 }}>{showPwd ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {decryptError ? (
              <Text style={styles.errorText}>{decryptError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: accent, opacity: decrypting ? 0.7 : 1 }]}
              onPress={handleDecrypt}
              disabled={decrypting}
            >
              {decrypting ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.btnText, { marginLeft: 8 }]}>
                    {t('capsule_decrypting')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.btnText}>{t('capsule_open_btn')}</Text>
              )}
            </TouchableOpacity>
          </View>

        ) : (
          // ── Zamčeno ────────────────────────────────────────────────────────────
          <View style={[styles.card, { backgroundColor: surface, alignItems: 'center' }]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>

            {timeCheck?.blockedReason === 'not_yet' && (
              <>
                <Text style={[styles.lockedLabel, { color: dark ? '#c0b0f0' : '#7c3aed' }]}>
                  {t('capsule_not_yet')}
                </Text>
                <Text style={[styles.lockedCountdown, { color: dark ? '#888' : '#999' }]}>
                  {formatCountdown(capsule.unlock_date, language)}
                </Text>
                <Text style={[styles.lockedDate, { color: dark ? '#555' : '#bbb' }]}>
                  {t('capsule_opens_at_colon')} {formatDateTime(capsule.unlock_date, locale)}
                </Text>
              </>
            )}

            {timeCheck?.blockedReason === 'offline_expired' && (
              <Text style={[styles.lockedLabel, { color: dark ? '#fbbf24' : '#d97706' }]}>
                {t('capsule_offline_expired')}
              </Text>
            )}

            {timeCheck?.blockedReason === 'no_verification' && (
              <Text style={[styles.lockedLabel, { color: dark ? '#fbbf24' : '#d97706' }]}>
                {t('capsule_no_verification')}
              </Text>
            )}

            {timeCheck?.blockedReason === 'clock_went_back' && (
              <Text style={[styles.lockedLabel, { color: '#ff4a4a' }]}>
                {t('capsule_clock_back')}
              </Text>
            )}

            {timeCheck?.offlineFallback && (
              <Text style={[styles.offlineBadge, { color: dark ? '#888' : '#999' }]}>
                {t('capsule_offline_drift').replace(
                  '{h}',
                  (timeCheck.offlineDriftHours ?? 0).toFixed(1)
                )}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
          <Text style={{ color: '#ff4a4a', fontSize: 13 }}>{t('capsule_delete_link')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  pad: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 16, borderLeftWidth: 2.5,
    shadowColor: '#0d0d14', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  capsuleTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  statusText: { fontSize: 13, marginTop: 8 },
  unlockTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  lockedLabel: { fontSize: 15, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  lockedCountdown: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  lockedDate: { fontSize: 12, textAlign: 'center' },
  offlineBadge: { fontSize: 11, marginTop: 12, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: {
    flex: 1, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
  },
  eyeBtn: { padding: 10, marginLeft: 8 },
  errorText: { color: '#ff4a4a', fontSize: 13, marginBottom: 10 },
  btn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  contentText: { fontSize: 15, lineHeight: 24, marginTop: 4 },
  placeholder: { fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  deleteLink: { alignItems: 'center', padding: 16, marginTop: 8 },
});
