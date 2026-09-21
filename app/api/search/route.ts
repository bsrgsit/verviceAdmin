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
    const normQ = q.replace(/[\s-]/g, '').toLowerCase();

    const residents: any[] = [];
    const vehiclesSet = new Set<string>();
    const vehicles: any[] = [];

    // 1. Search Bookings for Vehicle Regs & Service Names (High priority for operational car search)
    bookingsSnap.docs.forEach((doc: any) => {
      const b = doc.data();
      if (!isSuperAdmin && !admin.assignedCommunities.includes(b.community)) return;

      const reg = (b.vehicleReg || '').toLowerCase();
      const normReg = reg.replace(/[\s-]/g, '');
      const vName = (b.vehicleName || '').toLowerCase();
      const uName = (b.userName || '').toLowerCase();

      if (reg.includes(q) || (normQ.length >= 2 && normReg.includes(normQ)) || vName.includes(q) || uName.includes(q)) {
        const rawKey = b.vehicleReg;
        const normKey = (rawKey || '').replace(/[\s-]/g, '').toUpperCase();
        if (normKey && !vehiclesSet.has(normKey) && vehicles.length < 8) {
          vehiclesSet.add(normKey);
          vehicles.push({
            id: doc.id,
            title: (rawKey || 'Vehicle').toUpperCase(),
            subtitle: `${b.vehicleName || 'Vehicle'} • ${b.serviceName || 'Wash Plan'} • ${b.userName || 'Resident'} (${b.community || ''})`,
            href: `/bookings?id=${doc.id}&search=${encodeURIComponent(rawKey || '')}`,
            type: 'vehicle',
            actionText: 'View Booking',
          });
        }
      }
    });

    // 2. Search Residents and User-Registered Vehicles
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
            href: `/users?id=${doc.id}&search=${encodeURIComponent(u.name || '')}`,
            type: 'resident',
          });
        }
      }

      // Check vehicles registered under user that might not have an active booking
      if (Array.isArray(u.vehicles)) {
        u.vehicles.forEach((veh: any) => {
          const rawKey = veh.registrationNumber || veh.regNo || veh.registration || veh.plateNumber;
          const reg = (rawKey || '').toLowerCase();
          const normReg = reg.replace(/[\s-]/g, '');
          const vehicleDisplayName = [veh.make, veh.model].filter(Boolean).join(' ') || veh.name || 'Vehicle';
          const vName = vehicleDisplayName.toLowerCase();

          if (reg.includes(q) || (normQ.length >= 2 && normReg.includes(normQ)) || vName.includes(q)) {
            const normKey = (rawKey || '').replace(/[\s-]/g, '').toUpperCase();
            if (normKey && !vehiclesSet.has(normKey) && vehicles.length < 8) {
              vehiclesSet.add(normKey);
              vehicles.push({
                id: `${doc.id}_${normKey}`,
                title: (rawKey || 'Vehicle').toUpperCase(),
                subtitle: `${vehicleDisplayName} • Resident: ${u.name || 'Resident'} (${u.community || ''})`,
                href: `/bookings?search=${encodeURIComponent(rawKey || '')}`,
                type: 'vehicle',
                actionText: 'Check Schedule',
              });
            }
          }
        });
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
