import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';
import { generateInvoiceNumber } from '@/lib/db-helpers';

export async function POST() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date();

    // Calculate previous month
    let month = now.getMonth(); // 0-indexed (e.g., June is 5)
    let year = now.getFullYear();
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    // Month is now 1-indexed (1-12) representing the previous calendar month
    const billingMonth = `${year}-${String(month).padStart(2, '0')}`;

    // Calculate billing cycle boundaries
    const billingCycleStart = new Date(year, month - 1, 1, 0, 0, 0, 0).getTime();
    const billingCycleEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    // Due date is the 5th of the current month (next month relative to billing cycle)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 5, 23, 59, 59, 999).getTime();

    console.log(`Manual Invoicing: running for month ${billingMonth}`);

    // 1. Get all active subscriptions
    const bookingsSnap = await db.collection('bookings')
      .where('status', '==', 'active')
      .get();

    if (bookingsSnap.empty) {
      return NextResponse.json({ message: 'No active subscriptions found', created: 0 });
    }

    // 2. Get existing invoices for this month to avoid duplicates
    const existingSnap = await db.collection('invoices')
      .where('billingMonth', '==', billingMonth)
      .get();

    const existingSubIds = new Set<string>();
    existingSnap.forEach((doc) => {
      const data = doc.data();
      if (data.subscriptionId) {
        existingSubIds.add(data.subscriptionId);
      }
    });

    let created = 0;
    let skipped = 0;
    const batch = db.batch();

    for (const doc of bookingsSnap.docs) {
      const sub = doc.data();
      const subId = doc.id;

      // Enforce role-based access control based on assignedCommunities (Issue 4)
      if (!await canAccessUser(admin, sub.userId)) {
        continue;
      }

      // Skip if invoice already generated for this subscription
      if (existingSubIds.has(subId)) {
        skipped++;
        continue;
      }

      // Skip if subscription started after this billing month ended
      const startDate = sub.startDate || 0;
      if (startDate > billingCycleEnd) {
        skipped++;
        continue;
      }

      // Get billing cycle number
      const subInvoices = await db.collection('invoices')
        .where('subscriptionId', '==', subId)
        .get();
      const cycleNumber = subInvoices.size + 1;

      // Generate invoice number using helper to avoid duplication (Issue 8)
      const invoiceNumber = generateInvoiceNumber(subId, cycleNumber, now);

      const newInvoice = {
        subscriptionId: subId,
        userId: sub.userId || '',
        amount: Number(sub.price || 0),
        currency: 'INR',
        billingMonth,
        dueDate,
        status: 'pending',
        invoiceNumber,
        cycleNumber,
        createdAt: now.getTime(),
        paidAt: 0,
        paymentTransactionId: '',
        serviceName: sub.serviceName || '',
        vehicleReg: sub.vehicleReg || '',
        billingCycleStart,
        billingCycleEnd,
      };

      const invoiceRef = db.collection('invoices').doc();
      batch.set(invoiceRef, newInvoice);
      created++;
    }

    if (created > 0) {
      await batch.commit();
      await writeAuditLog(
        admin.email,
        'invoices_auto_generated',
        'bulk',
        'invoice',
        `Manually executed monthly invoice generation: created ${created} invoices for ${billingMonth}`
      );
    }

    return NextResponse.json({
      message: `Invoices generated successfully`,
      created,
      skipped,
      billingMonth
    });
  } catch (error: any) {
    console.error('Run monthly billing API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
