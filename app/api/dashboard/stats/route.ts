import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';
import { checkAndFlagOverdueInvoices } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run auto-overdue scanner (Issue 29) to ensure accuracy
    await checkAndFlagOverdueInvoices();

    const db = getDb();

    if (!enforceSuperAdmin(admin)) {
      // Dynamically calculate stats scoped to community admin's assignedCommunities (Issue 4)
      if (admin.assignedCommunities.length === 0) {
        return NextResponse.json({
          totalUsers: 0,
          activeBookings: 0,
          pendingPayments: 0,
          overdueBookings: 0,
          monthlyRevenue: 0,
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
            if (data.adminVerified === true && data.createdAt >= startOfMonth.getTime()) {
              monthlyRevenue += data.amount || 0;
            }
          });
        }
      }

      return NextResponse.json({
        totalUsers,
        activeBookings,
        pendingPayments,
        overdueBookings,
        monthlyRevenue,
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
        if (data.createdAt >= startOfMonth.getTime()) {
          monthlyRevenue += data.amount || 0;
        }
      });
    } catch (e) { console.error('Stats: monthly revenue failed', e); }

    return NextResponse.json({
      totalUsers,
      activeBookings,
      pendingPayments,
      overdueBookings,
      monthlyRevenue,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({
      totalUsers: 0,
      activeBookings: 0,
      pendingPayments: 0,
      overdueBookings: 0,
      monthlyRevenue: 0,
    });
  }
}
