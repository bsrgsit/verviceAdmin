import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import {
  writeAuditLog,
  getAuthenticatedAdmin,
  enforceSuperAdmin,
  canAccessCommunityById,
} from '@/lib/admin-check';
import {
  getUsersInCommunity,
  checkAndFlagOverdueInvoices,
} from '@/lib/db-helpers';
import { getMillis } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!await canAccessCommunityById(admin, params.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Run auto-overdue scanner to ensure data correctness
    await checkAndFlagOverdueInvoices();

    // Fetch community and users in a single query
    const { communityName, communityData, users, userIds, userMap } = await getUsersInCommunity(params.id);
    if (!communityName || !communityData) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Fetch bookings, payments, and invoices in chunks
    const bookings: any[] = [];
    const payments: any[] = [];
    const invoices: any[] = [];

    if (userIds.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
      }

      const db = getDb();
      for (const chunk of chunks) {
        // Bookings
        const bookingsSnap = await db.collection('bookings').where('userId', 'in', chunk).get();
        bookingsSnap.docs.forEach((doc) => {
          const data = doc.data();
          const user = userMap.get(data.userId) || { name: 'Unknown', phoneNumber: '' };
          bookings.push({
            id: doc.id,
            ...data,
            userName: user.name,
            userPhone: user.phoneNumber,
            community: communityName,
          });
        });

        // Payments
        const paymentsSnap = await db.collection('payments').where('userId', 'in', chunk).get();
        paymentsSnap.docs.forEach((doc) => {
          const data = doc.data();
          const user = userMap.get(data.userId) || { name: 'Unknown', phoneNumber: '' };
          
          // Check duplicate UPI transaction ID
          payments.push({
            id: doc.id,
            ...data,
            userName: user.name,
            userPhone: user.phoneNumber,
          });
        });

        // Invoices
        const invoicesSnap = await db.collection('invoices').where('userId', 'in', chunk).get();
        invoicesSnap.docs.forEach((doc) => {
          const data = doc.data();
          const user = userMap.get(data.userId) || { name: 'Unknown', phoneNumber: '' };
          invoices.push({
            id: doc.id,
            ...data,
            userName: user.name,
            userPhone: user.phoneNumber,
          });
        });
      }
    }

    // Check duplicate payments
    const txnIdCounts = new Map<string, number>();
    payments.forEach((p) => {
      if (p.upiTransactionId) {
        txnIdCounts.set(p.upiTransactionId, (txnIdCounts.get(p.upiTransactionId) || 0) + 1);
      }
    });
    payments.forEach((p) => {
      p.duplicate = p.upiTransactionId
        ? (txnIdCounts.get(p.upiTransactionId) || 0) > 1
        : false;
    });

    // Sort in-memory
    bookings.sort((a, b) => (b.startDate || 0) - (a.startDate || 0));
    payments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    invoices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Calculate metrics
    const totalUsers = users.length;
    let activeBookings = 0;
    let pendingPayments = 0;
    let monthlyRevenue = 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    bookings.forEach((b) => {
      if (b.status === 'active') activeBookings++;
    });

    payments.forEach((p) => {
      if (p.status === 'pending_manual_verify') pendingPayments++;
      const createdAtMillis = getMillis(p.createdAt);
      if (p.adminVerified === true && createdAtMillis >= startOfMonth.getTime()) {
        monthlyRevenue += Number(p.amount) || 0;
      }
    });

    const stats = {
      communityName,
      city: communityData.city || '',
      blocks: communityData.blocks || [],
      totalUnits: communityData.totalUnits || 0,
      totalUsers,
      activeBookings,
      pendingPayments,
      monthlyRevenue,
    };

    return NextResponse.json({
      stats,
      users,
      bookings,
      payments,
      invoices,
    });
  } catch (error: any) {
    console.error('Consolidated community fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!enforceSuperAdmin(admin)) {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const data = await request.json();
    await getDb().collection('communities').doc(params.id).update(data);
    
    await writeAuditLog(
      admin.email,
      'community_updated',
      params.id,
      'community',
      `Updated community details: ${JSON.stringify(Object.keys(data))}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!enforceSuperAdmin(admin)) {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const communityId = params.id;
    const db = getDb();

    // 1. Fetch community details
    const communityDoc = await db.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const communityName = communityDoc.data()?.name;

    if (communityName) {
      // 2. Check for registered users in this community
      const usersSnap = await db.collection('users')
        .where('community', '==', communityName)
        .limit(1)
        .get();

      if (!usersSnap.empty) {
        return NextResponse.json(
          { error: 'Cannot delete community because it has registered users. Reassign or delete those users first.' },
          { status: 400 }
        );
      }
    }

    // 3. Delete community document
    await db.collection('communities').doc(communityId).delete();

    // 4. Write Audit Log
    await writeAuditLog(
      admin.email,
      'community_deleted',
      communityId,
      'community',
      `Deleted community ${communityName}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Community delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
