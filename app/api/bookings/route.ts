import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, enforceSuperAdmin, canAccessUser } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    // Enforce sensible query limit to prevent database scaling cost blowups (Issue 6)
    const snapshot = await db.collection('bookings')
      .orderBy('startDate', 'desc')
      .limit(200)
      .get();

    // Batch fetch users in a single roundtrip to solve N+1 reads (Issue 5)
    const userIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().userId).filter(Boolean)));
    const userMap = new Map<string, any>();
    
    if (userIds.length > 0) {
      const userRefs = userIds.map(uid => db.collection('users').doc(uid));
      const userSnaps = await db.getAll(...userRefs);
      userSnaps.forEach((userDoc) => {
        if (userDoc.exists) {
          userMap.set(userDoc.id, userDoc.data());
        }
      });
    }

    let bookings = snapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: userData?.name || 'Unknown',
        userPhone: userData?.phoneNumber || '',
        community: userData?.community || '',
      };
    });

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!enforceSuperAdmin(admin)) {
      bookings = bookings.filter((b: any) => admin.assignedCommunities.includes(b.community));
    }

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, vehicleName, vehicleReg, serviceName, serviceType, description, price, startDate, paymentDueDate } = body;

    if (!userId || !vehicleReg || !serviceName || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required booking fields (userId, vehicleReg, serviceName, price)' },
        { status: 400 }
      );
    }

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!await canAccessUser(admin, userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = getDb();

    // Verify user exists
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
      serviceType: serviceType || 'monthly',
      description: description || '',
      price: Number(price),
      status: 'active',
      paymentStatus: 'unpaid',
      startDate: startDate ? Number(startDate) : now,
      paymentDueDate: paymentDueDate ? Number(paymentDueDate) : now + (5 * 24 * 60 * 60 * 1000), // Default 5 days from now
      adminNotes: '',
      createdAt: now,
    };

    const docRef = await db.collection('bookings').add(newBooking);

    // Write Audit Log
    await writeAuditLog(
      admin.email,
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
