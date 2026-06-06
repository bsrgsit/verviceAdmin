import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const body = await request.json();
    const db = getDb();

    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentData = invoiceDoc.data();
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

    // If status changed to paid, update booking dates if needed
    if (body.status === 'paid' && currentData?.status !== 'paid') {
      const now = Date.now();
      await db.collection('invoices').doc(invoiceId).update({
        paidAt: now,
      });

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

        await db.collection('bookings').doc(currentData.subscriptionId).update({
          paymentStatus: 'paid',
          lastPaymentDate: now,
          paymentDueDate: nextDueDate,
        });
      }
    }

    await writeAuditLog(
      'admin',
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
    const invoiceId = params.id;
    const db = getDb();

    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentData = invoiceDoc.data();
    await db.collection('invoices').doc(invoiceId).delete();

    await writeAuditLog(
      'admin',
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
