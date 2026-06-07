import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const snapshot = await db.collection('partners').get();
    let partners = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // For community admins, filter partners to show only those servicing their assigned communities
    if (!enforceSuperAdmin(admin)) {
      partners = partners.filter((p: any) =>
        p.communities && p.communities.some((c: string) => admin.assignedCommunities.includes(c))
      );
    }

    // Sort partners alphabetically by name
    partners.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

    return NextResponse.json(partners);
  } catch (error: any) {
    console.error('Partners fetch error:', error);
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
    const { name, phoneNumber, rating, status, communities } = body;

    if (!name || !phoneNumber || !communities || !Array.isArray(communities)) {
      return NextResponse.json(
        { error: 'Missing required partner fields (name, phoneNumber, communities)' },
        { status: 400 }
      );
    }

    const db = getDb();
    const newPartner = {
      name,
      phoneNumber,
      rating: rating !== undefined ? Number(rating) : 4.8,
      status: status || 'active',
      communities,
      enteredCommunity: false,
      enteredAt: 0,
      createdAt: Date.now(),
    };

    const docRef = await db.collection('partners').add(newPartner);

    return NextResponse.json({ id: docRef.id, ...newPartner }, { status: 201 });
  } catch (error: any) {
    console.error('Partner create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
