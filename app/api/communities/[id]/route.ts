import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    await getDb().collection('communities').doc(params.id).update(data);
    
    await writeAuditLog(
      'admin',
      'community_updated',
      params.id,
      'community',
      `Updated community details: ${JSON.stringify(Object.keys(data))}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    const db = getDb();

    // 1. Fetch community details
    const communityDoc = await db.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const communityName = communityDoc.data()?.name;

    if (communityName) {
      // 2. Check for registered users in this community
      const usersSnap = await db.collection('users')
        .where('community', '==', communityName)
        .limit(1)
        .get();

      if (!usersSnap.empty) {
        return NextResponse.json(
          { error: 'Cannot delete community because it has registered users. Reassign or delete those users first.' },
          { status: 400 }
        );
      }
    }

    // 3. Delete community document
    await db.collection('communities').doc(communityId).delete();

    // 4. Write Audit Log
    await writeAuditLog(
      'admin',
      'community_deleted',
      communityId,
      'community',
      `Deleted community ${communityName}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Community delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
