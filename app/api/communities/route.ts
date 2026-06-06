import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await getDb().collection('communities').get();
    let communities = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (!enforceSuperAdmin(admin)) {
      communities = communities.filter((c: any) => admin.assignedCommunities.includes(c.name));
    }

    return NextResponse.json(communities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!enforceSuperAdmin(admin)) {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const data = await request.json();
    const docRef = await getDb().collection('communities').add({
      ...data,
      isActive: true,
      features: {},
      createdAt: Date.now(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
