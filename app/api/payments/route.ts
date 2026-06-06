import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookingId, amount, upiAppName, upiTransactionId, status, adminVerified, adminNotes, createdAt } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment fields (userId, amount)' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = Date.now();

    const newPayment = {
      userId,
      bookingId: bookingId || '',
      amount: Number(amount),
      upiAppName: upiAppName || 'Manual Collection',
      upiTransactionId: upiTransactionId || '',
      status: status || 'pending_manual_verify',
      adminVerified: adminVerified === undefined ? false : !!adminVerified,
      adminNotes: adminNotes || '',
      createdAt: createdAt ? Number(createdAt) : now,
    };

    const docRef = await db.collection('payments').add(newPayment);

    await writeAuditLog(
      'admin',
      'payment_created',
      docRef.id,
      'payment',
      `Recorded manual payment of ${amount} INR for user ${userId}`
    );

    return NextResponse.json({ id: docRef.id, ...newPayment }, { status: 201 });
  } catch (error: any) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
