import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog, getAuthenticatedAdmin, enforceSuperAdmin, canAccessUser } from '@/lib/admin-check';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, resolutionNotes } = body;

    const db = getDb();
    const docRef = db.collection('support_tickets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticketData = doc.data() || {};

    // Check community access for community admins
    if (!await canAccessUser(admin, ticketData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (resolutionNotes !== undefined) updates.resolutionNotes = resolutionNotes;
    updates.updatedAt = Date.now();

    await docRef.update(updates);

    await writeAuditLog(
      admin.email,
      'support_ticket_updated',
      id,
      'support_ticket',
      `Updated support ticket ${id}: ${JSON.stringify(updates)}`
    );

    return NextResponse.json({ id, ...ticketData, ...updates });
  } catch (error: any) {
    console.error('Support ticket patch error:', error);
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

    const { id } = params;
    const db = getDb();
    const docRef = db.collection('support_tickets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticketData = doc.data() || {};

    if (!await canAccessUser(admin, ticketData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await docRef.delete();

    await writeAuditLog(
      admin.email,
      'support_ticket_deleted',
      id,
      'support_ticket',
      `Deleted support ticket ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Support ticket delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
