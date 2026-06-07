import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin } from '@/lib/admin-check';

export async function POST(
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

    const partnerData = partnerDoc.data();
    const currentEntered = partnerData?.enteredCommunity || false;
    const nextEntered = !currentEntered;
    const nextEnteredAt = nextEntered ? Date.now() : 0;

    await db.collection('partners').doc(partnerId).update({
      enteredCommunity: nextEntered,
      enteredAt: nextEnteredAt,
    });

    // Find all active bookings assigned to this partner and update their partner status
    const bookingsSnap = await db.collection('bookings')
      .where('partnerId', '==', partnerId)
      .where('status', '==', 'active')
      .get();

    if (!bookingsSnap.empty) {
      const batch = db.batch();
      bookingsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          partnerStatus: nextEntered ? 'entered' : 'not_entered',
          partnerEnteredAt: nextEnteredAt,
        });
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      enteredCommunity: nextEntered,
      enteredAt: nextEnteredAt,
    });
  } catch (error: any) {
    console.error('Partner toggle entry error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
