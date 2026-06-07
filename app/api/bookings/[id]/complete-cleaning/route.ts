import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const db = getDb();

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingDoc.data();
    if (!bookingData) {
      return NextResponse.json({ error: 'Booking data not found' }, { status: 404 });
    }

    // Verify community admin owns this user / booking
    if (!await canAccessUser(admin, bookingData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate today's date in IST (Asia/Kolkata) Timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date()); // Returns YYYY-MM-DD

    const now = Date.now();
    const cleanId = `${bookingId}_${todayStr}`;

    const cleanRef = db.collection('daily_cleanings').doc(cleanId);
    const cleanDoc = await cleanRef.get();

    if (cleanDoc.exists) {
      return NextResponse.json(
        { error: 'Cleaning already completed for today' },
        { status: 400 }
      );
    }

    // Log the cleaning in daily_cleanings
    await cleanRef.set({
      bookingId,
      userId: bookingData.userId,
      partnerId: bookingData.partnerId || '',
      partnerName: bookingData.partnerName || '',
      vehicleReg: bookingData.vehicleReg || '',
      community: bookingData.community || '',
      date: todayStr,
      completedAt: now,
      createdAt: now,
    });

    // Update the booking doc
    await db.collection('bookings').doc(bookingId).update({
      lastCleanedDate: todayStr,
      lastCleanedAt: now,
    });

    await writeAuditLog(
      admin.email,
      'booking_cleaned_today',
      bookingId,
      'booking',
      `Marked daily cleaning complete for booking ${bookingId} on ${todayStr}`
    );

    return NextResponse.json({
      success: true,
      lastCleanedDate: todayStr,
      lastCleanedAt: now,
    });
  } catch (error: any) {
    console.error('Complete cleaning error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
