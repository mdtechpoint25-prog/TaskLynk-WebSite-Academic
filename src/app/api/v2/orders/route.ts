import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/v2/orders - List orders with role-based filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role required' }, { status: 400 });
    }

    const uid = parseInt(userId);
    let baseQuery;

    // Role-based filtering with proper manager_id support
    if (role === 'admin') {
      // Admin sees all orders
      if (status) {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.status, status))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs).orderBy(desc(jobs.createdAt));
      }
    } else if (role === 'manager') {
      // 🔴 FIX: Manager only sees orders assigned to them
      if (status) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.managerId, uid),
            eq(jobs.status, status)
          ))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.managerId, uid))
          .orderBy(desc(jobs.createdAt));
      }
    } else if (role === 'client' || role === 'account_owner') {
      // Client sees their own orders
      if (status) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.clientId, uid),
            eq(jobs.status, status)
          ))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.clientId, uid))
          .orderBy(desc(jobs.createdAt));
      }
    } else if (role === 'freelancer') {
      // Freelancer sees assigned orders
      if (status) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.assignedFreelancerId, uid),
            eq(jobs.status, status)
          ))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.assignedFreelancerId, uid))
          .orderBy(desc(jobs.createdAt));
      }
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const orders = await baseQuery;

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/v2/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      title,
      instructions,
      workType,
      pages,
      slides,
      clientCpp,
      writerCpp,
      deadline,
    } = body;

    if (!clientId || !title || !workType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const units = workType === 'slides' ? (slides || 0) : (pages || 0);
    
    // Calculate amounts
    const clientTotal = (clientCpp || 250) * units;
    const writerTotal = (writerCpp || 200) * units;
    
    // 🔴 FIX: Manager earnings start at 0, will be added on assignment (10 KSh) and submission
    const managerTotal = 0;
    const platformFee = Math.max(clientTotal - writerTotal - managerTotal, 0);

    // Generate order number
    const orderCount = await db.select().from(jobs);
    const orderNumber = `ORD${String(orderCount.length + 1).padStart(6, '0')}`;

    const [newOrder] = await db.insert(jobs).values({
      displayId: orderNumber,
      orderNumber,
      orderId: orderNumber,
      clientId: parseInt(clientId),
      title,
      instructions: instructions || '',
      workType,
      pages: pages || null,
      slides: slides || null,
      amount: clientTotal,
      freelancerEarnings: writerTotal,
      managerEarnings: managerTotal,
      adminProfit: platformFee,
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      actualDeadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      freelancerDeadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      adminApproved: false,
      clientApproved: false,
      paymentConfirmed: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ 
      order: newOrder,
      message: 'Order created successfully. Pending admin approval.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}