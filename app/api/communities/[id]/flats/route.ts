import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '@/lib/firebase-admin';
import {
  writeAuditLog,
  getAuthenticatedAdmin,
  canAccessCommunityById,
  enforceSuperAdmin,
} from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!await canAccessCommunityById(admin, params.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const blockName = searchParams.get('block');
    const db = getDb();
    const flatsColRef = db.collection('communities').doc(params.id).collection('flats');

    // If a specific block is requested
    if (blockName) {
      const doc = await flatsColRef.doc(blockName).get();
      if (!doc.exists) {
        return NextResponse.json({ blockName, flats: [] });
      }
      const data = doc.data();
      return NextResponse.json({
        blockName: data?.blockName || blockName,
        flats: Array.isArray(data?.flats) ? data?.flats : [],
      });
    }

    // Fetch all blocks and flats for this community
    const snap = await flatsColRef.get();
    const blocksMap: Record<string, string[]> = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const bName = data.blockName || doc.id;
      blocksMap[bName] = Array.isArray(data.flats) ? data.flats : [];
    });

    return NextResponse.json({
      communityId: params.id,
      blocks: blocksMap,
    });
  } catch (error: any) {
    console.error('Community flats GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!enforceSuperAdmin(admin)) {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { blockName, flats } = body;

    if (!blockName || !blockName.trim()) {
      return NextResponse.json({ error: 'Block name is required' }, { status: 400 });
    }

    const cleanBlockName = blockName.trim();
    const cleanFlats = Array.isArray(flats)
      ? Array.from(new Set(flats.map((f: any) => String(f).trim()).filter(Boolean)))
      : [];

    const db = getDb();
    const communityRef = db.collection('communities').doc(params.id);
    const flatDocRef = communityRef.collection('flats').doc(cleanBlockName);

    // Save flats document: communities/{id}/flats/{blockName}
    await flatDocRef.set({
      blockName: cleanBlockName,
      flats: cleanFlats,
      updatedAt: Date.now(),
    });

    // Ensure the block is listed in the parent community document's blocks array
    await communityRef.update({
      blocks: FieldValue.arrayUnion(cleanBlockName),
      updatedAt: Date.now(),
    });

    await writeAuditLog(
      admin.email,
      'community_flats_updated',
      `${params.id}_${cleanBlockName}`,
      'community_flats',
      `Updated ${cleanFlats.length} flats for '${cleanBlockName}' in community ${params.id}`
    );

    return NextResponse.json({
      success: true,
      blockName: cleanBlockName,
      flats: cleanFlats,
    });
  } catch (error: any) {
    console.error('Community flats POST error:', error);
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
    if (!enforceSuperAdmin(admin)) {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const blockName = searchParams.get('block');

    if (!blockName || !blockName.trim()) {
      return NextResponse.json({ error: 'Block name is required' }, { status: 400 });
    }

    const cleanBlockName = blockName.trim();
    const db = getDb();
    const communityRef = db.collection('communities').doc(params.id);
    const flatDocRef = communityRef.collection('flats').doc(cleanBlockName);

    // Delete flats document
    await flatDocRef.delete();

    // Remove from blocks array in community document
    await communityRef.update({
      blocks: FieldValue.arrayRemove(cleanBlockName),
      updatedAt: Date.now(),
    });

    await writeAuditLog(
      admin.email,
      'community_block_deleted',
      `${params.id}_${cleanBlockName}`,
      'community_flats',
      `Deleted block '${cleanBlockName}' and its flats from community ${params.id}`
    );

    return NextResponse.json({ success: true, deletedBlock: cleanBlockName });
  } catch (error: any) {
    console.error('Community block DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
