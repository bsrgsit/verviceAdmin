import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

function formatPhone(phone?: string) {
  if (!phone) return undefined;
  let clean = phone.trim();
  if (clean.length === 10 && !clean.startsWith('+')) {
    return `+91${clean}`;
  }
  return clean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const db = getDb();

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phoneNumber !== undefined) updates.phoneNumber = body.phoneNumber;
    if (body.community !== undefined) updates.community = body.community;
    if (body.block !== undefined) updates.block = body.block;
    if (body.flatNumber !== undefined) updates.flatNumber = body.flatNumber;
    if (body.vehicles !== undefined) updates.vehicles = body.vehicles;
    if (body.paymentFlags !== undefined) updates.paymentFlags = body.paymentFlags;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update in Firestore
    await db.collection('users').doc(userId).update(updates);

    // Sync with Firebase Auth if Auth fields are modified
    try {
      const authUpdates: Record<string, any> = {};
      if (body.name) authUpdates.displayName = body.name;
      if (body.email) authUpdates.email = body.email;
      if (body.phoneNumber) {
        const formatted = formatPhone(body.phoneNumber);
        if (formatted) authUpdates.phoneNumber = formatted;
      }

      if (Object.keys(authUpdates).length > 0) {
        await getAuth().updateUser(userId, authUpdates);
      }
    } catch (authError: any) {
      console.warn('Syncing user with Firebase Auth failed:', authError.message);
    }

    await writeAuditLog(
      'admin',
      'user_updated',
      userId,
      'user',
      `Updated user fields: ${JSON.stringify(Object.keys(updates))}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('User update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const db = getDb();

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // 1. Cascade delete bookings
    const bookingsSnap = await db.collection('bookings').where('userId', '==', userId).get();
    const bookingBatch = db.batch();
    bookingsSnap.docs.forEach((doc) => {
      bookingBatch.delete(doc.ref);
    });
    await bookingBatch.commit();

    // 2. Cascade delete payments
    const paymentsSnap = await db.collection('payments').where('userId', '==', userId).get();
    const paymentBatch = db.batch();
    paymentsSnap.docs.forEach((doc) => {
      paymentBatch.delete(doc.ref);
    });
    await paymentBatch.commit();

    // 3. Cascade delete invoices
    const invoicesSnap = await db.collection('invoices').where('userId', '==', userId).get();
    const invoiceBatch = db.batch();
    invoicesSnap.docs.forEach((doc) => {
      invoiceBatch.delete(doc.ref);
    });
    await invoiceBatch.commit();

    // 4. Delete Firestore User document
    await db.collection('users').doc(userId).delete();

    // 5. Delete from Firebase Auth
    try {
      await getAuth().deleteUser(userId);
    } catch (authError: any) {
      console.warn('Failed to delete user from Firebase Auth:', authError.message);
    }

    await writeAuditLog(
      'admin',
      'user_deleted',
      userId,
      'user',
      `Deleted user ${userData?.name} (${userData?.email}) and all associated records`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
