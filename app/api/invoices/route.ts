import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, enforceSuperAdmin, canAccessUser } from '@/lib/admin-check';
import { generateInvoiceNumber, checkAndFlagOverdueInvoices } from '@/lib/db-helpers';

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
    // Enforce sensible query limit to prevent database scaling cost blowups (Issue 6)
    const snapshot = await db.collection('invoices')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

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

    let invoices = snapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId);

      return {
        id: doc.id,
        ...data,
        userName: userData?.name || 'Unknown',
        userPhone: userData?.phoneNumber || '',
        userCommunity: userData?.community || 'Unassigned',
      };
    });

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!enforceSuperAdmin(admin)) {
      invoices = invoices.filter((i: any) => admin.assignedCommunities.includes(i.userCommunity));
    }

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Invoices fetch error:', error);
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
    const {
      subscriptionId,
      userId,
      amount,
      billingMonth,
      dueDate,
      serviceName,
      vehicleReg,
    } = body;

    if (!subscriptionId || !userId || !amount || !billingMonth || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required invoice fields' },
        { status: 400 }
      );
    }

    // Enforce role-based access control based on assignedCommunities (Issue 4)
    if (!await canAccessUser(admin, userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = getDb();
    
    // Get cycle number
    const subInvoices = await db.collection('invoices')
      .where('subscriptionId', '==', subscriptionId)
      .get();
    const cycleNumber = subInvoices.size + 1;

    // Generate invoice number using helper to avoid duplication (Issue 8)
    const invoiceNumber = generateInvoiceNumber(subscriptionId, cycleNumber);

    const now = Date.now();
    const newInvoice = {
      subscriptionId,
      userId,
      amount: Number(amount),
      currency: 'INR',
      billingMonth,
      dueDate: Number(dueDate),
      status: 'pending',
      invoiceNumber,
      cycleNumber,
      createdAt: now,
      paidAt: 0,
      paymentTransactionId: '',
      serviceName: serviceName || '',
      vehicleReg: vehicleReg || '',
      billingCycleStart: now,
      billingCycleEnd: now,
    };

    const docRef = await db.collection('invoices').add(newInvoice);

    // Write Audit Log
    await writeAuditLog(
      admin.email,
      'invoice_created',
      docRef.id,
      'invoice',
      `Manually created invoice ${invoiceNumber} of ${amount} INR for subscription ${subscriptionId}`
    );

    return NextResponse.json({ id: docRef.id, ...newInvoice });
  } catch (error: any) {
    console.error('Invoice create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
