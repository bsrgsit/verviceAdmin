import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getDb().collection('payments')
      .orderBy('createdAt', 'desc')
      .get();

    // Check for duplicate transaction IDs
    const txnIdCounts = new Map<string, number>();
    snapshot.forEach((doc) => {
      const txnId = doc.data().upiTransactionId;
      if (txnId) {
        txnIdCounts.set(txnId, (txnIdCounts.get(txnId) || 0) + 1);
      }
    });

    const payments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'Unknown';
        let userPhone = '';

        if (data.userId) {
          const userDoc = await getDb().collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.name || 'Unknown';
            userPhone = userData?.phoneNumber || '';
          }
        }

        return {
          id: doc.id,
          ...data,
          userName,
          userPhone,
          duplicate: data.upiTransactionId
            ? (txnIdCounts.get(data.upiTransactionId) || 0) > 1
            : false,
        };
      })
    );

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
