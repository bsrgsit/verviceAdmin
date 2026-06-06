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
    // Enforce sensible query limit to prevent database scaling cost blowups (Issue 6)
    const snapshot = await db.collection('payments')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    // Check for duplicate transaction IDs
    const txnIdCounts = new Map<string, number>();
    snapshot.forEach((doc) => {
      const txnId = doc.data().upiTransactionId;
      if (txnId) {
        txnIdCounts.set(txnId, (txnIdCounts.get(txnId) || 0) + 1);
      }
    });

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
        userPhone: userData?.phoneNumber || '',
        community: userData?.community || '',
        duplicate: data.upiTransactionId
          ? (txnIdCounts.get(data.upiTransactionId) || 0) > 1
          : false,
      };
    });

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!enforceSuperAdmin(admin)) {
      payments = payments.filter((p: any) => admin.assignedCommunities.includes(p.community));
    }

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, bookingId, amount, upiAppName, upiTransactionId, status, adminVerified, adminNotes, createdAt } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment fields (userId, amount)' },
        { status: 400 }
      );
    }

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!await canAccessUser(admin, userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = getDb();
    const now = Date.now();

    const newPayment = {
      userId,
      bookingId: bookingId || '',
      amount: Number(amount),
      upiAppName: upiAppName || 'Manual Collection',
      upiTransactionId: upiTransactionId || '',
      status: status || 'pending_manual_verify',
      adminVerified: adminVerified === undefined ? false : !!adminVerified,
      adminNotes: adminNotes || '',
      createdAt: createdAt ? Number(createdAt) : now,
    };

    const docRef = await db.collection('payments').add(newPayment);

    // Write Audit Log
    await writeAuditLog(
      admin.email,
      'payment_created',
      docRef.id,
      'payment',
      `Recorded manual payment of ${amount} INR for user ${userId}`
    );

    return NextResponse.json({ id: docRef.id, ...newPayment }, { status: 201 });
  } catch (error: any) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
