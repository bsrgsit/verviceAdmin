import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getDb().collection('payments')
      .where('status', '==', 'pending_manual_verify')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const payments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Fetch user name
        let userName = 'Unknown';
        if (data.userId) {
          const userDoc = await getDb().collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            userName = userDoc.data()?.name || 'Unknown';
          }
        }
        return {
          id: doc.id,
          ...data,
          userName,
        };
      })
    );

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Pending payments error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
