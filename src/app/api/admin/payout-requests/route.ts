import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';

interface PayoutRequest {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  approvedDate?: string;
  processedDate?: string;
  rejectionReason?: string;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

// GET - Fetch all payout requests with optional filtering
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // TODO: Query payout requests from database
    // This is a placeholder - replace with actual database query
    const payoutRequests: PayoutRequest[] = [
      {
        id: '1',
        freelancerId: 'freelancer-1',
        freelancerName: 'John Doe',
        freelancerEmail: 'john@example.com',
        amount: 50000,
        status: 'pending',
        requestDate: new Date().toISOString(),
      },
      {
        id: '2',
        freelancerId: 'freelancer-2',
        freelancerName: 'Jane Smith',
        freelancerEmail: 'jane@example.com',
        amount: 75000,
        status: 'approved',
        requestDate: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // Filter by status if provided
    const filteredRequests = status && status !== 'all'
      ? payoutRequests.filter(req => req.status === status)
      : payoutRequests;

    return NextResponse.json(filteredRequests);
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new payout request (for freelancers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { freelancerId, amount, bankAccount } = body;

    if (!freelancerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // TODO: Verify freelancer has sufficient balance
    // TODO: Create payout request in database
    
    const newPayoutRequest = {
      id: `payout-${Date.now()}`,
      freelancerId,
      amount,
      status: 'pending',
      requestDate: new Date().toISOString(),
    };

    return NextResponse.json(newPayoutRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating payout request:', error);
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    );
  }
}
