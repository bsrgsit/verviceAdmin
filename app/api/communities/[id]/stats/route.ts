import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    
    // Get community name
    const communityDoc = await db.collection('communities').doc(params.id).get();
    if (!communityDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }
    const communityData = communityDoc.data();
    const communityName = communityData?.name;

    // Get users in this community
    const usersSnapshot = await db.collection('users')
      .where('community', '==', communityName)
      .get();

    const userIds = usersSnapshot.docs.map((doc) => doc.id);
    const totalUsers = userIds.length;

    let activeBookings = 0;
    let pendingPayments = 0;
    let monthlyRevenue = 0;

    if (userIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      for (const chunk of chunks) {
        // Active bookings
        try {
          const bookSnap = await db.collection('bookings')
            .where('userId', 'in', chunk)
            .get();
          bookSnap.docs.forEach((doc) => {
            if (doc.data().status === 'active') {
              activeBookings++;
            }
          });
        } catch (e) {
          console.error('Stats active bookings query failed:', e);
        }

        // Payments & Monthly revenue
        try {
          const paySnap = await db.collection('payments')
            .where('userId', 'in', chunk)
            .get();
          paySnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'pending_manual_verify') {
              pendingPayments++;
            }
            if (data.adminVerified === true && data.createdAt >= startOfMonth.getTime()) {
              monthlyRevenue += data.amount || 0;
            }
          });
        } catch (e) {
          console.error('Stats payments query failed:', e);
        }
      }
    }

    return NextResponse.json({
      communityName,
      city: communityData?.city || '',
      blocks: communityData?.blocks || [],
      totalUnits: communityData?.totalUnits || 0,
      totalUsers,
      activeBookings,
      pendingPayments,
      monthlyRevenue,
    });
  } catch (error: any) {
    console.error('Community stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
