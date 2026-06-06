import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    const db = getDb();

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.startDate !== undefined) updates.startDate = Number(body.startDate);
    if (body.paymentDueDate !== undefined) updates.paymentDueDate = Number(body.paymentDueDate);
    if (body.status !== undefined) updates.status = body.status;
    if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus;
    if (body.vehicleReg !== undefined) updates.vehicleReg = body.vehicleReg;
    if (body.vehicleName !== undefined) updates.vehicleName = body.vehicleName;
    if (body.cancellationRequest !== undefined) updates.cancellationRequest = body.cancellationRequest;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await db.collection('bookings').doc(bookingId).update(updates);

    await writeAuditLog(
      'admin',
      'booking_updated',
      bookingId,
      'booking',
      `Updated booking fields: ${JSON.stringify(updates)}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Booking update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const db = getDb();

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentData = bookingDoc.data();
    await db.collection('bookings').doc(bookingId).delete();

    await writeAuditLog(
      'admin',
      'booking_deleted',
      bookingId,
      'booking',
      `Deleted booking for vehicle ${currentData?.vehicleReg} - service ${currentData?.serviceName}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Booking delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
