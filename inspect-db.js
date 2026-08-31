const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = 'c:/Users/Guravareddy/Documents/VAPPS/carclean-b8a84-firebase-adminsdk-fbsvc-ef4d24ff64.json';
console.log('Loading service account from:', serviceAccountPath);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log('\n--- INSPECTING SUPPORT TICKETS ---');
  const ticketsSnapshot = await db.collection('support_tickets').limit(20).get();
  console.log(`Found ${ticketsSnapshot.size} support tickets.`);
  
  for (const doc of ticketsSnapshot.docs) {
    const data = doc.data();
    console.log(`\nTicket ID: ${doc.id}`);
    console.log(`  Full Data:`, JSON.stringify(data, null, 2));
    
    const userId = data.userId;
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`  User document found:`, JSON.stringify(userData, null, 2));
      } else {
        console.log(`  ❌ User document not found in 'users' collection for ID: ${userId}`);
      }
    }
  }

  console.log('\n--- INSPECTING DRIVER REQUESTS ---');
  const driverSnapshot = await db.collection('driver_requests').limit(2).get();
  console.log(`Found ${driverSnapshot.size} driver requests.`);
  
  for (const doc of driverSnapshot.docs) {
    const data = doc.data();
    console.log(`\nDriver Request ID: ${doc.id}`);
    console.log(`  Full Data:`, JSON.stringify(data, null, 2));
    
    const userId = data.userId;
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`  User document found:`, JSON.stringify(userData, null, 2));
      } else {
        console.log(`  ❌ User document not found in 'users' collection for ID: ${userId}`);
      }
    }
  }
  console.log('\n--- SEARCHING FOR USER BY PHONE ---');
  const phoneSearchSnap = await db.collection('users')
    .where('phoneNumber', '==', '+918884273795')
    .get();
  console.log(`Found ${phoneSearchSnap.size} users with phone +918884273795.`);
  phoneSearchSnap.docs.forEach(doc => {
    console.log(`  User Doc ID: ${doc.id}`);
    console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
  });

  const phoneSearchSnap2 = await db.collection('users')
    .where('phoneNumber', '==', '8884273795')
    .get();
  console.log(`Found ${phoneSearchSnap2.size} users with phone 8884273795.`);
  phoneSearchSnap2.docs.forEach(doc => {
    console.log(`  User Doc ID: ${doc.id}`);
    console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(err => {
  console.error('Error running inspector:', err);
}).then(() => {
  process.exit(0);
});
