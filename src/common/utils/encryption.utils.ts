// 📁 encryption.utils.ts
// ===============================
// AES-256-GCM encryption/decryption utility
// Sử dụng để mã hóa nội dung chat messages

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class EncryptionUtil {
  // Thuật toán sử dụng
  private static readonly ALGORITHM = 'aes-256-gcm';

  // Key từ environment variable (32 bytes = 256 bits)
  // Nếu không có trong .env, sẽ dùng key mặc định (chỉ để dev, production phải set .env)
  private static readonly ENCRYPTION_KEY =
    process.env.CHAT_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // 32 chars = 256 bits

  /**
   * Mã hóa văn bản sử dụng AES-256-GCM
   * @param text - Văn bản cần mã hóa
   * @returns Chuỗi mã hóa dạng: iv:authTag:encryptedData (tất cả base64)
   */
  static encrypt(text: string): string {
    if (!text) return text; // Nếu text rỗng, không cần mã hóa

    try {
      // Tạo initialization vector ngẫu nhiên (16 bytes)
      const iv = randomBytes(16);

      // Tạo cipher
      const cipher = createCipheriv(
        this.ALGORITHM,
        Buffer.from(this.ENCRYPTION_KEY, 'utf-8'),
        iv,
      );

      // Mã hóa
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Lấy auth tag (16 bytes) để xác thực
      const authTag = cipher.getAuthTag();

      // Kết hợp: iv:authTag:encryptedData (tất cả base64)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      // Nếu lỗi, trả về text gốc để không phá vỡ luồng
      return text;
    }
  }

  /**
   * Giải mã văn bản đã được mã hóa bằng AES-256-GCM
   * @param encryptedText - Chuỗi mã hóa dạng: iv:authTag:encryptedData
   * @returns Văn bản gốc đã giải mã
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      // Kiểm tra xem có phải chuỗi đã mã hóa không (có dấu ":" và ít nhất 3 phần)
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        // Không phải chuỗi mã hóa, trả về nguyên bản (để tương thích với data cũ)
        return encryptedText;
      }

      const [ivBase64, authTagBase64, encrypted] = parts;

      // Chuyển từ base64 về Buffer
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Tạo decipher
      const decipher = createDecipheriv(
        this.ALGORITHM,
        Buffer.from(this.ENCRYPTION_KEY, 'utf-8'),
        iv,
      );

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Giải mã
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      // Nếu lỗi giải mã, trả về text gốc (có thể là data cũ chưa mã hóa)
      return encryptedText;
    }
  }

  /**
   * Kiểm tra xem một chuỗi có phải là chuỗi đã mã hóa không
   * @param text - Chuỗi cần kiểm tra
   * @returns true nếu là chuỗi mã hóa, false nếu không
   */
  static isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    // Chuỗi mã hóa phải có đúng 3 phần và mỗi phần phải là base64 hợp lệ
    return (
      parts.length === 3 &&
      parts.every((part) => {
        try {
          return Buffer.from(part, 'base64').toString('base64') === part;
        } catch {
          return false;
        }
      })
    );
  }
}
