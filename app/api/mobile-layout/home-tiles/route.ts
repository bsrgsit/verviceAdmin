import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const snap = await db.collection('home_tiles').get();

    const tiles = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    tiles.sort((a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0));

    return NextResponse.json(tiles);
  } catch (error: any) {
    console.error('Home Tiles GET error:', error);
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
    const db = getDb();

    const {
      id,
      title,
      subtitle = '',
      ctaText = 'Explore →',
      deepLink = 'services',
      redirectUrl = '',
      iconUrl = '',
      gradientStart = '#1E293B',
      gradientEnd = '#334155',
      order = 1,
      enabled = true,
      communities = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Tile title is required' }, { status: 400 });
    }

    const cleanId = id && id.trim()
      ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : 'tile_' + Date.now().toString();

    const newTile = {
      id: cleanId,
      sectionId: 'dynamic_tiles',
      title: title.trim(),
      subtitle: subtitle.trim(),
      ctaText: ctaText.trim(),
      deepLink: deepLink.trim(),
      redirectUrl: redirectUrl.trim(),
      iconUrl: iconUrl.trim(),
      gradientStart: gradientStart.trim(),
      gradientEnd: gradientEnd.trim(),
      order: Number(order) || 1,
      enabled: Boolean(enabled),
      communities: Array.isArray(communities) ? communities : [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    await db.collection('home_tiles').doc(cleanId).set(newTile);

    await writeAuditLog(
      admin.email,
      'home_tile_created',
      cleanId,
      'home_tiles',
      `Created home promo tile '${title}'`
    );

    return NextResponse.json({ success: true, tile: newTile });
  } catch (error: any) {
    console.error('Home Tiles POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Tile ID is required' }, { status: 400 });
    }

    const db = getDb();
    const ref = db.collection('home_tiles').doc(id);
    await ref.update({ ...updates, updatedAt: Date.now() });

    await writeAuditLog(
      admin.email,
      'home_tile_updated',
      id,
      'home_tiles',
      `Updated home tile '${id}': ${Object.keys(updates).join(', ')}`
    );

    return NextResponse.json({ success: true, id, updates });
  } catch (error: any) {
    console.error('Home Tiles PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Tile ID is required' }, { status: 400 });
    }

    const db = getDb();
    await db.collection('home_tiles').doc(id).delete();

    await writeAuditLog(
      admin.email,
      'home_tile_deleted',
      id,
      'home_tiles',
      `Deleted home tile '${id}'`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Home Tiles DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
