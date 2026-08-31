import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const snap = await db.collection('banners').orderBy('priority', 'asc').get();

    const banners = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(banners);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = getDb();

    const bannerData = {
      title: body.title || 'New Announcement',
      subtitle: body.subtitle || '',
      imageUrl: body.imageUrl || '',
      actionUrl: body.actionUrl || '',
      communityId: body.communityId || 'ALL',
      isActive: body.isActive !== undefined ? body.isActive : true,
      priority: body.priority || 1,
      createdAt: Date.now(),
      createdBy: admin.email,
    };

    const docRef = await db.collection('banners').add(bannerData);

    await writeAuditLog(
      admin.email,
      'create_banner',
      docRef.id,
      'banner',
      `Created banner: ${bannerData.title}`
    );

    return NextResponse.json({ id: docRef.id, ...bannerData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
