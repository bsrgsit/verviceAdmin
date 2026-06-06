import admin from 'firebase-admin';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;

  // Preferred: single base64-encoded service account JSON (avoids all PEM formatting issues)
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      initialized = true;
      console.log('Firebase Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT_KEY');
      return;
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is the base64-encoded service account JSON.');
    }
  }

  // Fallback: individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1).trim();
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (base64) or individual FIREBASE_* env vars.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  initialized = true;
}

export function getDb() {
  ensureInitialized();
  return admin.firestore();
}

export function getAuth() {
  ensureInitialized();
  return admin.auth();
}
