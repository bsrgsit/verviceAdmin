import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthenticatedAdmin, enforceSuperAdmin } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    if (!q || q.length < 2) {
      return NextResponse.json({
        residents: [],
        vehicles: [],
        payments: [],
        communities: [],
      });
    }

    const db = getDb();

    // Query collections in parallel with sensible limits
    const [usersSnap, bookingsSnap, paymentsSnap, communitiesSnap] = await Promise.all([
      db.collection('users').limit(150).get().catch(() => ({ docs: [] })),
      db.collection('bookings').limit(150).get().catch(() => ({ docs: [] })),
      db.collection('payments').limit(100).get().catch(() => ({ docs: [] })),
      db.collection('communities').limit(50).get().catch(() => ({ docs: [] })),
    ]);

    const isSuperAdmin = enforceSuperAdmin(admin);

    // 1. Search Residents
    const residents: any[] = [];
    const vehiclesSet = new Set<string>();
    const vehicles: any[] = [];

    usersSnap.docs.forEach((doc: any) => {
      const u = doc.data();
      if (!isSuperAdmin && !admin.assignedCommunities.includes(u.community)) return;

      const name = (u.name || '').toLowerCase();
      const phone = (u.phoneNumber || '').toLowerCase();
      const flat = (u.flatNumber || '').toLowerCase();
      const comm = (u.community || '').toLowerCase();

      if (name.includes(q) || phone.includes(q) || flat.includes(q) || comm.includes(q)) {
        if (residents.length < 5) {
          residents.push({
            id: doc.id,
            title: u.name || 'Resident',
            subtitle: `${u.community || 'No Society'} • Flat ${u.flatNumber || 'N/A'} • ${u.phoneNumber || ''}`,
            href: `/users?id=${doc.id}`,
            type: 'resident',
          });
        }
      }

      // Check vehicles registered under user
      if (Array.isArray(u.vehicles)) {
        u.vehicles.forEach((veh: any) => {
          const reg = (veh.regNo || veh.registration || veh.plateNumber || '').toLowerCase();
          const vName = (veh.name || veh.model || '').toLowerCase();
          if (reg.includes(q) || vName.includes(q)) {
            const key = veh.regNo || veh.registration || veh.plateNumber;
            if (key && !vehiclesSet.has(key) && vehicles.length < 6) {
              vehiclesSet.add(key);
              vehicles.push({
                id: `${doc.id}_${key}`,
                title: key.toUpperCase(),
                subtitle: `${veh.name || veh.model || 'Vehicle'} • ${u.name || 'Resident'} (${u.community || ''})`,
                href: `/users?id=${doc.id}`,
                type: 'vehicle',
              });
            }
          }
        });
      }
    });

    // 2. Search Bookings for Vehicle Regs & Service Names
    bookingsSnap.docs.forEach((doc: any) => {
      const b = doc.data();
      const reg = (b.vehicleReg || '').toLowerCase();
      const vName = (b.vehicleName || '').toLowerCase();
      const uName = (b.userName || '').toLowerCase();

      if (reg.includes(q) || vName.includes(q) || uName.includes(q)) {
        const key = b.vehicleReg;
        if (key && !vehiclesSet.has(key) && vehicles.length < 6) {
          vehiclesSet.add(key);
          vehicles.push({
            id: doc.id,
            title: key.toUpperCase(),
            subtitle: `${b.vehicleName || 'Vehicle'} • ${b.serviceName || 'Wash Plan'} • ${b.userName || 'Resident'}`,
            href: `/bookings?search=${encodeURIComponent(key)}`,
            type: 'vehicle',
          });
        }
      }
    });

    // 3. Search Payments
    const payments: any[] = [];
    paymentsSnap.docs.forEach((doc: any) => {
      const p = doc.data();
      const utr = (p.transactionId || p.utr || p.utrNumber || '').toLowerCase();
      const uName = (p.userName || '').toLowerCase();
      const amountStr = (p.amount || '').toString();

      if (utr.includes(q) || uName.includes(q) || amountStr.includes(q)) {
        if (payments.length < 5) {
          payments.push({
            id: doc.id,
            title: `₹${p.amount || 0} - ${p.userName || 'Resident'}`,
            subtitle: `UTR: ${p.transactionId || p.utr || 'N/A'} • Status: ${p.status || 'pending'}`,
            href: `/payments?id=${doc.id}`,
            type: 'payment',
          });
        }
      }
    });

    // 4. Search Communities
    const communities: any[] = [];
    communitiesSnap.docs.forEach((doc: any) => {
      const c = doc.data();
      const cName = (c.name || '').toLowerCase();
      const city = (c.city || '').toLowerCase();

      if (cName.includes(q) || city.includes(q)) {
        if (communities.length < 4) {
          communities.push({
            id: doc.id,
            title: c.name,
            subtitle: `${c.city || 'Bangalore'} • Society Hub`,
            href: `/communities/${doc.id}`,
            type: 'community',
          });
        }
      }
    });

    return NextResponse.json({
      residents,
      vehicles,
      payments,
      communities,
    });
  } catch (error: any) {
    console.error('Universal search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
