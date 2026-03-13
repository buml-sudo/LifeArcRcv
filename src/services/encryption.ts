/**
 * AES-256-GCM encryption with PBKDF2-SHA256 key derivation.
 *
 * File format:
 *   [16 bytes salt][12 bytes nonce][N bytes ciphertext + 16 bytes GCM auth tag]
 *
 * Uses @noble/ciphers + @noble/hashes — pure JS, no Web Crypto API required.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { getRandomBytes as expoRandomBytes } from 'expo-crypto';

const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const PBKDF2_ITERATIONS = 100_000;
const KEY_BYTES = 32;

function getRandomBytes(size: number): Uint8Array {
  return expoRandomBytes(size);
}

function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  return pbkdf2(sha256, enc.encode(password), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_BYTES,
  });
}

export async function encrypt(data: string, password: string): Promise<Uint8Array> {
  const salt = getRandomBytes(SALT_BYTES);
  const nonce = getRandomBytes(NONCE_BYTES);
  const key = deriveKey(password, salt);

  const enc = new TextEncoder();
  const cipher = gcm(key, nonce);
  const ciphertextWithTag = cipher.encrypt(enc.encode(data));

  const result = new Uint8Array(SALT_BYTES + NONCE_BYTES + ciphertextWithTag.byteLength);
  result.set(salt, 0);
  result.set(nonce, SALT_BYTES);
  result.set(ciphertextWithTag, SALT_BYTES + NONCE_BYTES);
  return result;
}

export async function decrypt(fileBytes: Uint8Array, password: string): Promise<string> {
  if (fileBytes.length < SALT_BYTES + NONCE_BYTES + 16) {
    throw new Error('File too small to be a valid .arc vault');
  }

  const salt = fileBytes.subarray(0, SALT_BYTES);
  const nonce = fileBytes.subarray(SALT_BYTES, SALT_BYTES + NONCE_BYTES);
  const ciphertextWithTag = fileBytes.subarray(SALT_BYTES + NONCE_BYTES);

  const key = deriveKey(password, salt);
  const cipher = gcm(key, nonce);
  const plaintext = cipher.decrypt(ciphertextWithTag);

  return new TextDecoder().decode(plaintext);
}
