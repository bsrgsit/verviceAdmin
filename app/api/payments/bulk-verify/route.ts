import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function POST(request: NextRequest) {
  try {
    const { paymentIds } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json({ error: 'No payment IDs provided' }, { status: 400 });
    }

    const now = Date.now();
    const batch = getDb().batch();

    for (const paymentId of paymentIds) {
      const paymentRef = getDb().collection('payments').doc(paymentId);
      const paymentDoc = await paymentRef.get();

      if (paymentDoc.exists) {
        const paymentData = paymentDoc.data();
        if (!paymentData) continue;

        batch.update(paymentRef, {
          adminVerified: true,
          adminVerifiedAt: now,
          status: 'verified',
        });

        if (paymentData.bookingId) {
          const bookingRef = getDb().collection('bookings').doc(paymentData.bookingId);
          batch.update(bookingRef, {
            paymentStatus: 'paid',
            lastPaymentDate: now,
            paymentDueDate: now + 30 * 24 * 60 * 60 * 1000,
          });
        }

        if (paymentData.invoiceId) {
          const invoiceRef = getDb().collection('invoices').doc(paymentData.invoiceId);
          batch.update(invoiceRef, {
            status: 'paid',
            paidAt: now,
            paymentTransactionId: paymentData.upiTransactionId,
          });
        }
      }
    }

    await batch.commit();

    await writeAuditLog(
      'admin',
      'bulk_payment_verified',
      paymentIds.join(', '),
      'payment',
      `Bulk verified ${paymentIds.length} payments`
    );

    return NextResponse.json({ success: true, count: paymentIds.length });
  } catch (error: any) {
    console.error('Bulk verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
