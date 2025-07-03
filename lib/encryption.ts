import CryptoJS from 'crypto-js';

// We should use environment variables for encryption keys in a real app
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'secure-encryption-key-should-be-in-env-variables';

/**
 * Encrypt sensitive data
 * @param data Data to encrypt
 * @returns Encrypted string
 */
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt encrypted data
 * @param encryptedData Encrypted string to decrypt
 * @returns Decrypted string
 */
export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt an object
 * @param obj Object to encrypt
 * @returns Encrypted string
 */
export function encryptObject(obj: any): string {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString);
}

/**
 * Decrypt an encrypted object
 * @param encryptedData Encrypted string to decrypt
 * @returns Decrypted object
 */
export function decryptObject<T>(encryptedData: string): T {
  const jsonString = decrypt(encryptedData);
  return JSON.parse(jsonString) as T;
}

/**
 * Hash data (one-way)
 * @param data Data to hash
 * @returns Hashed string
 */
export function hash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Check if a value matches its hash
 * @param value Original value
 * @param hashedValue Hashed value to compare against
 * @returns Whether the values match
 */
export function verifyHash(value: string, hashedValue: string): boolean {
  return hash(value) === hashedValue;
}
