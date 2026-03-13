/**
 * importer.ts — import .arc souboru do LifeArcRcv
 *
 * Tok:
 *  1. pickArcFile() — uživatel vybere .arc soubor přes DocumentPicker
 *  2. decryptArcFile(uri, password) — přečte, dešifruje, extrahuje kapsle
 *  3. pickAndImportArc(password) — kombinace obou výše (pomocná)
 *
 * DŮLEŽITÉ: Heslo k .arc souboru je EXPORT heslo (z LifeArc exportu),
 * nikoli heslo ke kapslím. Jsou to dvě různá hesla.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
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
  error?: 'cancelled' | 'wrong_password' | 'no_capsules' | 'invalid';
}

export async function pickArcFile(): Promise<{ uri: string; fileName: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, fileName: asset.name ?? 'soubor.arc' };
}

export async function decryptArcFile(
  uri: string,
  exportPassword: string
): Promise<ImportResult> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    const bytes = base64ToUint8Array(base64);

    let plaintext: string;
    try {
      plaintext = await decrypt(bytes, exportPassword);
    } catch {
      return { success: false, error: 'wrong_password' };
    }

    let vault: any;
    try {
      vault = JSON.parse(plaintext);
    } catch {
      return { success: false, error: 'invalid' };
    }

    const rawCapsules: TimeCapsule[] = Array.isArray(vault.time_capsules)
      ? vault.time_capsules
      : [];

    if (rawCapsules.length === 0) {
      return { success: false, error: 'no_capsules' };
    }

    const now = new Date().toISOString();
    const capsules: ReceivedCapsule[] = rawCapsules.map((c) => ({
      id: Crypto.randomUUID(),
      importedAt: now,
      arcSourcePath: uri,
      capsule: c,
    }));

    return { success: true, capsules };
  } catch {
    return { success: false, error: 'invalid' };
  }
}

export async function pickAndImportArc(exportPassword: string): Promise<ImportResult> {
  const file = await pickArcFile();
  if (!file) return { success: false, error: 'cancelled' };
  return decryptArcFile(file.uri, exportPassword);
}
