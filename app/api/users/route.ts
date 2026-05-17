import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getDb().collection('users').get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
