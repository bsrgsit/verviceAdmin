import admin from 'firebase-admin';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    // Strip leading/trailing quotes if the key was pasted with quotes
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1).trim();
    }
    // Convert escaped newlines back to actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Reconstruct PEM formatting robustly to fix missing newlines from copy-paste
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    
    let base64Body = privateKey;
    if (base64Body.includes(header)) {
      base64Body = base64Body.replace(header, '');
    }
    if (base64Body.includes(footer)) {
      base64Body = base64Body.replace(footer, '');
    }
    // Remove all whitespace/newlines from the base64 body
    base64Body = base64Body.replace(/\s+/g, '');
    
    // Reassemble key with correct headers and newlines
    privateKey = `${header}\n${base64Body}\n${footer}\n`;

    console.log('Firebase Key Debug (Normalized):', {
      length: privateKey.length,
      startsWithBegin: privateKey.startsWith('-----BEGIN PRIVATE KEY-----'),
      indexOfBegin: privateKey.indexOf('-----BEGIN PRIVATE KEY-----'),
      first30: privateKey.substring(0, 30),
      last30: privateKey.substring(Math.max(0, privateKey.length - 30)),
    });
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials not configured.');
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
