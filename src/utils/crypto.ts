const APP_SALT = 's3-manager-v1'; // Application-level salt

const ACCESS_KEY_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SECRET_KEY_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const randomFromCharset = (charset: string, length: number): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';

  for (let index = 0; index < length; index += 1) {
    result += charset[bytes[index] % charset.length];
  }

  return result;
};

export const generateAccessKeyId2026 = (length = 20): string => {
  return randomFromCharset(ACCESS_KEY_CHARSET, length);
};

export const generateSecretAccessKey2026 = (length = 40): string => {
  return randomFromCharset(SECRET_KEY_CHARSET, length);
};

export const generateS3Credentials2026 = (): { accessKeyId: string; secretAccessKey: string } => {
  return {
    accessKeyId: generateAccessKeyId2026(),
    secretAccessKey: generateSecretAccessKey2026(),
  };
};

async function getDerivedKey(): Promise<CryptoKey> {
  // Use a combination of APP_SALT and origin as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SALT + location.origin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(APP_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getDerivedKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // Combine IV + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encoded: string): Promise<string> {
  const key = await getDerivedKey();
  const combined = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}
