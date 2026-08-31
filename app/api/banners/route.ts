import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    
    // Fetch from 'banners' collection without strict orderBy so documents missing specific fields are never dropped
    const snap = await db.collection('banners').get();

    const banners = snap.docs.map((doc) => {
      const data = doc.data();
      const communitiesArr = Array.isArray(data.communities) ? data.communities : [];
      const communityId =
        data.communityId || (communitiesArr.length > 0 ? communitiesArr.join(', ') : 'ALL');

      return {
        id: doc.id,
        title: data.title || data.heading || data.label || 'Announcement',
        subtitle: data.subtitle || data.description || data.text || '',
        imageUrl: data.imageUrl || data.image_url || data.bannerUrl || data.url || '',
        actionUrl: data.actionUrl || data.redirectUrl || data.deepLink || '',
        communityId,
        communities: communitiesArr,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder ?? data.priority ?? 0,
        priority: data.priority ?? data.sortOrder ?? 0,
        createdAt: data.createdAt || Date.now(),
        ...data,
      };
    });

    // Sort in memory by sortOrder / priority ascending
    banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

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

    const communityTarget = body.communityId || 'ALL';
    const communitiesList = communityTarget === 'ALL' ? [] : [communityTarget];

    const bannerData = {
      title: body.title || 'New Announcement',
      subtitle: body.subtitle || '',
      imageUrl: body.imageUrl || '',
      actionUrl: body.actionUrl || '',
      redirectUrl: body.actionUrl || '',
      deepLink: body.actionUrl || '',
      communityId: communityTarget,
      communities: communitiesList,
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: Number(body.priority || body.sortOrder || 1),
      priority: Number(body.priority || body.sortOrder || 1),
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
