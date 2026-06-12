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
    const snapshot = await db.collection('driver_requests')
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();

    // Fetch user details to populate user details and community info
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
        userName: userData?.name || 'Unknown User',
        userPhone: userData?.phoneNumber || '',
        community: userData?.community || 'N/A',
      };
    });

    // Enforce role-based access control based on assignedCommunities
    if (!enforceSuperAdmin(admin)) {
      requests = requests.filter((r: any) => admin.assignedCommunities.includes(r.community));
    }

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Driver requests fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
