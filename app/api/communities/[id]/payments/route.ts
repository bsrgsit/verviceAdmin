import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    
    // Get community name
    const communityDoc = await db.collection('communities').doc(params.id).get();
    if (!communityDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }
    const communityName = communityDoc.data()?.name;

    // Get users in this community
    const usersSnapshot = await db.collection('users')
      .where('community', '==', communityName)
      .get();

    const userIds = usersSnapshot.docs.map((doc) => doc.id);
    const userMap = new Map<string, any>();
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      userMap.set(doc.id, { name: data.name || 'Unknown', phoneNumber: data.phoneNumber || '' });
    });

    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch payments for these users (Firestore 'in' supports max 30 items)
    const payments: any[] = [];
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
      chunks.push(userIds.slice(i, i + 30));
    }

    for (const chunk of chunks) {
      const snap = await db.collection('payments')
        .where('userId', 'in', chunk)
        .get();
      snap.docs.forEach((doc) => {
        const data = doc.data();
        const user = userMap.get(data.userId) || { name: 'Unknown', phoneNumber: '' };
        payments.push({
          id: doc.id,
          ...data,
          userName: user.name,
          userPhone: user.phoneNumber,
        });
      });
    }

    // Check for duplicate transaction IDs within these payments
    const txnIdCounts = new Map<string, number>();
    payments.forEach((p) => {
      if (p.upiTransactionId) {
        txnIdCounts.set(p.upiTransactionId, (txnIdCounts.get(p.upiTransactionId) || 0) + 1);
      }
    });

    payments.forEach((p) => {
      p.duplicate = p.upiTransactionId
        ? (txnIdCounts.get(p.upiTransactionId) || 0) > 1
        : false;
    });

    // Sort by createdAt descending
    payments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Community payments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
