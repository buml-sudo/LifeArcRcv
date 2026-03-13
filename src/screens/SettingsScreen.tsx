import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const { t } = useTranslation();
  const dark = theme === 'dark';

  const bg        = dark ? '#0d0d14' : '#f2f4f8';
  const surface   = dark ? '#16162a' : '#fff';
  const text      = dark ? '#f0f0f0' : '#1a1a2e';
  const textSub   = dark ? '#888' : '#999';
  const border    = dark ? '#2e2e4a' : '#dde2f0';
  const accent    = dark ? '#a78bfa' : '#7c3aed';
  const activeBg  = dark ? '#2e2840' : '#ede9ff';

  const SegmentBtn = ({
    label, active, onPress,
  }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.segBtn, { borderColor: border, backgroundColor: active ? activeBg : surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.segBtnText, { color: active ? accent : textSub }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: accent, fontSize: 15 }}>{t('btn_back')}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.pad}>
        {/* Nadpis */}
        <Text style={[styles.label, { color: textSub }]}>LIFEARC RCV</Text>
        <Text style={[styles.title, { color: text }]}>{t('settings_title')}</Text>

        {/* ── Motiv ─────────────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.sectionLabel, { color: textSub }]}>{t('settings_theme')}</Text>
          <View style={styles.segRow}>
            <SegmentBtn
              label={`🌙  ${t('settings_theme_dark')}`}
              active={theme === 'dark'}
              onPress={() => setTheme('dark')}
            />
            <View style={{ width: 8 }} />
            <SegmentBtn
              label={`☀️  ${t('settings_theme_light')}`}
              active={theme === 'light'}
              onPress={() => setTheme('light')}
            />
          </View>
        </View>

        {/* ── Jazyk ─────────────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.sectionLabel, { color: textSub }]}>{t('settings_language')}</Text>
          <View style={styles.segRow}>
            <SegmentBtn
              label={`🇨🇿  ${t('settings_language_cs')}`}
              active={language === 'cs'}
              onPress={() => setLanguage('cs')}
            />
            <View style={{ width: 8 }} />
            <SegmentBtn
              label={`🇬🇧  ${t('settings_language_en')}`}
              active={language === 'en'}
              onPress={() => setLanguage('en')}
            />
          </View>
        </View>

        {/* ── O aplikaci ────────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.sectionLabel, { color: textSub }]}>{t('settings_about')}</Text>
          <Text style={[styles.aboutName, { color: text }]}>{t('app_name')}</Text>
          <Text style={[styles.aboutDesc, { color: textSub }]}>{t('settings_about_desc')}</Text>
          <View style={[styles.versionRow, { borderTopColor: border }]}>
            <Text style={[styles.versionLabel, { color: textSub }]}>{t('settings_version')}</Text>
            <Text style={[styles.versionValue, { color: textSub }]}>{APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  pad: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#0d0d14', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionLabel: {
    fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  segRow: { flexDirection: 'row' },
  segBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', borderWidth: 1.5,
  },
  segBtnText: { fontSize: 13, fontWeight: '600' },
  aboutName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  aboutDesc: { fontSize: 13, lineHeight: 20 },
  versionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1,
  },
  versionLabel: { fontSize: 12 },
  versionValue: { fontSize: 12 },
});
