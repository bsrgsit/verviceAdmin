import { getDb } from './firebase-admin';
import { cookies } from 'next/headers';
import { verifySessionToken } from './session-crypto';

export interface AdminUser {
  email: string;
  name: string;
  role: 'super_admin' | 'community_admin';
  assignedCommunities: string[];
  isActive: boolean;
  createdAt: number;
  lastLoginAt?: number;
}

export async function getAdminUser(email: string): Promise<AdminUser | null> {
  try {
    const doc = await getDb().collection('admins').doc(email.toLowerCase()).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data?.isActive) return null;
    return data as AdminUser;
  } catch {
    return null;
  }
}

export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie?.value) return null;

    const sessionData = await verifySessionToken(sessionCookie.value);
    if (!sessionData || !sessionData.email || !sessionData.isAdmin) return null;

    // Fetch fresh database record to ensure revoked accesses or changed roles are instantly enforced
    return await getAdminUser(sessionData.email);
  } catch {
    return null;
  }
}

export function enforceSuperAdmin(admin: AdminUser): boolean {
  return admin.role === 'super_admin';
}

export function canAccessCommunity(admin: AdminUser, communityName: string): boolean {
  if (admin.role === 'super_admin') return true;
  return admin.assignedCommunities.includes(communityName);
}

export async function canAccessCommunityById(admin: AdminUser, communityId: string): Promise<boolean> {
  if (admin.role === 'super_admin') return true;
  try {
    const communityDoc = await getDb().collection('communities').doc(communityId).get();
    if (!communityDoc.exists) return false;
    const name = communityDoc.data()?.name;
    return name ? admin.assignedCommunities.includes(name) : false;
  } catch {
    return false;
  }
}

export async function canAccessUser(admin: AdminUser, userId: string): Promise<boolean> {
  if (admin.role === 'super_admin') return true;
  try {
    const userDoc = await getDb().collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const community = userDoc.data()?.community;
    return community ? admin.assignedCommunities.includes(community) : false;
  } catch {
    return false;
  }
}

export async function updateLastLogin(email: string) {
  try {
    await getDb().collection('admins').doc(email.toLowerCase()).update({
      lastLoginAt: Date.now(),
    });
  } catch {
    // ignore
  }
}

export async function writeAuditLog(
  adminEmail: string,
  action: string,
  targetId: string,
  targetType: string,
  details: string
) {
  let resolvedEmail = adminEmail;

  if (!adminEmail || adminEmail === 'admin' || !adminEmail.includes('@')) {
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('admin_session');
      if (sessionCookie?.value) {
        const sessionData = await verifySessionToken(sessionCookie.value);
        if (sessionData && sessionData.email) {
          resolvedEmail = sessionData.email;
        }
      }
    } catch (e) {
      // Fallback if called outside a Next.js request context
    }
  }

  try {
    await getDb().collection('admin_audit_log').add({
      adminEmail: resolvedEmail,
      action,
      targetId,
      targetType,
      details,
      timestamp: Date.now(),
    });
  } catch {
    // ignore
  }
}
