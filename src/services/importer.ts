/**
 * importer.ts — import .arc souboru do LifeArcRcv
 *
 * Tok:
 *  1. Uživatel vybere .arc soubor přes DocumentPicker
 *  2. Soubor se načte jako base64 → Uint8Array
 *  3. Dešifruje se pomocí uživatelského hesla (decrypt z encryption.ts)
 *  4. Výsledný JSON se parsuje jako VaultData
 *  5. Extrahují se time_capsules → ReceivedCapsule[]
 *  6. Uloží se do capsuleStore
 *
 * DŮLEŽITÉ: Heslo k .arc souboru je EXPORT heslo (z LifeArc exportu),
 * nikoli master heslo ke kapslím. Jsou to dvě různá hesla.
 *
 * Struktura VaultData (z LifeArc):
 * {
 *   meta: { name, created, version },
 *   calendar_events: [...],
 *   time_capsules: TimeCapsule[],   ← TOTO chceme
 *   recurring_cycles: [...],
 *   notes: [...],
 *   todos: [...]
 * }
 *
 * TODO (Claude Code): implementovat funkci importArcFile() níže
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';  // TODO: přidat uuid do package.json pokud chybí
import { decrypt } from './encryption';
import { TimeCapsule, ReceivedCapsule } from '../types';

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface ImportResult {
  success: boolean;
  capsules?: ReceivedCapsule[];
  error?: string;
}

export async function pickAndImportArc(exportPassword: string): Promise<ImportResult> {
  // TODO: implementovat
  // 1. DocumentPicker.getDocumentAsync({ type: '*/*' })
  // 2. FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' })
  // 3. base64ToUint8Array → decrypt(bytes, exportPassword)
  // 4. JSON.parse → VaultData
  // 5. map time_capsules → ReceivedCapsule[]
  // 6. return { success: true, capsules }
  return { success: false, error: 'Not implemented yet' };
}
