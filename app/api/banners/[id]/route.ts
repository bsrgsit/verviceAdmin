import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = getDb();

    const updatePayload: any = {
      ...body,
      updatedAt: Date.now(),
      updatedBy: admin.email,
    };

    if (body.priority !== undefined) {
      updatePayload.sortOrder = Number(body.priority);
      updatePayload.priority = Number(body.priority);
    }
    if (body.communityId !== undefined) {
      updatePayload.communities = body.communityId === 'ALL' ? [] : [body.communityId];
    }
    if (body.actionUrl !== undefined) {
      updatePayload.redirectUrl = body.actionUrl;
      updatePayload.deepLink = body.actionUrl;
    }

    await db.collection('banners').doc(params.id).update(updatePayload);

    await writeAuditLog(
      admin.email,
      'update_banner',
      params.id,
      'banner',
      `Updated banner ${params.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    await db.collection('banners').doc(params.id).delete();

    await writeAuditLog(
      admin.email,
      'delete_banner',
      params.id,
      'banner',
      `Deleted banner ${params.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
