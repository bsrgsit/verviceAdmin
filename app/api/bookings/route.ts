import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function GET() {
  try {
    const snapshot = await getDb().collection('bookings')
      .orderBy('startDate', 'desc')
      .get();

    const bookings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'Unknown';
        let userPhone = '';
        let community = '';

        if (data.userId) {
          const userDoc = await getDb().collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.name || 'Unknown';
            userPhone = userData?.phoneNumber || '';
            community = userData?.community || '';
          }
        }

        return {
          id: doc.id,
          ...data,
          userName,
          userPhone,
          community,
        };
      })
    );

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, vehicleName, vehicleReg, serviceName, price, startDate, paymentDueDate } = body;

    if (!userId || !vehicleReg || !serviceName || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required booking fields (userId, vehicleReg, serviceName, price)' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = Date.now();
    const newBooking = {
      userId,
      vehicleName: vehicleName || 'Unknown Vehicle',
      vehicleReg,
      serviceName,
      price: Number(price),
      status: 'active',
      paymentStatus: 'unpaid',
      startDate: startDate ? Number(startDate) : now,
      paymentDueDate: paymentDueDate ? Number(paymentDueDate) : now + (5 * 24 * 60 * 60 * 1000), // Default 5 days from now
      adminNotes: '',
      createdAt: now,
    };

    const docRef = await db.collection('bookings').add(newBooking);

    // 2. Write Audit Log
    await writeAuditLog(
      'admin',
      'booking_created',
      docRef.id,
      'booking',
      `Created booking ${docRef.id} for user ${userId} and vehicle ${vehicleReg}`
    );

    return NextResponse.json({ id: docRef.id, ...newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
