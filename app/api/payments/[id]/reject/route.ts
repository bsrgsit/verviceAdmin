import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const paymentDoc = await getDb().collection('payments').doc(paymentId).get();

    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const paymentData = paymentDoc.data();
    if (!paymentData) {
      return NextResponse.json({ error: 'Payment data not found' }, { status: 404 });
    }

    await getDb().collection('payments').doc(paymentId).update({
      status: 'rejected',
      adminNotes: 'Rejected by admin',
    });

    await writeAuditLog(
      'admin',
      'payment_rejected',
      paymentId,
      'payment',
      `Rejected payment of ${paymentData.amount} INR for booking ${paymentData.bookingId}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reject error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
