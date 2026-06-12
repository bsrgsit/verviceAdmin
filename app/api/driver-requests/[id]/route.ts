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
    const { status, notes, driverName, driverPhone, driverRating } = body;

    const db = getDb();
    const docRef = db.collection('driver_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = doc.data() || {};

    // Check community access for community admins
    const community = requestData.community || requestData.communityId || 'N/A';
    if (!enforceSuperAdmin(admin) && !admin.assignedCommunities.includes(community)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (driverName !== undefined) updates.driverName = driverName;
    if (driverPhone !== undefined) updates.driverPhone = driverPhone;
    if (driverRating !== undefined) updates.driverRating = Number(driverRating);
    updates.updatedAt = Date.now();

    await docRef.update(updates);

    await writeAuditLog(
      admin.email,
      'driver_request_updated',
      id,
      'driver_request',
      `Updated driver request ${id}: ${JSON.stringify(updates)}`
    );

    return NextResponse.json({ id, ...requestData, ...updates });
  } catch (error: any) {
    console.error('Driver request patch error:', error);
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
    const docRef = db.collection('driver_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = doc.data() || {};

    const community = requestData.community || requestData.communityId || 'N/A';
    if (!enforceSuperAdmin(admin) && !admin.assignedCommunities.includes(community)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await docRef.delete();

    await writeAuditLog(
      admin.email,
      'driver_request_deleted',
      id,
      'driver_request',
      `Deleted driver request ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Driver request delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
