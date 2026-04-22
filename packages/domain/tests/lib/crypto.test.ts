import {beforeEach, describe, expect, it} from 'bun:test';
import {encryptToken, decryptToken, loadKey} from '../../src/lib/crypto';

describe('crypto', function () {
  let key: Uint8Array;

  beforeEach(function () {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
      new Uint8Array(32).fill(0),
    ).toString('base64');
    key = loadKey();
  });

  describe('encryptToken and decryptToken', function () {
    it('should roundtrip plaintext', function () {
      const plaintext = 'test@example.com';
      const encrypted = encryptToken(plaintext, key);
      const decrypted = decryptToken(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', function () {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encryptToken(plaintext, key);
      const decrypted = decryptToken(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (distinct IV)', function () {
      const plaintext = 'test@example.com';
      const encrypted1 = encryptToken(plaintext, key);
      const encrypted2 = encryptToken(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);

      const decrypted1 = decryptToken(encrypted1, key);
      const decrypted2 = decryptToken(encrypted2, key);

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });
  });

  describe('loadKey', function () {
    it('should throw when TOKEN_ENCRYPTION_KEY is not set', function () {
      delete process.env.TOKEN_ENCRYPTION_KEY;

      expect(() => {
        loadKey();
      }).toThrow('TOKEN_ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw when key is not 32 bytes', function () {
      process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
        new Uint8Array(16).fill(0),
      ).toString('base64');

      expect(() => {
        loadKey();
      }).toThrow('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key. Got 16 bytes.');
    });
  });

  describe('decryptToken', function () {
    it('should throw on malformed ciphertext (wrong format)', function () {
      expect(() => {
        decryptToken('invalid', key);
      }).toThrow('Invalid ciphertext format. Expected iv:ct:tag.');
    });

    it('should throw on tampered ciphertext (wrong auth tag)', function () {
      const plaintext = 'secret';
      const encrypted = encryptToken(plaintext, key);
      const [iv, ct, tag] = encrypted.split(':');

      const badTag = Buffer.from('AAAAAAAAAAAAAAAA', 'utf8').toString('base64');
      const tampered = `${iv}:${ct}:${badTag}`;

      expect(() => {
        decryptToken(tampered, key);
      }).toThrow('Authentication tag verification failed');
    });

    it('should throw on invalid base64', function () {
      expect(() => {
        decryptToken('!!!:!!!:!!!', key);
      }).toThrow('Invalid base64 in ciphertext');
    });

    it('should throw on wrong IV length', function () {
      const iv = Buffer.from('short').toString('base64');
      const ct = Buffer.from('data').toString('base64');
      const tag = Buffer.from(new Uint8Array(16)).toString('base64');

      expect(() => {
        decryptToken(`${iv}:${ct}:${tag}`, key);
      }).toThrow('Invalid IV length');
    });
  });
});
