import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';
import { buildPaymentHistoryEntry } from '@/lib/db-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;
    const body = await request.json();
    const db = getDb();

    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentData = invoiceDoc.data();
    if (!currentData) {
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    // Verify community admin owns this invoice / user
    if (!await canAccessUser(admin, currentData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: Record<string, any> = {};
    if (body.amount !== undefined) updates.amount = Number(body.amount);
    if (body.dueDate !== undefined) updates.dueDate = Number(body.dueDate);
    if (body.status !== undefined) updates.status = body.status;
    if (body.billingMonth !== undefined) updates.billingMonth = body.billingMonth;
    if (body.serviceName !== undefined) updates.serviceName = body.serviceName;
    if (body.vehicleReg !== undefined) updates.vehicleReg = body.vehicleReg;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await db.collection('invoices').doc(invoiceId).update(updates);

    // If status changed to paid, update booking dates and record/verify payment
    if (body.status === 'paid' && currentData?.status !== 'paid') {
      const now = Date.now();
      await db.collection('invoices').doc(invoiceId).update({
        paidAt: now,
      });

      // Create or update payment document in 'payments' collection
      try {
        const paymentsQuery = await db.collection('payments')
          .where('invoiceId', '==', invoiceId)
          .limit(1)
          .get();

        if (!paymentsQuery.empty) {
          const paymentDocId = paymentsQuery.docs[0].id;
          await db.collection('payments').doc(paymentDocId).update({
            status: 'verified',
            adminVerified: true,
            adminVerifiedAt: now,
            adminNotes: 'Marked as paid via Invoice Manager update',
          });
        } else {
          await db.collection('payments').add({
            userId: currentData?.userId || '',
            bookingId: currentData?.subscriptionId || '',
            invoiceId: invoiceId,
            amount: Number(body.amount ?? currentData?.amount ?? 0),
            upiAppName: 'Invoice Payment',
            upiTransactionId: currentData?.paymentTransactionId || '',
            status: 'verified',
            adminVerified: true,
            adminVerifiedAt: now,
            adminNotes: 'Marked as paid via Invoice Manager update',
            createdAt: now,
          });
        }
      } catch (err) {
        console.error('Error syncing payment for invoice:', err);
      }

      if (currentData?.subscriptionId) {
        // Find if this is the latest invoice for the subscription
        const allInvoices = await db.collection('invoices')
          .where('subscriptionId', '==', currentData.subscriptionId)
          .get();
        
        const invoicesList = allInvoices.docs.map(doc => doc.data());
        const latestCycleEnd = invoicesList.reduce((max, inv) => 
          inv.billingCycleEnd > max ? inv.billingCycleEnd : max
        , 0);

        const nextDueDate = latestCycleEnd > 0 
          ? new Date(new Date(latestCycleEnd).getFullYear(), new Date(latestCycleEnd).getMonth() + 1, 5).getTime()
          : now + 30 * 24 * 60 * 60 * 1000;

        await db.collection('bookings').doc(currentData?.subscriptionId || '').update({
          paymentStatus: 'paid',
          lastPaymentDate: now,
          paymentDueDate: nextDueDate,
        });

        // Update booking payment history
        try {
          const bookingDoc = await db.collection('bookings').doc(currentData?.subscriptionId || '').get();
          if (bookingDoc.exists) {
            const bookingData = bookingDoc.data();
            const paymentHistory = bookingData?.paymentHistory || [];
            
            // centralize buildPaymentHistoryEntry (Issue 8)
            const newEntry = buildPaymentHistoryEntry(
              paymentHistory.length,
              Number(body.amount ?? currentData?.amount ?? 0),
              nextDueDate,
              now,
              currentData?.paymentTransactionId || ''
            );
            paymentHistory.push(newEntry);

            await db.collection('bookings').doc(currentData?.subscriptionId || '').update({
              paymentHistory,
            });
          }
        } catch (err) {
          console.error('Error updating booking payment history:', err);
        }
      }
    }

    // If status changed from paid to something else
    if (body.status && body.status !== 'paid' && currentData?.status === 'paid') {
      try {
        const paymentsQuery = await db.collection('payments')
          .where('invoiceId', '==', invoiceId)
          .limit(1)
          .get();

        if (!paymentsQuery.empty) {
          const paymentDocId = paymentsQuery.docs[0].id;
          await db.collection('payments').doc(paymentDocId).update({
            status: 'pending_manual_verify',
            adminVerified: false,
            adminVerifiedAt: 0,
          });
        }
      } catch (err) {
        console.error('Error reverting payment for invoice:', err);
      }

      if (currentData?.subscriptionId) {
        await db.collection('bookings').doc(currentData.subscriptionId).update({
          paymentStatus: 'pending',
        });
      }
    }

    await writeAuditLog(
      admin.email,
      'invoice_updated',
      invoiceId,
      'invoice',
      `Updated fields for invoice ${invoiceId}: ${JSON.stringify(updates)}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;
    const db = getDb();

    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentData = invoiceDoc.data();
    if (!currentData) {
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    // Verify community admin owns this invoice / user
    if (!await canAccessUser(admin, currentData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.collection('invoices').doc(invoiceId).delete();

    await writeAuditLog(
      admin.email,
      'invoice_deleted',
      invoiceId,
      'invoice',
      `Deleted invoice ${currentData?.invoiceNumber} for subscription ${currentData?.subscriptionId}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
