import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';

type Theme = 'light' | 'dark';
type Language = 'cs' | 'en';

const SETTINGS_PATH = (FileSystem.documentDirectory ?? '') + 'lifearcrcv_settings.json';

async function persistSettings(partial: Partial<{ language: Language; theme: Theme }>) {
  try {
    let existing: Record<string, unknown> = {};
    try {
      const json = await FileSystem.readAsStringAsync(SETTINGS_PATH);
      existing = JSON.parse(json);
    } catch {}
    await FileSystem.writeAsStringAsync(SETTINGS_PATH, JSON.stringify({ ...existing, ...partial }));
  } catch {}
}

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  loadPersistedSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'cs',
  theme: 'dark',
  setLanguage: (language) => { set({ language }); persistSettings({ language }); },
  setTheme: (theme) => { set({ theme }); persistSettings({ theme }); },
  loadPersistedSettings: async () => {
    try {
      const json = await FileSystem.readAsStringAsync(SETTINGS_PATH);
      const saved = JSON.parse(json) as Partial<{ language: Language; theme: Theme }>;
      const update: Partial<SettingsState> = {};
      if (saved.language === 'cs' || saved.language === 'en') update.language = saved.language;
      if (saved.theme === 'light' || saved.theme === 'dark') update.theme = saved.theme;
      if (Object.keys(update).length > 0) set(update);
    } catch {}
  },
}));
