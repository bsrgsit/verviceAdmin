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

    // 1. Idempotency Check
    if (paymentData.status === 'verified' && paymentData.adminVerified) {
      return NextResponse.json({ success: true, message: 'Payment is already verified' });
    }

    // 2. Anti-Spoofing: Replay Attack Check
    // Ensure this UPI Transaction ID has not already been verified on another payment
    if (paymentData.upiTransactionId && paymentData.upiTransactionId.trim() !== '') {
      const dupVerifiedSnap = await db.collection('payments')
        .where('upiTransactionId', '==', paymentData.upiTransactionId.trim())
        .where('status', '==', 'verified')
        .get();

      const otherVerified = dupVerifiedSnap.docs.filter(d => d.id !== paymentId);
      if (otherVerified.length > 0) {
        const priorDate = otherVerified[0].data().adminVerifiedAt || otherVerified[0].data().createdAt;
        const formattedDate = priorDate ? new Date(priorDate).toLocaleDateString('en-IN') : 'an earlier date';
        return NextResponse.json({
          error: `Replay Attack Alert: UPI Transaction ID "${paymentData.upiTransactionId}" was already verified on ${formattedDate} (Payment ID: ${otherVerified[0].id}). Duplicate transaction verification is blocked.`
        }, { status: 400 });
      }
    }

    // 3. Anti-Spoofing: Underpayment / Amount Mismatch Check
    let expectedAmount = 0;
    let billingCycleEnd = Date.now();
    let invoiceExists = false;

    if (paymentData.invoiceId) {
      const invoiceDoc = await db.collection('invoices').doc(paymentData.invoiceId).get();
      if (invoiceDoc.exists) {
        invoiceExists = true;
        const invoiceData = invoiceDoc.data();
        if (invoiceData?.amount !== undefined) {
          expectedAmount = Number(invoiceData.amount);
        }
        if (invoiceData?.billingCycleEnd) {
          billingCycleEnd = Number(invoiceData.billingCycleEnd);
        }
      }
    }

    if (expectedAmount === 0 && paymentData.bookingId) {
      const bookingDoc = await db.collection('bookings').doc(paymentData.bookingId).get();
      if (bookingDoc.exists) {
        const bookingData = bookingDoc.data();
        if (bookingData?.price !== undefined) {
          expectedAmount = Number(bookingData.price);
        }
      }
    }

    const paidAmount = Number(paymentData.amount || 0);
    if (expectedAmount > 0 && paidAmount < expectedAmount) {
      return NextResponse.json({
        error: `Underpayment Alert: Submitted payment is ₹${paidAmount}, but expected amount is ₹${expectedAmount}. Cannot verify underpaid transaction.`
      }, { status: 400 });
    }

    const now = Date.now();

    // Update payment record to verified
    await db.collection('payments').doc(paymentId).update({
      adminVerified: true,
      adminVerifiedAt: now,
      status: 'verified',
    });

    // Update invoice to paid
    if (paymentData.invoiceId && invoiceExists) {
      await db.collection('invoices').doc(paymentData.invoiceId).update({
        status: 'paid',
        paidAt: now,
        paymentTransactionId: paymentData.upiTransactionId || '',
      });
    }

    // Update booking payment status and schedule next due date
    if (paymentData.bookingId) {
      const billingEndDate = new Date(billingCycleEnd);
      // Postpaid cycle due date: 5th of the month following the service cycle
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

      // Update booking payment history
      const bookingDoc = await db.collection('bookings').doc(paymentData.bookingId).get();
      const bookingData = bookingDoc.data();
      const paymentHistory = bookingData?.paymentHistory || [];
      const newEntry = buildPaymentHistoryEntry(
        paymentHistory.length,
        paidAmount,
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
      `Verified payment of ₹${paidAmount} INR (Txn: ${paymentData.upiTransactionId || 'N/A'}) for booking ${paymentData.bookingId || 'N/A'}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
