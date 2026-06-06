import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    
    // Get community name from the community document
    const communityDoc = await db.collection('communities').doc(params.id).get();
    if (!communityDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }
    const communityName = communityDoc.data()?.name;

    // Fetch users in this community
    const snapshot = await db.collection('users')
      .where('community', '==', communityName)
      .get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Community users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
