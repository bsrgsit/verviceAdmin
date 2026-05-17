import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const [
      usersSnapshot,
      bookingsSnapshot,
      paymentsSnapshot,
    ] = await Promise.all([
      getDb().collection('users').count().get(),
      getDb().collection('bookings').where('status', '==', 'active').count().get(),
      getDb().collection('payments').where('status', '==', 'pending_manual_verify').count().get(),
    ]);

    // Overdue bookings
    const now = Date.now();
    const overdueSnapshot = await getDb().collection('bookings')
      .where('paymentStatus', '==', 'overdue')
      .count()
      .get();

    // Monthly revenue (verified payments this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueSnapshot = await getDb().collection('payments')
      .where('adminVerified', '==', true)
      .where('createdAt', '>=', startOfMonth.getTime())
      .get();

    let monthlyRevenue = 0;
    revenueSnapshot.forEach((doc) => {
      monthlyRevenue += doc.data().amount || 0;
    });

    return NextResponse.json({
      totalUsers: usersSnapshot.data().count || 0,
      activeBookings: bookingsSnapshot.data().count || 0,
      pendingPayments: paymentsSnapshot.data().count || 0,
      overdueBookings: overdueSnapshot.data().count || 0,
      monthlyRevenue,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
