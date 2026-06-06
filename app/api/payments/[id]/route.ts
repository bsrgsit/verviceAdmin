import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const body = await request.json();
    const db = getDb();

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (body.amount !== undefined) updates.amount = Number(body.amount);
    if (body.upiAppName !== undefined) updates.upiAppName = body.upiAppName;
    if (body.upiTransactionId !== undefined) updates.upiTransactionId = body.upiTransactionId;
    if (body.status !== undefined) updates.status = body.status;
    if (body.adminVerified !== undefined) updates.adminVerified = !!body.adminVerified;
    if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;
    if (body.createdAt !== undefined) updates.createdAt = Number(body.createdAt);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await db.collection('payments').doc(paymentId).update(updates);

    await writeAuditLog(
      'admin',
      'payment_updated',
      paymentId,
      'payment',
      `Updated payment fields: ${JSON.stringify(Object.keys(updates))}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const db = getDb();

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const currentData = paymentDoc.data();
    await db.collection('payments').doc(paymentId).delete();

    await writeAuditLog(
      'admin',
      'payment_deleted',
      paymentId,
      'payment',
      `Deleted payment of ${currentData?.amount} INR for user ${currentData?.userId}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
