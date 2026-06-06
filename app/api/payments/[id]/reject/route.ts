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

    const db = getDb();
    await db.collection('payments').doc(paymentId).update({
      status: 'rejected',
      adminNotes: 'Rejected by admin',
    });

    // Revert invoice and booking status
    if (paymentData.invoiceId) {
      const invoiceDoc = await db.collection('invoices').doc(paymentData.invoiceId).get();
      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data();
        const dueDate = invoiceData?.dueDate || 0;
        const now = Date.now();
        const newStatus = (dueDate > 0 && dueDate < now) ? 'overdue' : 'pending';

        await db.collection('invoices').doc(paymentData.invoiceId).update({
          status: newStatus,
          paidAt: 0,
          paymentTransactionId: '',
        });

        // Revert booking paymentStatus
        if (paymentData.bookingId) {
          await db.collection('bookings').doc(paymentData.bookingId).update({
            paymentStatus: newStatus === 'overdue' ? 'overdue' : 'unpaid',
          });
        }
      }
    }

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
