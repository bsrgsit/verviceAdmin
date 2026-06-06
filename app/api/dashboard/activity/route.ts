import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getDb().collection('admin_audit_log')
      .limit(20)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort in memory since orderBy may require an index
    entries.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json(entries.slice(0, 10));
  } catch (error: any) {
    console.error('Activity error:', error);
    return NextResponse.json([]);
  }
}
