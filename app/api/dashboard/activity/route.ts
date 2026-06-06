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

    const snapshot = await getDb().collection('admin_audit_log')
      .limit(50) // slightly larger limit before filtering
      .get();

    let entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Enforce role-based access control based on role (Issue 4)
    if (!enforceSuperAdmin(admin)) {
      entries = entries.filter((e: any) => e.adminEmail === admin.email);
    }

    // Sort in memory since orderBy may require an index
    entries.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json(entries.slice(0, 10));
  } catch (error: any) {
    console.error('Activity error:', error);
    return NextResponse.json([]);
  }
}
