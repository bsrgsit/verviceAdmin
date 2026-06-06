import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    // Each query in its own try/catch for resilience
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
