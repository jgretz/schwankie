import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

export function loadKey(): Uint8Array {
  const keyStr = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(keyStr, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key. Got ${key.length} bytes.`,
    );
  }

  return new Uint8Array(key);
}

export function encryptToken(plaintext: string, key: Uint8Array): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, new Uint8Array(iv));

  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  const authTag = cipher.getAuthTag();

  const ivB64 = iv.toString('base64');
  const ctB64 = Buffer.from(encrypted, 'binary').toString('base64');
  const tagB64 = authTag.toString('base64');

  return `${ivB64}:${ctB64}:${tagB64}`;
}

export function decryptToken(ciphertext: string, key: Uint8Array): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:ct:tag.');
  }

  const [ivB64, ctB64, tagB64] = parts;

  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, new Uint8Array(iv));
  decipher.setAuthTag(new Uint8Array(authTag));

  try {
    const decrypted = decipher.update(ct as Uint8Array) + decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Authentication tag verification failed. Ciphertext may be tampered.');
  }
}
