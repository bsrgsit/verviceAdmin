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
    const snapshot = await db.collection('battery_requests')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    // Fetch user mappings to populate user details and community info
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

    let requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: userData?.name || data.userName || 'Unknown User',
        userPhone: userData?.phoneNumber || data.userPhone || '',
        community: userData?.community || data.community || 'N/A',
      };
    });

    // Enforce role-based access control based on assignedCommunities
    if (!enforceSuperAdmin(admin)) {
      requests = requests.filter((r: any) => admin.assignedCommunities.includes(r.community));
    }

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Battery requests fetch error:', error);
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
    const { userId, vehicleName, vehicleReg, batteryType, price, notes } = body;

    if (!userId || !batteryType) {
      return NextResponse.json(
        { error: 'Missing required battery request fields (userId, batteryType)' },
        { status: 400 }
      );
    }

    if (!await canAccessUser(admin, userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const now = Date.now();
    const newRequest = {
      userId,
      userName: userData?.name || 'Unknown',
      userPhone: userData?.phoneNumber || '',
      community: userData?.community || 'N/A',
      vehicleName: vehicleName || 'Unknown Vehicle',
      vehicleReg: vehicleReg || 'N/A',
      batteryType,
      price: price ? Number(price) : 0,
      notes: notes || '',
      status: 'Requested',
      createdAt: now,
    };

    const docRef = await db.collection('battery_requests').add(newRequest);

    // Audit log entry
    await writeAuditLog(
      admin.email,
      'battery_request_created',
      docRef.id,
      'battery_request',
      `Created battery request ${docRef.id} for user ${userId}`
    );

    return NextResponse.json({ id: docRef.id, ...newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Battery request create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
