import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session-crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session');

  if (!session?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const sessionData = await verifySessionToken(session.value);
    if (!sessionData || !sessionData.email || !sessionData.isAdmin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: sessionData.email,
        role: sessionData.role,
        assignedCommunities: sessionData.assignedCommunities || [],
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
