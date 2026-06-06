import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

function formatPhone(phone?: string) {
  if (!phone) return undefined;
  let clean = phone.trim();
  if (clean.length === 10 && !clean.startsWith('+')) {
    return `+91${clean}`;
  }
  return clean;
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, community, block, flatNumber } = body;

    if (!name || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Name, email, and phone number are required' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhone(phoneNumber);
    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const db = getDb();

    // 1. Create Firebase Auth account
    let userRecord;
    try {
      userRecord = await getAuth().createUser({
        email,
        phoneNumber: formattedPhone,
        displayName: name,
      });
    } catch (authError: any) {
      console.error('Firebase Auth user creation failed:', authError);
      let errorMsg = 'Failed to create authentication account.';
      if (authError.code === 'auth/email-already-exists') {
        errorMsg = 'Email is already in use.';
      } else if (authError.code === 'auth/phone-number-already-exists') {
        errorMsg = 'Phone number is already in use.';
      } else if (authError.code === 'auth/invalid-phone-number') {
        errorMsg = 'Invalid phone number format. Must include country code (e.g. +91).';
      } else if (authError.message) {
        errorMsg = authError.message;
      }
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const uid = userRecord.uid;

    // 2. Create Firestore user document with matching UID
    const newUser = {
      name,
      email,
      phoneNumber,
      community: community || '',
      block: block || '',
      flatNumber: flatNumber || '',
      vehicles: [],
      createdAt: Date.now(),
      paymentFlags: {
        totalPaid: 0,
        totalDue: 0,
        overdueCount: 0,
        accountRestricted: false,
        restrictedReason: '',
      },
    };

    await db.collection('users').doc(uid).set(newUser);

    // 3. Write Audit Log
    await writeAuditLog(
      'admin',
      'user_created',
      uid,
      'user',
      `Manually created user account for ${name} (${email})`
    );

    return NextResponse.json({ id: uid, ...newUser }, { status: 201 });
  } catch (error: any) {
    console.error('User create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
