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

    // Try to resolve user info for missing users using support_tickets or battery_requests
    const missingUids = snapshot.docs
      .map(doc => doc.data().userId)
      .filter(uid => uid && !userMap.has(uid));
    
    const fallbackUserMap = new Map<string, { name: string; phone: string; community?: string }>();
    
    if (missingUids.length > 0) {
      const uniqueMissingUids = Array.from(new Set(missingUids));
      for (const uid of uniqueMissingUids) {
        let phone = '';
        let name = '';
        
        // Try support tickets
        const ticketSnap = await db.collection('support_tickets')
          .where('userId', '==', uid)
          .limit(1)
          .get();
        if (!ticketSnap.empty) {
          const tData = ticketSnap.docs[0].data();
          phone = tData.userPhone || '';
          name = tData.userName || '';
        }
        
        if (!phone) {
          // Try battery requests
          const batterySnap = await db.collection('battery_requests')
            .where('userId', '==', uid)
            .limit(1)
            .get();
          if (!batterySnap.empty) {
            const bData = batterySnap.docs[0].data();
            phone = bData.userPhone || '';
            name = bData.userName || '';
          }
        }
        
        if (phone) {
          // Search in users collection by phone number
          const phoneSnap = await db.collection('users')
            .where('phoneNumber', '==', phone)
            .limit(1)
            .get();
          if (!phoneSnap.empty) {
            const uData = phoneSnap.docs[0].data();
            fallbackUserMap.set(uid, {
              name: uData.name || name || 'Unknown User',
              phone: uData.phoneNumber || phone || '',
              community: uData.community || ''
            });
          } else {
            fallbackUserMap.set(uid, { name: name || 'Unknown User', phone });
          }
        }
      }
    }

    let requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId);
      const fallbackUserData = fallbackUserMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: userData?.name || fallbackUserData?.name || 'Unknown User',
        userPhone: userData?.phoneNumber || fallbackUserData?.phone || '',
        community: userData?.community || fallbackUserData?.community || data.community || data.communityId || 'N/A',
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
