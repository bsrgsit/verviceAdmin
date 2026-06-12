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
    const { status, notes, price, technicianName, technicianPhone } = body;

    const db = getDb();
    const docRef = db.collection('battery_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = doc.data() || {};

    // Check community access for community admins
    if (!await canAccessUser(admin, requestData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (price !== undefined) updates.price = Number(price);
    if (technicianName !== undefined) updates.technicianName = technicianName;
    if (technicianPhone !== undefined) updates.technicianPhone = technicianPhone;
    updates.updatedAt = Date.now();

    await docRef.update(updates);

    await writeAuditLog(
      admin.email,
      'battery_request_updated',
      id,
      'battery_request',
      `Updated battery request ${id}: ${JSON.stringify(updates)}`
    );

    return NextResponse.json({ id, ...requestData, ...updates });
  } catch (error: any) {
    console.error('Battery request patch error:', error);
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
    const docRef = db.collection('battery_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = doc.data() || {};

    if (!await canAccessUser(admin, requestData.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await docRef.delete();

    await writeAuditLog(
      admin.email,
      'battery_request_deleted',
      id,
      'battery_request',
      `Deleted battery request ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Battery request delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
