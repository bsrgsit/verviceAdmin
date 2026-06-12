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
    const snapshot = await db.collection('support_tickets')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    // Fetch user details to determine community mapping for each ticket
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

    // Collect phone numbers for users that weren't found by UID or don't have a community
    const missingPhoneTickets = snapshot.docs.filter(doc => {
      const data = doc.data();
      const userData = userMap.get(data.userId);
      return (!userData || !userData.community) && data.userPhone;
    });

    const fallbackPhones = Array.from(new Set(missingPhoneTickets.map(doc => doc.data().userPhone).filter(Boolean)));
    const phoneMap = new Map<string, any>();

    if (fallbackPhones.length > 0) {
      // Query users collection by phoneNumber in chunks of 30 (Firestore in limits)
      for (let i = 0; i < fallbackPhones.length; i += 30) {
        const chunk = fallbackPhones.slice(i, i + 30);
        const phoneSnap = await db.collection('users')
          .where('phoneNumber', 'in', chunk)
          .get();
        phoneSnap.docs.forEach((userDoc) => {
          const uData = userDoc.data();
          if (uData && uData.phoneNumber) {
            phoneMap.set(uData.phoneNumber, uData);
          }
        });
      }
    }

    let tickets = snapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId) || (data.userPhone ? phoneMap.get(data.userPhone) : null);
      return {
        id: doc.id,
        ...data,
        userName: userData?.name || data.userName || 'Unknown User',
        userPhone: userData?.phoneNumber || data.userPhone || '',
        userEmail: userData?.email || data.userEmail || '',
        community: userData?.community || data.community || 'N/A',
      };
    });

    // Enforce role-based access control based on assignedCommunities
    if (!enforceSuperAdmin(admin)) {
      tickets = tickets.filter((t: any) => admin.assignedCommunities.includes(t.community));
    }

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error('Support tickets fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
