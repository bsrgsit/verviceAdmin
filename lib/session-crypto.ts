const SECRET = process.env.SESSION_SECRET || 'vervice-admin-default-super-secret-key-123456';
const encoder = new TextEncoder();

function base64Encode(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  return Buffer.from(str).toString('base64');
}

function base64Decode(str: string): string {
  if (typeof atob === 'function') {
    return atob(str);
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

async function getSignature(payload: string, secret: string): Promise<string> {
  const keyBuf = encoder.encode(secret);
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : require('crypto').webcrypto;
  const key = await cryptoObj.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const payloadBuf = encoder.encode(payload);
  const signature = await cryptoObj.subtle.sign('HMAC', key, payloadBuf);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(data: any, maxAgeSeconds: number): Promise<string> {
  const payloadStr = JSON.stringify(data);
  const payloadBase64 = base64Encode(payloadStr);
  const expires = Date.now() + maxAgeSeconds * 1000;
  const signatureInput = `${payloadBase64}.${expires}`;
  const signature = await getSignature(signatureInput, SECRET);
  return `${signatureInput}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<any | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [payloadBase64, expiresStr, signature] = parts;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Date.now() > expires) {
    return null; // Expired
  }
  const signatureInput = `${payloadBase64}.${expiresStr}`;
  const expectedSignature = await getSignature(signatureInput, SECRET);
  if (signature !== expectedSignature) {
    return null; // Invalid signature
  }
  try {
    const payloadStr = base64Decode(payloadBase64);
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}
