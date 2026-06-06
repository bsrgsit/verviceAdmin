import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getDb().collection('invoices')
      .orderBy('createdAt', 'desc')
      .get();

    const userPromises = new Map<string, Promise<{ name: string; phoneNumber: string }>>();

    const invoices = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'Unknown';
        let userPhone = '';

        if (data.userId) {
          if (!userPromises.has(data.userId)) {
            const promise = (async () => {
              const userDoc = await getDb().collection('users').doc(data.userId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                  name: userData?.name || 'Unknown',
                  phoneNumber: userData?.phoneNumber || '',
                };
              }
              return { name: 'Unknown', phoneNumber: '' };
            })();
            userPromises.set(data.userId, promise);
          }
          const userInfo = await userPromises.get(data.userId)!;
          userName = userInfo.name;
          userPhone = userInfo.phoneNumber;
        }

        return {
          id: doc.id,
          ...data,
          userName,
          userPhone,
        };
      })
    );

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subscriptionId,
      userId,
      amount,
      billingMonth,
      dueDate,
      serviceName,
      vehicleReg,
    } = body;

    if (!subscriptionId || !userId || !amount || !billingMonth || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required invoice fields' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Get cycle number
    const subInvoices = await db.collection('invoices')
      .where('subscriptionId', '==', subscriptionId)
      .get();
    const cycleNumber = subInvoices.size + 1;

    // Generate invoice number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const shortSubId = subscriptionId.slice(-6).toUpperCase();
    const invoiceNumber = `INV-${dateStr}-${shortSubId}-${cycleNumber}`;

    const now = Date.now();
    const newInvoice = {
      subscriptionId,
      userId,
      amount: Number(amount),
      currency: 'INR',
      billingMonth,
      dueDate: Number(dueDate),
      status: 'pending',
      invoiceNumber,
      cycleNumber,
      createdAt: now,
      paidAt: 0,
      paymentTransactionId: '',
      serviceName: serviceName || '',
      vehicleReg: vehicleReg || '',
      billingCycleStart: now,
      billingCycleEnd: now,
    };

    const docRef = await db.collection('invoices').add(newInvoice);

    await writeAuditLog(
      'admin',
      'invoice_created',
      docRef.id,
      'invoice',
      `Manually created invoice ${invoiceNumber} of ${amount} INR for subscription ${subscriptionId}`
    );

    return NextResponse.json({ id: docRef.id, ...newInvoice });
  } catch (error: any) {
    console.error('Invoice create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
