import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';
import { buildPaymentHistoryEntry } from '@/lib/db-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentIds } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json({ error: 'No payment IDs provided' }, { status: 400 });
    }

    const db = getDb();
    
    // 1. First, fetch and verify permissions & data integrity for all payments in batch
    const paymentsToVerify: { id: string; data: any; invoiceData?: any; bookingData?: any }[] = [];
    const seenTxnIds = new Set<string>();

    for (const paymentId of paymentIds) {
      const paymentDoc = await db.collection('payments').doc(paymentId).get();
      if (!paymentDoc.exists) {
        return NextResponse.json({ error: `Payment ID ${paymentId} not found.` }, { status: 404 });
      }

      const paymentData = paymentDoc.data();
      if (!paymentData) continue;

      // Access control
      if (!await canAccessUser(admin, paymentData.userId)) {
        return NextResponse.json(
          { error: `Access denied. You do not have permission to verify payment ${paymentId}.` },
          { status: 403 }
        );
      }

      // Skip already verified
      if (paymentData.status === 'verified' && paymentData.adminVerified) {
        continue;
      }

      const txnId = (paymentData.upiTransactionId || '').trim();

      // 2. Anti-Spoofing: In-batch duplicate check
      if (txnId !== '') {
        if (seenTxnIds.has(txnId)) {
          return NextResponse.json({
            error: `Bulk Verify Blocked: Duplicate UPI Transaction ID "${txnId}" found multiple times in the selection.`
          }, { status: 400 });
        }
        seenTxnIds.add(txnId);

        // Check if already verified in database
        const dupVerifiedSnap = await db.collection('payments')
          .where('upiTransactionId', '==', txnId)
          .where('status', '==', 'verified')
          .get();

        const otherVerified = dupVerifiedSnap.docs.filter(d => d.id !== paymentId);
        if (otherVerified.length > 0) {
          return NextResponse.json({
            error: `Replay Attack Alert: UPI Transaction ID "${txnId}" was already verified previously (Payment ID: ${otherVerified[0].id}). Bulk verification aborted.`
          }, { status: 400 });
        }
      }

      // 3. Anti-Spoofing: Underpayment Check
      let invoiceData: any = null;
      let expectedAmount = 0;

      if (paymentData.invoiceId) {
        const invoiceDoc = await db.collection('invoices').doc(paymentData.invoiceId).get();
        if (invoiceDoc.exists) {
          invoiceData = invoiceDoc.data();
          if (invoiceData?.amount !== undefined) {
            expectedAmount = Number(invoiceData.amount);
          }
        }
      }

      let bookingData: any = null;
      if (paymentData.bookingId) {
        const bookingDoc = await db.collection('bookings').doc(paymentData.bookingId).get();
        if (bookingDoc.exists) {
          bookingData = bookingDoc.data();
          if (expectedAmount === 0 && bookingData?.price !== undefined) {
            expectedAmount = Number(bookingData.price);
          }
        }
      }

      const paidAmount = Number(paymentData.amount || 0);
      if (expectedAmount > 0 && paidAmount < expectedAmount) {
        return NextResponse.json({
          error: `Underpayment Alert: Payment ${paymentId} has amount ₹${paidAmount}, but expected ₹${expectedAmount}. Cannot bulk-verify underpaid transaction.`
        }, { status: 400 });
      }

      paymentsToVerify.push({ id: paymentId, data: paymentData, invoiceData, bookingData });
    }

    if (paymentsToVerify.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No pending payments needed verification' });
    }

    const now = Date.now();
    const batch = db.batch();

    for (const item of paymentsToVerify) {
      const { id: paymentId, data: paymentData, invoiceData, bookingData } = item;
      const paymentRef = db.collection('payments').doc(paymentId);
      const paidAmount = Number(paymentData.amount || 0);

      batch.update(paymentRef, {
        adminVerified: true,
        adminVerifiedAt: now,
        status: 'verified',
      });

      let billingCycleEnd = invoiceData?.billingCycleEnd ? Number(invoiceData.billingCycleEnd) : now;

      if (paymentData.invoiceId && invoiceData) {
        const invoiceRef = db.collection('invoices').doc(paymentData.invoiceId);
        batch.update(invoiceRef, {
          status: 'paid',
          paidAt: now,
          paymentTransactionId: paymentData.upiTransactionId || '',
        });
      }

      if (paymentData.bookingId && bookingData) {
        const bookingRef = db.collection('bookings').doc(paymentData.bookingId);
        const billingEndDate = new Date(billingCycleEnd);
        const nextDueDate = new Date(
          billingEndDate.getFullYear(),
          billingEndDate.getMonth() + 1,
          5,
          23, 59, 59, 999
        ).getTime();

        const paymentHistory = bookingData?.paymentHistory || [];
        const newEntry = buildPaymentHistoryEntry(
          paymentHistory.length,
          paidAmount,
          nextDueDate,
          now,
          paymentData.upiTransactionId || ''
        );
        paymentHistory.push(newEntry);

        batch.update(bookingRef, {
          paymentStatus: 'paid',
          lastPaymentDate: now,
          paymentDueDate: nextDueDate,
          paymentHistory,
        });
      }
    }

    await batch.commit();

    await writeAuditLog(
      admin.email,
      'bulk_payment_verified',
      paymentsToVerify.map(p => p.id).join(', '),
      'payment',
      `Bulk verified ${paymentsToVerify.length} payments securely with anti-spoofing validation`
    );

    return NextResponse.json({ success: true, count: paymentsToVerify.length });
  } catch (error: any) {
    console.error('Bulk verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
