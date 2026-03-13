/**
 * capsuleStore — Zustand store pro importované kapsle v LifeArcRcv.
 *
 * Kapsle se ukládají jako JSON do expo-file-system (plaintext —
 * encrypted_content zůstává šifrovaný, heslo se NIKDY neukládá).
 */
import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';
import { ReceivedCapsule } from '../types';

const STORE_PATH = (FileSystem.documentDirectory ?? '') + 'rcv_capsules.json';

async function persist(capsules: ReceivedCapsule[]) {
  try {
    await FileSystem.writeAsStringAsync(STORE_PATH, JSON.stringify(capsules));
  } catch {}
}

interface CapsuleStoreState {
  capsules: ReceivedCapsule[];
  loaded: boolean;
  loadCapsules: () => Promise<void>;
  addCapsule: (capsule: ReceivedCapsule) => void;
  removeCapsule: (id: string) => void;
}

export const useCapsuleStore = create<CapsuleStoreState>((set, get) => ({
  capsules: [],
  loaded: false,

  loadCapsules: async () => {
    try {
      const json = await FileSystem.readAsStringAsync(STORE_PATH);
      const data = JSON.parse(json) as ReceivedCapsule[];
      set({ capsules: data, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addCapsule: (capsule) => {
    const next = [...get().capsules, capsule];
    set({ capsules: next });
    persist(next);
  },

  removeCapsule: (id) => {
    const next = get().capsules.filter((c) => c.id !== id);
    set({ capsules: next });
    persist(next);
  },
}));
