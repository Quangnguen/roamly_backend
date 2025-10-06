// 📁 encryption.utils.spec.ts
// ===============================
// Unit test cho EncryptionUtil

import { EncryptionUtil } from './encryption.utils';

describe('EncryptionUtil', () => {
  describe('encrypt', () => {
    it('should encrypt text successfully', () => {
      const plainText = 'Hello World!';
      const encrypted = EncryptionUtil.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:encrypted
    });

    it('should return empty string for empty input', () => {
      const result = EncryptionUtil.encrypt('');
      expect(result).toBe('');
    });

    it('should produce different ciphertext for same input', () => {
      const plainText = 'Test message';
      const encrypted1 = EncryptionUtil.encrypt(plainText);
      const encrypted2 = EncryptionUtil.encrypt(plainText);

      // IV ngẫu nhiên → mỗi lần mã hóa ra kết quả khác nhau
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle special characters', () => {
      const specialText = '你好! 🎉 @#$%^&*()';
      const encrypted = EncryptionUtil.encrypt(specialText);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(specialText);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text successfully', () => {
      const plainText = 'Secret message';
      const encrypted = EncryptionUtil.encrypt(plainText);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should return original text if not encrypted (backward compatibility)', () => {
      const plainText = 'This is not encrypted';
      const result = EncryptionUtil.decrypt(plainText);

      expect(result).toBe(plainText);
    });

    it('should return empty string for empty input', () => {
      const result = EncryptionUtil.decrypt('');
      expect(result).toBe('');
    });

    it('should handle malformed encrypted text gracefully', () => {
      const malformed = 'not:valid:encryption:format';
      const result = EncryptionUtil.decrypt(malformed);

      // Trả về nguyên bản nếu decrypt fail
      expect(result).toBe(malformed);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted text', () => {
      const plainText = 'Test';
      const encrypted = EncryptionUtil.encrypt(plainText);

      expect(EncryptionUtil.isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', () => {
      const plainText = 'Not encrypted';

      expect(EncryptionUtil.isEncrypted(plainText)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(EncryptionUtil.isEncrypted('')).toBe(false);
    });

    it('should return false for text with colons but not encrypted', () => {
      const fakeEncrypted = 'not:real:encrypted:text';

      expect(EncryptionUtil.isEncrypted(fakeEncrypted)).toBe(false);
    });
  });

  describe('round-trip encryption', () => {
    it('should preserve Vietnamese text', () => {
      const vietnamese = 'Xin chào! Tôi là một tin nhắn tiếng Việt có dấu.';
      const encrypted = EncryptionUtil.encrypt(vietnamese);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(vietnamese);
    });

    it('should preserve emojis', () => {
      const emojis = '🎉 🚀 ❤️ 😊 👍';
      const encrypted = EncryptionUtil.encrypt(emojis);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(emojis);
    });

    it('should preserve long text', () => {
      const longText = 'a'.repeat(10000);
      const encrypted = EncryptionUtil.encrypt(longText);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(longText);
    });

    it('should preserve multiline text', () => {
      const multiline = `Line 1
      Line 2
      Line 3
      With tabs and spaces`;
      const encrypted = EncryptionUtil.encrypt(multiline);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(multiline);
    });
  });

  describe('performance', () => {
    it('should encrypt/decrypt in reasonable time', () => {
      const text = 'Performance test message';
      const iterations = 1000;

      const startEncrypt = Date.now();
      for (let i = 0; i < iterations; i++) {
        EncryptionUtil.encrypt(text);
      }
      const encryptTime = Date.now() - startEncrypt;

      const encrypted = EncryptionUtil.encrypt(text);
      const startDecrypt = Date.now();
      for (let i = 0; i < iterations; i++) {
        EncryptionUtil.decrypt(encrypted);
      }
      const decryptTime = Date.now() - startDecrypt;

      console.log(`Encrypt ${iterations} times: ${encryptTime}ms`);
      console.log(`Decrypt ${iterations} times: ${decryptTime}ms`);
      console.log(`Average encrypt: ${encryptTime / iterations}ms`);
      console.log(`Average decrypt: ${decryptTime / iterations}ms`);

      // Mỗi operation nên < 1ms
      expect(encryptTime / iterations).toBeLessThan(1);
      expect(decryptTime / iterations).toBeLessThan(1);
    });
  });
});
