import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { reason } = await request.json();

    await getDb().collection('users').doc(userId).update({
      'paymentFlags.accountRestricted': true,
      'paymentFlags.restrictedReason': reason || 'Restricted by admin',
    });

    await writeAuditLog('admin', 'user_restricted', userId, 'user', `Account restricted: ${reason}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
