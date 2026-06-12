import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';
import { checkAndFlagOverdueInvoices } from '@/lib/db-helpers';
import { getMillis } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run auto-overdue scanner to ensure accuracy
    await checkAndFlagOverdueInvoices();

    const db = getDb();

    if (!enforceSuperAdmin(admin)) {
      // Dynamically calculate stats scoped to community admin's assignedCommunities
      if (admin.assignedCommunities.length === 0) {
        return NextResponse.json({
          totalUsers: 0,
          activeBookings: 0,
          pendingPayments: 0,
          overdueBookings: 0,
          monthlyRevenue: 0,
          pendingBatteryRequests: 0,
          pendingDriverRequests: 0,
          openSupportTickets: 0,
        });
      }

      // Fetch users belonging to assigned communities
      const userDocs: any[] = [];
      const communityChunks = [];
      for (let i = 0; i < admin.assignedCommunities.length; i += 30) {
        communityChunks.push(admin.assignedCommunities.slice(i, i + 30));
      }
      for (const chunk of communityChunks) {
        const snap = await db.collection('users').where('community', 'in', chunk).get();
        userDocs.push(...snap.docs);
      }

      const totalUsers = userDocs.length;
      const userIds = userDocs.map(doc => doc.id);

      let activeBookings = 0;
      let overdueBookings = 0;
      let pendingPayments = 0;
      let monthlyRevenue = 0;
      let pendingBatteryRequests = 0;
      let pendingDriverRequests = 0;
      let openSupportTickets = 0;

      if (userIds.length > 0) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const uidChunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
          uidChunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of uidChunks) {
          // Fetch bookings for these users
          const bookingsSnap = await db.collection('bookings').where('userId', 'in', chunk).get();
          bookingsSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'active') activeBookings++;
            if (data.paymentStatus === 'overdue') overdueBookings++;
          });

          // Fetch payments for these users
          const paymentsSnap = await db.collection('payments').where('userId', 'in', chunk).get();
          paymentsSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'pending_manual_verify') pendingPayments++;
            const createdAtMillis = getMillis(data.createdAt);
            if (data.adminVerified === true && createdAtMillis >= startOfMonth.getTime()) {
              monthlyRevenue += Number(data.amount) || 0;
            }
          });

          // Fetch battery requests for these users
          try {
            const batterySnap = await db.collection('battery_requests').where('userId', 'in', chunk).get();
            batterySnap.docs.forEach((doc) => {
              const status = doc.data().status;
              if (status === 'Requested' || status === 'In Progress') pendingBatteryRequests++;
            });
          } catch (e) { console.error('Stats: battery requests failed for chunk', e); }

          // Fetch driver requests for these users
          try {
            const driverSnap = await db.collection('driver_requests').where('userId', 'in', chunk).get();
            driverSnap.docs.forEach((doc) => {
              const status = doc.data().status;
              if (status === 'Requested' || status === 'Driver Assigned') pendingDriverRequests++;
            });
          } catch (e) { console.error('Stats: driver requests failed for chunk', e); }

          // Fetch support tickets for these users
          try {
            const supportSnap = await db.collection('support_tickets').where('userId', 'in', chunk).get();
            supportSnap.docs.forEach((doc) => {
              const status = doc.data().status;
              if (status === 'open' || status === 'in_progress') openSupportTickets++;
            });
          } catch (e) { console.error('Stats: support tickets failed for chunk', e); }
        }
      }

      return NextResponse.json({
        totalUsers,
        activeBookings,
        pendingPayments,
        overdueBookings,
        monthlyRevenue,
        pendingBatteryRequests,
        pendingDriverRequests,
        openSupportTickets,
      });
    }

    // Global Stats for Super Admin
    let totalUsers = 0;
    try {
      const snap = await db.collection('users').count().get();
      totalUsers = snap.data().count;
    } catch (e) { console.error('Stats: users count failed', e); }

    let activeBookings = 0;
    try {
      const snap = await db.collection('bookings').where('status', '==', 'active').count().get();
      activeBookings = snap.data().count;
    } catch (e) { console.error('Stats: active bookings count failed', e); }

    let pendingPayments = 0;
    try {
      const snap = await db.collection('payments').where('status', '==', 'pending_manual_verify').count().get();
      pendingPayments = snap.data().count;
    } catch (e) { console.error('Stats: pending payments count failed', e); }

    let overdueBookings = 0;
    try {
      const snap = await db.collection('bookings').where('paymentStatus', '==', 'overdue').count().get();
      overdueBookings = snap.data().count;
    } catch (e) { console.error('Stats: overdue bookings count failed', e); }

    let monthlyRevenue = 0;
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const snap = await db.collection('payments')
        .where('adminVerified', '==', true)
        .get();
      snap.forEach((doc) => {
        const data = doc.data();
        const createdAtMillis = getMillis(data.createdAt);
        if (createdAtMillis >= startOfMonth.getTime()) {
          monthlyRevenue += Number(data.amount) || 0;
        }
      });
    } catch (e) { console.error('Stats: monthly revenue failed', e); }

    // Battery Requests
    let pendingBatteryRequests = 0;
    try {
      const snap1 = await db.collection('battery_requests').where('status', '==', 'Requested').count().get();
      const snap2 = await db.collection('battery_requests').where('status', '==', 'In Progress').count().get();
      pendingBatteryRequests = snap1.data().count + snap2.data().count;
    } catch (e) { console.error('Stats: pending battery requests failed', e); }

    // Driver Requests
    let pendingDriverRequests = 0;
    try {
      const snap1 = await db.collection('driver_requests').where('status', '==', 'Requested').count().get();
      const snap2 = await db.collection('driver_requests').where('status', '==', 'Driver Assigned').count().get();
      pendingDriverRequests = snap1.data().count + snap2.data().count;
    } catch (e) { console.error('Stats: pending driver requests failed', e); }

    // Support Tickets
    let openSupportTickets = 0;
    try {
      const snap1 = await db.collection('support_tickets').where('status', '==', 'open').count().get();
      const snap2 = await db.collection('support_tickets').where('status', '==', 'in_progress').count().get();
      openSupportTickets = snap1.data().count + snap2.data().count;
    } catch (e) { console.error('Stats: open support tickets failed', e); }

    return NextResponse.json({
      totalUsers,
      activeBookings,
      pendingPayments,
      overdueBookings,
      monthlyRevenue,
      pendingBatteryRequests,
      pendingDriverRequests,
      openSupportTickets,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({
      totalUsers: 0,
      activeBookings: 0,
      pendingPayments: 0,
      overdueBookings: 0,
      monthlyRevenue: 0,
      pendingBatteryRequests: 0,
      pendingDriverRequests: 0,
      openSupportTickets: 0,
    });
  }
}
