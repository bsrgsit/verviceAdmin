import { getDb } from './firebase-admin';

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
  try {
    await getDb().collection('admin_audit_log').add({
      adminEmail,
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
