import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
function getKey(): Buffer {
  const KEY_HEX = (process.env.ENCRYPTION_KEY as string) || '';
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error('ENCRYPTION_KEY environment variable is missing or invalid (must be 64-char hex string)');
  }
  return Buffer.from(KEY_HEX, 'hex');
}

export function encrypt(plaintext: string | number | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined) return null;
  
  const text = String(plaintext);
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Format: v1:iv:authTag:encryptedData (all base64)
  return `v1:${iv.toString('base64')}:${authTag}:${encrypted}`;
}

export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  
  const parts = ciphertext.split(':');
  
  let ivBase64, authTagBase64, encryptedBase64;
  
  if (parts.length === 3) {
    // Legacy format without version prefix
    [ivBase64, authTagBase64, encryptedBase64] = parts;
  } else if (parts.length === 4 && parts[0] === 'v1') {
    // Versioned format
    [, ivBase64, authTagBase64, encryptedBase64] = parts;
  } else {
    throw new Error('Invalid encrypted string format');
  }
  
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error('Missing parts in encrypted string');
  }

  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const key = getKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
