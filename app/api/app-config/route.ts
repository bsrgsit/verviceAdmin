import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const doc = await db.collection('settings').doc('app_config').get();
    const flagsDoc = await db.collection('settings').doc('feature_flags').get();

    const defaultConfig = {
      enable_battery_service: true,
      enable_driver_service: true,
      enable_insurance_service: false,
      enable_todays_clean_status_card: true,
      enable_upi_payments: true,
      enable_qr_code_display: true,
      maintenance_mode: false,
      min_android_version: '1.0.0',
      min_ios_version: '1.0.0',
      support_phone: '+91 98765 43210',
      support_whatsapp: '+91 98765 43210',
      support_email: 'support@vervice.com',
      updatedAt: Date.now(),
    };

    const config = doc.exists ? { ...defaultConfig, ...doc.data() } : defaultConfig;
    const featureFlags = flagsDoc.exists ? flagsDoc.data() : {};

    return NextResponse.json({ config, featureFlags });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = getDb();

    const updatedData = {
      ...body,
      updatedAt: Date.now(),
      updatedBy: admin.email,
    };

    await db.collection('settings').doc('app_config').set(updatedData, { merge: true });
    await db.collection('settings').doc('feature_flags').set(updatedData, { merge: true });

    await writeAuditLog(
      admin.email,
      'update_app_config',
      'app_config',
      'settings',
      `Updated app configuration and feature flags`
    );

    return NextResponse.json({ success: true, config: updatedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
