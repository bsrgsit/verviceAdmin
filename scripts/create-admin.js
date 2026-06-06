const admin = require('firebase-admin');
const path = require('path');

if (process.argv.length < 5) {
  console.log('\nUsage:');
  console.log('  node scripts/create-admin.js <path-to-service-account.json> <admin-email> <admin-password> [admin-name]\n');
  process.exit(1);
}

const keyPath = path.resolve(process.argv[2]);
const email = process.argv[3].trim().toLowerCase();
const password = process.argv[4];
const name = process.argv[5] || 'Admin User';

console.log(`\nInitializing Firebase Admin SDK using key: ${keyPath}`);
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch (e) {
  console.error(`Error: Could not load JSON service account key from "${keyPath}". Make sure the path is correct.`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdmin() {
  console.log(`\nStep 1: Creating user in Firebase Auth (${email})...`);
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });
    console.log(`[Success] Created Auth user with UID: ${userRecord.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      console.log('[Notice] User email already exists in Firebase Auth. Updating user password...');
      userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, { password: password });
      console.log(`[Success] Updated password for user UID: ${userRecord.uid}`);
    } else {
      throw err;
    }
  }

  console.log(`\nStep 2: Authorizing admin role in Firestore 'admins' collection...`);
  const adminDocRef = db.collection('admins').doc(email);
  await adminDocRef.set({
    email: email,
    name: name,
    role: 'super_admin',
    assignedCommunities: ['*'],
    isActive: true,
    createdAt: Date.now()
  });
  console.log(`[Success] Authorized '${email}' as a super_admin in Firestore!`);

  console.log('\n==================================================');
  console.log(' Admin Account Setup Complete!');
  console.log('==================================================');
  console.log(` Email:    ${email}`);
  console.log(` Role:     super_admin`);
  console.log(` Communities: all (*)`);
  console.log('==================================================\n');
}

createAdmin().catch(err => {
  console.error('\n[Error] Failed to create admin account:', err.message);
  process.exit(1);
});
