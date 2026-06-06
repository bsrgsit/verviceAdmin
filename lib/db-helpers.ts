import { getDb } from './firebase-admin';
import { writeAuditLog } from './admin-check';

export interface PaymentHistoryEntry {
  cycle: number;
  amount: number;
  dueDate: number;
  status: 'paid' | 'pending' | 'overdue';
  paidAt: number;
  transactionId: string;
}

export async function getUsersInCommunity(communityId: string) {
  const db = getDb();
  const communityDoc = await db.collection('communities').doc(communityId).get();
  if (!communityDoc.exists) {
    return { communityName: null, communityData: null, users: [], userIds: [], userMap: new Map<string, any>() };
  }
  
  const communityData = communityDoc.data();
  const communityName = communityData?.name;
  if (!communityName) {
    return { communityName: null, communityData, users: [], userIds: [], userMap: new Map<string, any>() };
  }

  const usersSnapshot = await db.collection('users')
    .where('community', '==', communityName)
    .get();

  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const userIds = usersSnapshot.docs.map(doc => doc.id);
  const userMap = new Map<string, any>();
  usersSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    userMap.set(doc.id, { name: data.name || 'Unknown', phoneNumber: data.phoneNumber || '', community: communityName });
  });

  return { communityName, communityData, users, userIds, userMap };
}

export function generateInvoiceNumber(subscriptionId: string, cycleNumber: number, date: Date = new Date()): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shortSubId = subscriptionId.slice(-6).toUpperCase();
  return `INV-${dateStr}-${shortSubId}-${cycleNumber}`;
}

export function buildPaymentHistoryEntry(
  historyLength: number,
  amount: number,
  dueDate: number,
  paidAt: number,
  transactionId: string
): PaymentHistoryEntry {
  return {
    cycle: historyLength + 1,
    amount,
    dueDate,
    status: 'paid',
    paidAt,
    transactionId,
  };
}

export async function checkAndFlagOverdueInvoices() {
  const db = getDb();
  const now = Date.now();
  try {
    const snap = await db.collection('invoices')
      .where('status', '==', 'pending')
      .get();
    
    if (snap.empty) return 0;
    
    let updatedCount = 0;
    const batch = db.batch();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const dueDate = data.dueDate || 0;
      if (dueDate < now) {
        batch.update(doc.ref, { status: 'overdue' });
        if (data.subscriptionId) {
          batch.update(db.collection('bookings').doc(data.subscriptionId), {
            paymentStatus: 'overdue'
          });
        }
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      await writeAuditLog(
        'system',
        'invoices_marked_overdue_auto',
        'bulk',
        'invoice',
        `Automatically marked ${updatedCount} invoices and subscriptions as overdue`
      );
    }
    return updatedCount;
  } catch (error) {
    console.error('Failed to automatically check overdue invoices:', error);
    return 0;
  }
}
