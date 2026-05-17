import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getDb().collection('admin_audit_log')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Activity error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
