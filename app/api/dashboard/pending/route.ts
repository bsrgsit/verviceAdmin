import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db.collection('payments')
      .where('status', '==', 'pending_manual_verify')
      .limit(20)
      .get();

    const payments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'Unknown';
        if (data.userId) {
          try {
            const userDoc = await db.collection('users').doc(data.userId).get();
            if (userDoc.exists) {
              userName = userDoc.data()?.name || 'Unknown';
            }
          } catch (e) {}
        }
        return {
          id: doc.id,
          ...data,
          userName,
        };
      })
    );

    // Sort by createdAt in memory
    payments.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json(payments.slice(0, 10));
  } catch (error: any) {
    console.error('Pending payments error:', error);
    return NextResponse.json([]);
  }
}
