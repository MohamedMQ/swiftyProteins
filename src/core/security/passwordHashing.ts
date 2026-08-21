import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';

export const PBKDF2_ITERATIONS = 20_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const ALGORITHM = 'PBKDF2-HMAC-SHA256';

export interface PasswordHash {
  algorithm: typeof ALGORITHM;
  iterations: number;
  saltHex: string;
  hashHex: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = Crypto.getRandomBytes(SALT_BYTES);
  const derived = await pbkdf2Async(sha256, password, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_BYTES,
  });

  return {
    algorithm: ALGORITHM,
    iterations: PBKDF2_ITERATIONS,
    saltHex: toHex(salt),
    hashHex: toHex(derived),
  };
}

export async function verifyPassword(
  password: string,
  record: PasswordHash
): Promise<boolean> {
  const salt = fromHex(record.saltHex);
  const derived = await pbkdf2Async(sha256, password, salt, {
    c: record.iterations,
    dkLen: KEY_BYTES,
  });

  return timingSafeEqual(derived, fromHex(record.hashHex));
}
