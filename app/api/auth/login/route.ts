import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, updateLastLogin, writeAuditLog } from '@/lib/admin-check';
import { getAuth } from '@/lib/firebase-admin';
import { createSessionToken } from '@/lib/session-crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Firebase Auth REST API
    const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    const authResponse = await fetch(firebaseAuthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    const uid = authData.localId;

    // Verify the token with Admin SDK
    const decodedToken = await getAuth().verifyIdToken(authData.idToken);
    const tokenEmail = decodedToken.email;

    if (!tokenEmail) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Check if user is an admin in Firestore
    const adminUser = await getAdminUser(tokenEmail);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. You are not authorized as an admin.' },
        { status: 403 }
      );
    }

    // Update last login
    await updateLastLogin(adminUser.email);

    // Write audit log
    await writeAuditLog(
      adminUser.email,
      'login',
      uid,
      'admin',
      `Admin logged in from ${request.headers.get('x-forwarded-for') || 'unknown'}`
    );

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        assignedCommunities: adminUser.assignedCommunities,
      },
    });

    // Set session cookie (24 hours)
    const sessionToken = await createSessionToken({
      email: adminUser.email,
      isAdmin: true,
      role: adminUser.role,
      assignedCommunities: adminUser.assignedCommunities,
    }, 60 * 60 * 24);

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
