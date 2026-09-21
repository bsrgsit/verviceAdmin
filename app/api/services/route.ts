import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, writeAuditLog } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const community = searchParams.get('community') || 'Default Community';
    const db = getDb();

    // Fetch services under community_services/{community}/services
    const snap = await db
      .collection('community_services')
      .doc(community)
      .collection('services')
      .get();

    let services: any[] = [];
    let tabUiConfig: any = null;
    let detailingConfig: any = null;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      if (id === 'tab_ui_config') {
        tabUiConfig = { id, ...data };
      } else if (id === 'screen_config_detailing') {
        detailingConfig = { id, ...data };
      } else {
        services.push({
          id,
          ...data,
        });
      }
    });

    // If target community has 0 services, check if Default Community has services
    let isInherited = false;
    if (services.length === 0 && community !== 'Default Community') {
      const defaultSnap = await db
        .collection('community_services')
        .doc('Default Community')
        .collection('services')
        .get();

      if (!defaultSnap.empty) {
        isInherited = true;
        defaultSnap.docs.forEach((doc) => {
          const data = doc.data();
          const id = doc.id;
          if (id === 'tab_ui_config') {
            if (!tabUiConfig) tabUiConfig = { id, ...data };
          } else if (id === 'screen_config_detailing') {
            if (!detailingConfig) detailingConfig = { id, ...data };
          } else {
            services.push({
              id,
              ...data,
              isInherited: true,
            });
          }
        });
      }
    }

    // Sort by sortOrder ascending
    services.sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99));

    return NextResponse.json({
      community,
      isInherited,
      count: services.length,
      services,
      tabUiConfig,
      detailingConfig,
    });
  } catch (error: any) {
    console.error('Services GET error:', error);
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
    const { community = 'Default Community', action } = body;

    // Support 1-click clone default catalog to this community
    if (action === 'clone_default') {
      if (community === 'Default Community') {
        return NextResponse.json({ error: 'Cannot clone Default Community onto itself' }, { status: 400 });
      }

      const defaultSnap = await db
        .collection('community_services')
        .doc('Default Community')
        .collection('services')
        .get();

      if (defaultSnap.empty) {
        return NextResponse.json({ error: 'Default Community has no services to clone' }, { status: 400 });
      }

      const batch = db.batch();
      defaultSnap.docs.forEach((doc) => {
        const targetRef = db
          .collection('community_services')
          .doc(community)
          .collection('services')
          .doc(doc.id);
        batch.set(targetRef, doc.data());
      });

      await batch.commit();

      await writeAuditLog(
        admin.email,
        'catalog_cloned_from_default',
        community,
        'community_services',
        `Cloned ${defaultSnap.docs.length} services from Default Community to ${community}`
      );

      return NextResponse.json({
        success: true,
        message: `Successfully copied ${defaultSnap.docs.length} services to ${community}`,
      });
    }

    // Create a new service
    const {
      id,
      name,
      category = 'Monthly Plans',
      price4Wheeler = 0,
      price2Wheeler = 0,
      period = '/mo',
      type = 'monthly',
      description = '',
      features = [],
      applicableVehicleTypes = ['4 Wheeler', '2 Wheeler'],
      popular = false,
      isActive = true,
      sortOrder = 1,
      iconName = 'Sparkles',
      colorHex = '#10B981',
      actionType = 'subscribe',
      tileSize = 'medium',
      tileSpanColumns = 1,
      bannerImageUrl = '',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    // Generate service ID if not provided
    const cleanId =
      id && id.trim()
        ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
        : name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '_' + Date.now().toString().slice(-4);

    const serviceDocRef = db
      .collection('community_services')
      .doc(community)
      .collection('services')
      .doc(cleanId);

    const newServiceData = {
      id: cleanId,
      name: name.trim(),
      category: category.trim(),
      price4Wheeler: Number(price4Wheeler) || 0,
      price2Wheeler: Number(price2Wheeler) || 0,
      price: Number(price4Wheeler) || 0, // Fallback backward compatibility
      period: period.trim(),
      type: type.trim(),
      description: description.trim(),
      features: Array.isArray(features) ? features.filter(Boolean) : [],
      applicableVehicleTypes: Array.isArray(applicableVehicleTypes) ? applicableVehicleTypes : ['4 Wheeler'],
      popular: Boolean(popular),
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 1,
      iconName: iconName.trim(),
      colorHex: colorHex.trim(),
      actionType: actionType.trim(),
      tileSize: tileSize || 'medium',
      tileSpanColumns: Number(tileSpanColumns) || 1,
      bannerImageUrl: bannerImageUrl || '',
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    await serviceDocRef.set(newServiceData);

    await writeAuditLog(
      admin.email,
      'service_created',
      cleanId,
      'community_services',
      `Created service '${name}' in ${community} (4W: ₹${price4Wheeler}, 2W: ₹${price2Wheeler})`
    );

    return NextResponse.json({
      success: true,
      service: newServiceData,
    });
  } catch (error: any) {
    console.error('Services POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
