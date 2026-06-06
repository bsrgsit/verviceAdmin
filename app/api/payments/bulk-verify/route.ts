import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';

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
    
    // First, verify access to all payments to prevent unauthorized modifications
    for (const paymentId of paymentIds) {
      const paymentDoc = await db.collection('payments').doc(paymentId).get();
      if (paymentDoc.exists) {
        const paymentData = paymentDoc.data();
        if (paymentData && !await canAccessUser(admin, paymentData.userId)) {
          return NextResponse.json(
            { error: 'Access denied. You do not have permission to verify one or more of these payments.' },
            { status: 403 }
          );
        }
      }
    }

    const now = Date.now();
    const batch = db.batch();

    for (const paymentId of paymentIds) {
      const paymentRef = db.collection('payments').doc(paymentId);
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
          const bookingRef = db.collection('bookings').doc(paymentData.bookingId);
          batch.update(bookingRef, {
            paymentStatus: 'paid',
            lastPaymentDate: now,
            paymentDueDate: now + 30 * 24 * 60 * 60 * 1000,
          });
        }

        if (paymentData.invoiceId) {
          const invoiceRef = db.collection('invoices').doc(paymentData.invoiceId);
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
      admin.email,
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
