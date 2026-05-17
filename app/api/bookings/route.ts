import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getDb().collection('bookings')
      .orderBy('startDate', 'desc')
      .get();

    const bookings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'Unknown';
        let userPhone = '';
        let community = '';

        if (data.userId) {
          const userDoc = await getDb().collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.name || 'Unknown';
            userPhone = userData?.phoneNumber || '';
            community = userData?.community || '';
          }
        }

        return {
          id: doc.id,
          ...data,
          userName,
          userPhone,
          community,
        };
      })
    );

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
