import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';
import { buildPaymentHistoryEntry } from '@/lib/db-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentId = params.id;
    const db = getDb();
    const paymentDoc = await db.collection('payments').doc(paymentId).get();

    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const paymentData = paymentDoc.data();
    if (!paymentData) {
      return NextResponse.json({ error: 'Payment data not found' }, { status: 404 });
    }

    // Verify community admin owns this payment / user
    if (!await canAccessUser(admin, paymentData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const now = Date.now();

    // Update payment
    await db.collection('payments').doc(paymentId).update({
      adminVerified: true,
      adminVerifiedAt: now,
      status: 'verified',
    });

    // Update invoice
    let billingCycleEnd = now;
    if (paymentData.invoiceId) {
      const invoiceDoc = await db.collection('invoices').doc(paymentData.invoiceId).get();
      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data();
        if (invoiceData?.billingCycleEnd) {
          billingCycleEnd = invoiceData.billingCycleEnd;
        }
      }

      await db.collection('invoices').doc(paymentData.invoiceId).update({
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

      await db.collection('bookings').doc(paymentData.bookingId).update({
        paymentStatus: 'paid',
        lastPaymentDate: now,
        paymentDueDate: nextDueDate,
      });

      // Update payment history using central helper to solve duplication (Issue 8)
      const bookingDoc = await db.collection('bookings').doc(paymentData.bookingId).get();
      const bookingData = bookingDoc.data();
      const paymentHistory = bookingData?.paymentHistory || [];
      const newEntry = buildPaymentHistoryEntry(
        paymentHistory.length,
        paymentData.amount,
        nextDueDate,
        now,
        paymentData.upiTransactionId || ''
      );
      paymentHistory.push(newEntry);
      
      await db.collection('bookings').doc(paymentData.bookingId).update({
        paymentHistory,
      });
    }

    // Write audit log
    await writeAuditLog(
      admin.email,
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
