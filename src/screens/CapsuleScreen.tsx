import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView, Alert, Image, Modal, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import { useCapsuleStore } from '../store/capsuleStore';
import { useTranslation } from '../i18n';
import { isUnlockTimeReached } from '../services/timecheck';
import { decrypt } from '../services/encryption';
import { notifyCapsuleOpened } from '../services/notifications';
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

function CapsulePhoto({ base64, dark }: { base64: string; dark: boolean }) {
  const { width } = useWindowDimensions();
  const imgWidth = width - 80;
  const [height, setHeight] = useState(imgWidth * 0.75);

  useEffect(() => {
    Image.getSize(
      `data:image/jpeg;base64,${base64}`,
      (w, h) => { if (w > 0) setHeight((imgWidth / w) * h); },
      () => {}
    );
  }, [base64, imgWidth]);

  return (
    <Image
      source={{ uri: `data:image/jpeg;base64,${base64}` }}
      style={{
        width: imgWidth, height, borderRadius: 10,
        marginTop: 10, backgroundColor: dark ? '#1e1a30' : '#f0eeff',
      }}
      resizeMode="contain"
    />
  );
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

  const probablyUnlocked = rc ? new Date() >= new Date(rc.capsule.unlock_date) : false;

  const [password, setPassword]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [decrypting, setDecrypting]     = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [content, setContent]           = useState<CapsuleContent | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const decryptingRef                   = useRef(false);

  const bg      = dark ? '#0d0d14' : '#f2f4f8';
  const surface = dark ? '#16162a' : '#fff';

  const closeModal = () => {
    setShowModal(false);
    setContent(null);
    setPassword('');
  };

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
    if (decryptingRef.current) return;
    if (!password.trim()) { setDecryptError(t('error_empty_password')); return; }
    if (!rc?.capsule.encrypted_content) {
      setDecryptError(t('capsule_no_encrypted'));
      return;
    }

    decryptingRef.current = true;
    setDecrypting(true);
    setDecryptError('');

    // 1. Autoritativní time check (síť)
    let result;
    try {
      result = await isUnlockTimeReached(
        rc.capsule.unlock_date,
        rc.capsule.offline_tolerance ?? null
      );
    } catch {
      setDecrypting(false);
      decryptingRef.current = false;
      Alert.alert(t('error_unknown'), t('capsule_verifying'));
      return;
    }

    if (!result.allowed) {
      setDecrypting(false);
      decryptingRef.current = false;
      const unlockStr = formatDateTime(rc.capsule.unlock_date, locale);
      if (result.blockedReason === 'clock_went_back') {
        Alert.alert('⚠️', t('capsule_clock_back'));
      } else if (result.blockedReason === 'no_verification') {
        Alert.alert('🔒', `${t('capsule_no_verification')}\n\n${t('capsule_opens_at_colon')} ${unlockStr}`);
      } else if (result.blockedReason === 'offline_expired') {
        Alert.alert('🔒', `${t('capsule_offline_expired')}\n\n${t('capsule_opens_at_colon')} ${unlockStr}`);
      } else {
        Alert.alert('🔒', `${t('capsule_not_yet')}\n\n${t('capsule_opens_at_colon')} ${unlockStr}`);
      }
      return;
    }

    // 2. Dešifrování
    try {
      const bytes = base64ToUint8Array(rc.capsule.encrypted_content);
      const plaintext = await decrypt(bytes, password.trim());
      setContent(JSON.parse(plaintext) as CapsuleContent);
      setShowModal(true);
      notifyCapsuleOpened(rc.capsule.title).catch(() => {});
    } catch {
      setDecryptError(t('capsule_wrong_password'));
    } finally {
      setDecrypting(false);
      decryptingRef.current = false;
    }
  };

  // ── Kapsle nenalezena ─────────────────────────────────────────────────────────
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: accent, fontSize: 15 }}>{t('btn_back')}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.pad}>
        {/* Hlavička kapsle */}
        <View style={[styles.card, { backgroundColor: surface, borderLeftColor: probablyUnlocked ? '#4ade80' : accent }]}>
          <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
          <Text style={[styles.capsuleTitle, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
            {capsule.title}
          </Text>
          <Text style={{ color: dark ? '#888' : '#999', fontSize: 11 }}>
            {probablyUnlocked
              ? `🔓 ${t('capsule_time_arrived')}`
              : `🔒 ${formatCountdown(capsule.unlock_date, language)}`
            }
          </Text>
          <Text style={{ color: dark ? '#555' : '#bbb', fontSize: 10, marginTop: 2 }}>
            {t('capsule_opens_at_colon')} {formatDateTime(capsule.unlock_date, locale)}
          </Text>
        </View>

        {/* Heslo + tlačítko */}
        <View style={[styles.card, { backgroundColor: surface, borderLeftColor: accent }]}>
          <Text style={[styles.statusText, { color: dark ? '#888' : '#999', marginBottom: 12 }]}>
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
              editable={!decrypting}
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

        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
          <Text style={{ color: '#ff4a4a', fontSize: 13 }}>{t('capsule_delete_link')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Content modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {
            backgroundColor: surface,
            borderColor: dark ? '#2e2e4a' : '#dde2f0',
          }]}>
            <Text style={[styles.modalTitle, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>
              🔓 {capsule.title}
            </Text>
            <Text style={{ color: '#4ade80', fontSize: 11, marginBottom: 16 }}>
              {t('capsule_unlocked_on')} {formatDateTime(capsule.unlock_date, locale)}
            </Text>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {content?.text ? (
                <Text style={[styles.contentText, { color: dark ? '#d0d0e8' : '#2a2a3a' }]}>
                  {content.text}
                </Text>
              ) : null}

              {content?.photos && content.photos.length > 0 ? (
                <>
                  {content.photos.map((photo, i) => (
                    <CapsulePhoto key={i} base64={photo} dark={dark} />
                  ))}
                </>
              ) : null}

              {content?.audio ? (
                <Text style={[styles.placeholder, { color: dark ? '#888' : '#999' }]}>
                  🎵 {t('capsule_audio_hint')}
                </Text>
              ) : null}

              {!content?.text && !content?.photos?.length && !content?.audio ? (
                <Text style={[styles.placeholder, { color: dark ? '#888' : '#999' }]}>
                  {t('capsule_no_text')}
                </Text>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: accent, marginTop: 20 }]}
              onPress={closeModal}
            >
              <Text style={styles.btnText}>{t('button_close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Busy overlay — POSLEDNÍ potomek, překryje vše */}
      {decrypting && (
        <View style={styles.overlay}>
          <ActivityIndicator color={accent} size="large" />
          <Text style={[styles.overlayText, { color: dark ? '#888' : '#999' }]}>
            {t('capsule_decrypting')}
          </Text>
        </View>
      )}
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
  statusText: { fontSize: 13 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  overlayText: { fontSize: 13, marginTop: 8 },
});
