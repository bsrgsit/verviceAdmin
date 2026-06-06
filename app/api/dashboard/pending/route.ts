import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    // Enforce sensible query limit to prevent database scaling cost blowups (Issue 6)
    const snapshot = await db.collection('payments')
      .where('status', '==', 'pending_manual_verify')
      .limit(100)
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

    let payments = snapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId);

      return {
        id: doc.id,
        ...data,
        userName: userData?.name || 'Unknown',
        community: userData?.community || '',
      };
    });

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!enforceSuperAdmin(admin)) {
      payments = payments.filter((p) => admin.assignedCommunities.includes(p.community));
    }

    // Sort by createdAt in memory
    payments.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json(payments.slice(0, 10));
  } catch (error: any) {
    console.error('Pending payments error:', error);
    return NextResponse.json([]);
  }
}
