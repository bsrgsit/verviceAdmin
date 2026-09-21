import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

const DEFAULT_QUICK_ACTIONS = [
  {
    id: 'qa_rewards',
    label: 'Rewards',
    description: 'Points',
    iconUrl: '',
    deepLink: 'rewards',
    redirectUrl: '',
    gradientStart: '#F59E0B',
    gradientEnd: '#FBBF24',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'qa_hiredriver',
    label: 'Hire Driver',
    description: 'On Demand',
    iconUrl: '',
    deepLink: 'hire_driver',
    redirectUrl: '',
    gradientStart: '#1E3A5F',
    gradientEnd: '#0EA5E9',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'qa_insurance',
    label: 'Insurance',
    description: 'Renew Now',
    iconUrl: '',
    deepLink: 'insurance',
    redirectUrl: '',
    gradientStart: '#1D4ED8',
    gradientEnd: '#6366F1',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'qa_batteries',
    label: 'Batteries',
    description: 'Replace',
    iconUrl: '',
    deepLink: 'batteries',
    redirectUrl: '',
    gradientStart: '#78350F',
    gradientEnd: '#F59E0B',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'qa_detailing',
    label: 'Detailing',
    description: 'Premium',
    iconUrl: '',
    deepLink: 'detailing',
    redirectUrl: '',
    gradientStart: '#7C3AED',
    gradientEnd: '#EC4899',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'qa_gaming',
    label: 'Gaming',
    description: 'Community',
    iconUrl: '',
    deepLink: 'gaming',
    redirectUrl: '',
    gradientStart: '#0F172A',
    gradientEnd: '#7C3AED',
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'qa_support',
    label: 'Support',
    description: 'Help',
    iconUrl: '',
    deepLink: 'support',
    redirectUrl: '',
    gradientStart: '#8B5CF6',
    gradientEnd: '#A78BFA',
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 'qa_more',
    label: 'More',
    description: 'All Services',
    iconUrl: '',
    deepLink: 'community_hub',
    redirectUrl: '',
    gradientStart: '#4B5563',
    gradientEnd: '#9CA3AF',
    sortOrder: 8,
    isActive: true,
  },
];

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const snap = await db.collection('quick_actions').get();

    let actions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // If Firestore has no quick actions seeded yet, return the default array with a flag
    let isDefault = false;
    if (actions.length === 0) {
      actions = [...DEFAULT_QUICK_ACTIONS];
      isDefault = true;
    } else {
      actions.sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99));
    }

    return NextResponse.json({
      actions,
      isDefault,
      count: actions.length,
    });
  } catch (error: any) {
    console.error('Quick Actions GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDb();

    // 1-click restore default 8 actions
    if (body.action === 'restore_defaults') {
      const batch = db.batch();
      DEFAULT_QUICK_ACTIONS.forEach((qa) => {
        const ref = db.collection('quick_actions').doc(qa.id);
        batch.set(ref, qa);
      });
      await batch.commit();

      await writeAuditLog(
        admin.email,
        'quick_actions_restored_defaults',
        'quick_actions',
        'quick_actions',
        'Restored standard 8 mobile home screen quick action tiles'
      );

      return NextResponse.json({
        success: true,
        message: 'Restored 8 default quick actions',
        actions: DEFAULT_QUICK_ACTIONS,
      });
    }

    // Single create
    const {
      id,
      label,
      description = '',
      deepLink = 'services',
      redirectUrl = '',
      iconUrl = '',
      gradientStart = '#10B981',
      gradientEnd = '#059669',
      sortOrder = 99,
      isActive = true,
    } = body;

    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }

    const cleanId = id && id.trim()
      ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : 'qa_' + label.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    const newAction = {
      id: cleanId,
      label: label.trim(),
      description: description.trim(),
      deepLink: deepLink.trim(),
      redirectUrl: redirectUrl.trim(),
      iconUrl: iconUrl.trim(),
      gradientStart: gradientStart.trim(),
      gradientEnd: gradientEnd.trim(),
      sortOrder: Number(sortOrder) || 99,
      isActive: Boolean(isActive),
      updatedAt: Date.now(),
    };

    await db.collection('quick_actions').doc(cleanId).set(newAction);

    await writeAuditLog(
      admin.email,
      'quick_action_created',
      cleanId,
      'quick_actions',
      `Created quick action '${label}' linking to '${deepLink}'`
    );

    return NextResponse.json({
      success: true,
      action: newAction,
    });
  } catch (error: any) {
    console.error('Quick Actions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDb();

    // Batch reorder
    if (body.reorder && Array.isArray(body.reorder)) {
      const batch = db.batch();
      body.reorder.forEach((item: { id: string; sortOrder: number }) => {
        const ref = db.collection('quick_actions').doc(item.id);
        batch.update(ref, { sortOrder: item.sortOrder, updatedAt: Date.now() });
      });
      await batch.commit();

      await writeAuditLog(
        admin.email,
        'quick_actions_reordered',
        'quick_actions',
        'quick_actions',
        `Reordered ${body.reorder.length} quick action items`
      );

      return NextResponse.json({ success: true });
    }

    // Single update
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Quick Action ID required' }, { status: 400 });
    }

    const ref = db.collection('quick_actions').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      // If updating an item that exists in default but not yet written to Firestore, write entire item
      await ref.set({ id, ...updates, updatedAt: Date.now() });
    } else {
      await ref.update({ ...updates, updatedAt: Date.now() });
    }

    await writeAuditLog(
      admin.email,
      'quick_action_updated',
      id,
      'quick_actions',
      `Updated quick action '${id}': ${Object.keys(updates).join(', ')}`
    );

    return NextResponse.json({ success: true, id, updates });
  } catch (error: any) {
    console.error('Quick Actions PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Action ID required' }, { status: 400 });
    }

    const db = getDb();
    await db.collection('quick_actions').doc(id).delete();

    await writeAuditLog(
      admin.email,
      'quick_action_deleted',
      id,
      'quick_actions',
      `Deleted quick action '${id}'`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Quick Actions DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
