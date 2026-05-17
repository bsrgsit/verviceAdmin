import admin from 'firebase-admin';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
