import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, enforceSuperAdmin, canAccessUser } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');
    const targetSearch = searchParams.get('search');

    const db = getDb();
    
    // 1. Fetch standard recent bookings
    const snapshot = await db.collection('bookings')
      .orderBy('startDate', 'desc')
      .limit(200)
      .get();

    const docMap = new Map<string, any>();
    snapshot.docs.forEach((d) => docMap.set(d.id, d));

    // 2. If a specific booking ID is requested, make sure it is fetched
    if (targetId && !docMap.has(targetId)) {
      try {
        const directDoc = await db.collection('bookings').doc(targetId).get();
        if (directDoc.exists) {
          docMap.set(directDoc.id, directDoc);
        }
      } catch (e) {
        console.error('Direct booking fetch failed:', e);
      }
    }

    // 3. If a target vehicleReg/search is requested, also query by vehicleReg directly
    if (targetSearch && targetSearch.trim().length >= 2) {
      const qClean = targetSearch.trim();
      const qUpper = qClean.toUpperCase();
      const qNorm = qClean.replace(/[\s-]/g, '').toUpperCase();

      const queries = [
        db.collection('bookings').where('vehicleReg', '==', qClean).limit(10).get(),
        db.collection('bookings').where('vehicleReg', '==', qUpper).limit(10).get(),
      ];
      if (qNorm !== qUpper) {
        queries.push(db.collection('bookings').where('vehicleReg', '==', qNorm).limit(10).get());
      }

      const results = await Promise.all(queries.map(q => q.catch(() => ({ docs: [] }))));
      results.forEach(res => {
        res.docs.forEach((d: any) => {
          if (!docMap.has(d.id)) {
            docMap.set(d.id, d);
          }
        });
      });
    }

    const allDocs = Array.from(docMap.values());

    // Batch fetch users in a single roundtrip to solve N+1 reads
    const userIds = Array.from(new Set(allDocs.map(doc => doc.data()?.userId).filter(Boolean)));
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

    let bookings = allDocs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data?.userId);
      return {
        id: doc.id,
        ...data,
        userName: userData?.name || 'Unknown',
        userPhone: userData?.phoneNumber || '',
        community: userData?.community || data?.community || '',
      };
    });

    // If targetId or targetSearch was requested, put matches at the very top of the array
    if (targetId || targetSearch) {
      const normSearch = (targetSearch || '').replace(/[\s-]/g, '').toLowerCase();
      bookings.sort((a, b) => {
        const aIsTarget = (targetId && a.id === targetId) || (normSearch && (a.vehicleReg || '').replace(/[\s-]/g, '').toLowerCase() === normSearch);
        const bIsTarget = (targetId && b.id === targetId) || (normSearch && (b.vehicleReg || '').replace(/[\s-]/g, '').toLowerCase() === normSearch);
        if (aIsTarget && !bIsTarget) return -1;
        if (!aIsTarget && bIsTarget) return 1;
        return (b.startDate || 0) - (a.startDate || 0);
      });
    }

    // Enforce role-based access control based on assignedCommunities
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
