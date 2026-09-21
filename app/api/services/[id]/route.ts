import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

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
    const { community = 'Default Community', ...updates } = body;
    const db = getDb();

    const serviceDocRef = db
      .collection('community_services')
      .doc(community)
      .collection('services')
      .doc(id);

    const doc = await serviceDocRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Service not found in community' }, { status: 404 });
    }

    const cleanUpdates: any = {
      ...updates,
      updatedAt: Date.now(),
    };

    if (updates.price4Wheeler !== undefined) {
      cleanUpdates.price4Wheeler = Number(updates.price4Wheeler) || 0;
      cleanUpdates.price = cleanUpdates.price4Wheeler;
    }
    if (updates.price2Wheeler !== undefined) {
      cleanUpdates.price2Wheeler = Number(updates.price2Wheeler) || 0;
    }
    if (updates.sortOrder !== undefined) {
      cleanUpdates.sortOrder = Number(updates.sortOrder) || 1;
    }
    if (updates.popular !== undefined) {
      cleanUpdates.popular = Boolean(updates.popular);
    }
    if (updates.isActive !== undefined) {
      cleanUpdates.isActive = Boolean(updates.isActive);
    }

    await serviceDocRef.update(cleanUpdates);

    await writeAuditLog(
      admin.email,
      'service_updated',
      id,
      'community_services',
      `Updated service '${id}' in ${community}: ${Object.keys(updates).join(', ')}`
    );

    return NextResponse.json({
      success: true,
      updated: { id, ...cleanUpdates },
    });
  } catch (error: any) {
    console.error('Service PATCH error:', error);
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
    const { searchParams } = new URL(request.url);
    const community = searchParams.get('community') || 'Default Community';
    const db = getDb();

    const serviceDocRef = db
      .collection('community_services')
      .doc(community)
      .collection('services')
      .doc(id);

    const doc = await serviceDocRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await serviceDocRef.delete();

    await writeAuditLog(
      admin.email,
      'service_deleted',
      id,
      'community_services',
      `Deleted service '${id}' from ${community}`
    );

    return NextResponse.json({
      success: true,
      message: `Deleted service ${id}`,
    });
  } catch (error: any) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
