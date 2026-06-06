import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';

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

    if (!await canAccessUser(admin, bookingData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { notes } = await request.json();
    await db.collection('bookings').doc(bookingId).update({ adminNotes: notes });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
