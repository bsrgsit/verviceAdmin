import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityParam = searchParams.get('community');
    const db = getDb();

    // 1. Fetch pending UPI payments
    const paymentsQuery = db.collection('payments')
      .where('status', '==', 'pending_manual_verify')
      .limit(50);

    // 2. Fetch pending driver requests
    const driversQuery = db.collection('driver_requests')
      .where('status', '==', 'pending')
      .limit(30);

    // 3. Fetch pending battery jumpstarts
    const batteriesQuery = db.collection('battery_requests')
      .where('status', '==', 'pending')
      .limit(30);

    // 4. Fetch open support tickets
    const ticketsQuery = db.collection('support_tickets')
      .where('status', '==', 'open')
      .limit(30);

    // 5. Fetch bookings with pending cancellation request
    const cancellationsQuery = db.collection('bookings')
      .where('cancellationRequest.status', '==', 'pending')
      .limit(50);

    const [paymentsSnap, driversSnap, batteriesSnap, ticketsSnap, cancellationsSnap] = await Promise.all([
      paymentsQuery.get().catch(() => ({ docs: [] })),
      driversQuery.get().catch(() => ({ docs: [] })),
      batteriesQuery.get().catch(() => ({ docs: [] })),
      ticketsQuery.get().catch(() => ({ docs: [] })),
      cancellationsQuery.get().catch(() => ({ docs: [] })),
    ]);

    // Batch resolve user details for all actionable items
    const allUserIds = new Set<string>();
    paymentsSnap.docs.forEach((d: any) => d.data().userId && allUserIds.add(d.data().userId));
    driversSnap.docs.forEach((d: any) => d.data().userId && allUserIds.add(d.data().userId));
    batteriesSnap.docs.forEach((d: any) => d.data().userId && allUserIds.add(d.data().userId));
    ticketsSnap.docs.forEach((d: any) => d.data().userId && allUserIds.add(d.data().userId));
    cancellationsSnap.docs.forEach((d: any) => d.data().userId && allUserIds.add(d.data().userId));

    const userMap = new Map<string, any>();
    if (allUserIds.size > 0) {
      const userRefs = Array.from(allUserIds).map(uid => db.collection('users').doc(uid));
      // Firestore getAll max chunk size is 500
      const chunks = [];
      for (let i = 0; i < userRefs.length; i += 300) {
        chunks.push(userRefs.slice(i, i + 300));
      }
      for (const chunk of chunks) {
        const snaps = await db.getAll(...chunk);
        snaps.forEach(snap => {
          if (snap.exists) userMap.set(snap.id, snap.data());
        });
      }
    }

    // Transform payments
    let pendingPayments = paymentsSnap.docs.map((doc: any) => {
      const data = doc.data();
      const user = userMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: user?.name || data.userName || 'Unknown Resident',
        userPhone: user?.phoneNumber || data.userPhone || '',
        community: user?.community || data.community || '',
        flatNumber: user?.flatNumber || '',
        createdAt: data.createdAt || data.timestamp || 0,
      };
    });

    // Transform cancellations
    let cancellationRequests = cancellationsSnap.docs.map((doc: any) => {
      const data = doc.data();
      const user = userMap.get(data.userId);
      return {
        id: doc.id,
        bookingId: doc.id,
        serviceName: data.serviceName || 'Car Wash Plan',
        vehicleReg: data.vehicleReg || '',
        vehicleName: data.vehicleName || '',
        reason: data.cancellationRequest?.reason || 'No reason provided',
        requestedAt: data.cancellationRequest?.requestedAt || data.updatedAt || Date.now(),
        userName: user?.name || 'Unknown Resident',
        userPhone: user?.phoneNumber || '',
        community: user?.community || data.community || '',
        flatNumber: user?.flatNumber || '',
        price: data.price || 0,
      };
    });

    // Transform driver requests
    let pendingDrivers = driversSnap.docs.map((doc: any) => {
      const data = doc.data();
      const user = userMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: user?.name || data.userName || 'Unknown Resident',
        userPhone: user?.phoneNumber || data.userPhone || '',
        community: user?.community || data.community || '',
        flatNumber: user?.flatNumber || '',
        timestamp: data.timestamp || data.createdAt || 0,
      };
    });

    // Transform battery requests
    let pendingBatteries = batteriesSnap.docs.map((doc: any) => {
      const data = doc.data();
      const user = userMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: user?.name || data.userName || 'Unknown Resident',
        userPhone: user?.phoneNumber || data.userPhone || '',
        community: user?.community || data.community || '',
        flatNumber: user?.flatNumber || '',
        timestamp: data.timestamp || data.createdAt || 0,
      };
    });

    // Transform support tickets
    let openTickets = ticketsSnap.docs.map((doc: any) => {
      const data = doc.data();
      const user = userMap.get(data.userId);
      return {
        id: doc.id,
        ...data,
        userName: user?.name || data.userName || 'Unknown Resident',
        userPhone: user?.phoneNumber || data.userPhone || '',
        community: user?.community || data.community || '',
        flatNumber: user?.flatNumber || '',
        createdAt: data.createdAt || data.timestamp || 0,
      };
    });

    // Community / Role filtering
    const filterByCommunity = (items: any[]) => {
      if (communityParam && communityParam !== 'ALL') {
        items = items.filter(i => 
          i.community === communityParam || 
          i.communityId === communityParam ||
          (i.community && i.community.toLowerCase() === communityParam.toLowerCase())
        );
      }
      if (!enforceSuperAdmin(admin)) {
        items = items.filter(i => admin.assignedCommunities.includes(i.community));
      }
      return items;
    };

    pendingPayments = filterByCommunity(pendingPayments);
    cancellationRequests = filterByCommunity(cancellationRequests);
    pendingDrivers = filterByCommunity(pendingDrivers);
    pendingBatteries = filterByCommunity(pendingBatteries);
    openTickets = filterByCommunity(openTickets);

    const totalUrgent =
      pendingPayments.length +
      cancellationRequests.length +
      pendingDrivers.length +
      pendingBatteries.length +
      openTickets.length;

    return NextResponse.json({
      totalUrgent,
      pendingPayments,
      cancellationRequests,
      pendingDrivers,
      pendingBatteries,
      openTickets,
    });
  } catch (error: any) {
    console.error('Action Inbox fetch error:', error);
    return NextResponse.json({
      totalUrgent: 0,
      pendingPayments: [],
      cancellationRequests: [],
      pendingDrivers: [],
      pendingBatteries: [],
      openTickets: [],
    });
  }
}
