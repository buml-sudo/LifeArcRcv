import { useSettingsStore } from '../store/settingsStore';
import cs from './cs.json';
import en from './en.json';

type TranslationKeys = keyof typeof cs;

const translations: Record<string, Record<string, string>> = { cs, en };

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const dict = translations[language] ?? translations['cs'];
  const t = (key: TranslationKeys): string => dict[key] ?? key;
  return { t, language };
}
