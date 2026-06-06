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
    const now = Date.now();

    // Update payment
    await getDb().collection('payments').doc(paymentId).update({
      adminVerified: true,
      adminVerifiedAt: now,
      status: 'verified',
    });

    // Update invoice
    let billingCycleEnd = now;
    if (paymentData.invoiceId) {
      const invoiceDoc = await getDb().collection('invoices').doc(paymentData.invoiceId).get();
      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data();
        if (invoiceData?.billingCycleEnd) {
          billingCycleEnd = invoiceData.billingCycleEnd;
        }
      }

      await getDb().collection('invoices').doc(paymentData.invoiceId).update({
        status: 'paid',
        paidAt: now,
        paymentTransactionId: paymentData.upiTransactionId,
      });
    }

    // Update booking payment status
    if (paymentData.bookingId) {
      const billingEndDate = new Date(billingCycleEnd);
      const nextDueDate = new Date(
        billingEndDate.getFullYear(),
        billingEndDate.getMonth() + 1,
        5,
        23, 59, 59, 999
      ).getTime();

      await getDb().collection('bookings').doc(paymentData.bookingId).update({
        paymentStatus: 'paid',
        lastPaymentDate: now,
        paymentDueDate: nextDueDate,
      });

      // Update payment history
      const bookingDoc = await getDb().collection('bookings').doc(paymentData.bookingId).get();
      const bookingData = bookingDoc.data();
      const paymentHistory = bookingData?.paymentHistory || [];
      paymentHistory.push({
        cycle: paymentHistory.length + 1,
        amount: paymentData.amount,
        dueDate: nextDueDate,
        status: 'paid',
        paidAt: now,
        transactionId: paymentData.upiTransactionId,
      });
      await getDb().collection('bookings').doc(paymentData.bookingId).update({
        paymentHistory,
      });
    }

    // Write audit log
    await writeAuditLog(
      'admin',
      'payment_verified',
      paymentId,
      'payment',
      `Verified payment of ${paymentData.amount} INR for booking ${paymentData.bookingId}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
