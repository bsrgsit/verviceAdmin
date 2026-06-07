import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin } from '@/lib/admin-check';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerId = params.id;
    const body = await request.json();
    const db = getDb();

    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.phoneNumber !== undefined) updates.phoneNumber = body.phoneNumber;
    if (body.rating !== undefined) updates.rating = Number(body.rating);
    if (body.status !== undefined) updates.status = body.status;
    if (body.communities !== undefined && Array.isArray(body.communities)) {
      updates.communities = body.communities;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await db.collection('partners').doc(partnerId).update(updates);

    // Propagate name/phone/rating updates to active bookings assigned to this partner
    const partnerData = partnerDoc.data();
    const newName = updates.name !== undefined ? updates.name : partnerData?.name;
    const newPhone = updates.phoneNumber !== undefined ? updates.phoneNumber : partnerData?.phoneNumber;
    const newRating = updates.rating !== undefined ? updates.rating : partnerData?.rating;

    const bookingsSnap = await db.collection('bookings')
      .where('partnerId', '==', partnerId)
      .where('status', '==', 'active')
      .get();

    if (!bookingsSnap.empty) {
      const batch = db.batch();
      bookingsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          partnerName: newName,
          partnerPhone: newPhone,
          partnerRating: Number(newRating),
        });
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Partner update error:', error);
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

    const partnerId = params.id;
    const db = getDb();

    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    await db.collection('partners').doc(partnerId).delete();

    // Clear partner details from active bookings assigned to this partner
    const bookingsSnap = await db.collection('bookings')
      .where('partnerId', '==', partnerId)
      .where('status', '==', 'active')
      .get();

    if (!bookingsSnap.empty) {
      const batch = db.batch();
      bookingsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          partnerId: '',
          partnerName: '',
          partnerPhone: '',
          partnerRating: 0.0,
          partnerStatus: 'not_entered',
          partnerEnteredAt: 0,
        });
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Partner delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
