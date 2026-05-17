import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    await getDb().collection('users').doc(userId).update({
      'paymentFlags.accountRestricted': false,
      'paymentFlags.restrictedReason': '',
    });

    await writeAuditLog('admin', 'user_unrestricted', userId, 'user', 'Account unrestricted by admin');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
