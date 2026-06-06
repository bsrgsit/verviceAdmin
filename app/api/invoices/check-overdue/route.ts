import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, canAccessUser } from '@/lib/admin-check';

export async function POST() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const now = Date.now();

    // 1. Query all pending invoices
    const invoicesSnap = await db.collection('invoices')
      .where('status', '==', 'pending')
      .get();

    let updatedCount = 0;
    const batch = db.batch();

    for (const doc of invoicesSnap.docs) {
      const data = doc.data();
      const dueDate = data.dueDate || 0;

      // If due date has passed
      if (dueDate < now) {
        // Enforce role-based access control based on assignedCommunities (Issue 4)
        if (!await canAccessUser(admin, data.userId)) {
          continue;
        }

        // Mark invoice as overdue
        batch.update(doc.ref, { status: 'overdue' });

        // Update corresponding subscription status to overdue
        if (data.subscriptionId) {
          const subRef = db.collection('bookings').doc(data.subscriptionId);
          batch.update(subRef, { paymentStatus: 'overdue' });
        }

        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
      await writeAuditLog(
        admin.email,
        'invoices_marked_overdue',
        'bulk',
        'invoice',
        `Manually executed overdue check: marked ${updatedCount} invoices and subscriptions as overdue`
      );
    }

    return NextResponse.json({
      message: `Overdue scan completed successfully`,
      updated: updatedCount
    });
  } catch (error: any) {
    console.error('Check overdue billing API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
