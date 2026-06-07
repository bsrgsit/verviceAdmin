import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin } from '@/lib/admin-check';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingIds, partnerId } = await request.json();

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json({ error: 'Missing booking IDs' }, { status: 400 });
    }

    const db = getDb();
    let partnerName = '';
    let partnerPhone = '';
    let partnerRating = 4.8;
    let partnerStatus = 'not_entered';
    let partnerEnteredAt = 0;

    if (partnerId) {
      const partnerDoc = await db.collection('partners').doc(partnerId).get();
      if (!partnerDoc.exists) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
      }
      const pData = partnerDoc.data();
      partnerName = pData?.name || '';
      partnerPhone = pData?.phoneNumber || '';
      partnerRating = pData?.rating || 4.8;
      partnerStatus = pData?.enteredCommunity ? 'entered' : 'not_entered';
      partnerEnteredAt = pData?.enteredAt || 0;
    }

    // Process updates in a batch
    const batch = db.batch();
    bookingIds.forEach((id) => {
      const ref = db.collection('bookings').doc(id);
      batch.update(ref, {
        partnerId,
        partnerName,
        partnerPhone,
        partnerRating,
        partnerStatus,
        partnerEnteredAt,
      });
    });

    await batch.commit();

    await writeAuditLog(
      admin.email,
      'bookings_bulk_assigned',
      'bulk',
      'booking',
      `Assigned partner ${partnerName || 'None'} to ${bookingIds.length} bookings`
    );

    return NextResponse.json({ success: true, count: bookingIds.length });
  } catch (error: any) {
    console.error('Bulk assign error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
