/**
 * CapsuleListScreen — seznam importovaných kapslí.
 *
 * Každá karta: ikona 🔒/🔓, název, stav, datum, progress bar, countdown.
 * Tap odemčená → CapsuleScreen. Tap zamčená → Alert s datem.
 * Long press → smazat. Footer → import dalšího .arc.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import { useCapsuleStore } from '../store/capsuleStore';
import { ReceivedCapsule } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList, 'CapsuleList'>;
type RouteParam = RouteProp<RootStackParamList, 'CapsuleList'>;

function formatCountdown(unlockDateIso: string): { text: string; unlocked: boolean } {
  const diffMs = new Date(unlockDateIso).getTime() - Date.now();
  if (diffMs <= 0) return { text: 'Odemčeno', unlocked: true };
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (days > 0) return { text: `Za ${days} d ${hours} h`, unlocked: false };
  if (hours > 0) return { text: `Za ${hours} h ${mins} min`, unlocked: false };
  return { text: `Za ${mins} min`, unlocked: false };
}

function getProgress(rc: ReceivedCapsule): number {
  const start = new Date(rc.capsule.created_at ?? rc.importedAt).getTime();
  const end = new Date(rc.capsule.unlock_date).getTime();
  const now = Date.now();
  if (end <= start) return 1;
  return Math.min(Math.max((now - start) / (end - start), 0), 1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function CapsuleListScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParam>();
  const containerName = route.params?.containerName ?? 'Kapsle';

  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const { capsules, removeCapsule } = useCapsuleStore();

  const accent = dark ? '#a78bfa' : '#7c3aed';
  const iconBg = dark ? '#1e1a30' : '#f0eeff';

  // Tick každou minutu pro refresh countdown
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const handleTap = (rc: ReceivedCapsule) => {
    const { unlocked } = formatCountdown(rc.capsule.unlock_date);
    if (unlocked) {
      navigation.navigate('Capsule', { capsuleId: rc.id });
    } else {
      Alert.alert('Zamčeno', `Tato kapsle se odemkne\n${formatDate(rc.capsule.unlock_date)}.`);
    }
  };

  const handleLongPress = (rc: ReceivedCapsule) => {
    Alert.alert(
      'Smazat kapsli?',
      `„${rc.capsule.title}" bude trvale odstraněna.`,
      [
        { text: 'Zrušit', style: 'cancel' },
        { text: 'Smazat', style: 'destructive', onPress: () => removeCapsule(rc.id) },
      ]
    );
  };

  const renderItem: ListRenderItem<ReceivedCapsule> = ({ item }) => {
    const { text: countdownText, unlocked } = formatCountdown(item.capsule.unlock_date);
    const progress = getProgress(item);
    const statusColor = unlocked ? '#4ade80' : accent;

    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: dark ? '#16162a' : '#fff',
          borderLeftColor: statusColor,
        }]}
        onPress={() => handleTap(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Text style={styles.iconText}>{unlocked ? '🔓' : '🔒'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text
              style={[styles.cardTitle, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}
              numberOfLines={1}
            >
              {item.capsule.title}
            </Text>
            <Text style={[styles.cardStatus, { color: statusColor }]}>
              {unlocked ? 'Odemčeno — zadej heslo' : 'Zamčeno'}
            </Text>
            <Text style={[styles.cardMeta, { color: dark ? '#555' : '#bbb' }]}>
              Otevře se: {formatDate(item.capsule.unlock_date)}
            </Text>
          </View>
          <Text style={[styles.countdown, { color: unlocked ? '#4ade80' : (dark ? '#888' : '#999') }]}>
            {countdownText}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: dark ? '#2e2e4a' : '#e8e8f0' }]}>
          <View
            style={[styles.progressFill, {
              backgroundColor: statusColor,
              width: `${Math.round(progress * 100)}%` as any,
            }]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const count = capsules.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#0d0d14' : '#f2f4f8' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.label, { color: dark ? '#888' : '#999' }]}>LIFEARC RCV</Text>
          <Text style={[styles.title, { color: dark ? '#f0f0f0' : '#1a1a2e' }]}>{containerName}</Text>
          <Text style={[styles.sub, { color: dark ? '#888' : '#999' }]}>
            {count} {count === 1 ? 'kapsle' : 'kapslí'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={capsules}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={tick}
        contentContainerStyle={count === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: dark ? '#555' : '#bbb' }]}>
            Tento kontejner neobsahuje žádné kapsle.
          </Text>
        }
        ListFooterComponent={
          count > 0 ? (
            <TouchableOpacity
              style={[styles.importMore, { borderColor: dark ? '#2e2e4a' : '#dde2f0' }]}
              onPress={() => navigation.navigate('Welcome')}
            >
              <Text style={[styles.importMoreText, { color: accent }]}>
                + Importovat další .arc
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: accent, margin: 16 }]}
              onPress={() => navigation.navigate('Welcome')}
            >
              <Text style={styles.btnText}>Importovat .arc soubor</Text>
            </TouchableOpacity>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  label: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
  sub: { fontSize: 11 },
  listContent: { paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  card: {
    marginHorizontal: 16, marginVertical: 6,
    borderRadius: 14, padding: 14, borderLeftWidth: 2.5,
    shadowColor: '#0d0d14', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  iconText: { fontSize: 18 },
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  cardStatus: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardMeta: { fontSize: 9 },
  countdown: { fontSize: 11, fontWeight: '500', textAlign: 'right', maxWidth: 80 },
  progressTrack: { height: 3, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  importMore: {
    margin: 16, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, alignItems: 'center',
  },
  importMoreText: { fontSize: 14, fontWeight: '500' },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
