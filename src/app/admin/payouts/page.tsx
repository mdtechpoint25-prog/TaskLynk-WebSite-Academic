'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function PayoutsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('pending');

  const fetchPayouts = useCallback(async () => {
    try {
      setLoadingPayouts(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(
        `/api/admin/payout-requests?status=${filter === 'all' ? '' : filter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setPayouts(data || []);
    } catch (error) {
      toast.error('Failed to load payout requests');
      console.error(error);
    } finally {
      setLoadingPayouts(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchPayouts();
      }
    }
  }, [user, loading, router, fetchPayouts]);

  const handleApprove = useCallback(async () => {
    if (!selectedPayout) return;
    try {
      setApproving(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(
        `/api/admin/payout-requests/${selectedPayout.id}/approve`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        toast.success('Payout request approved');
        setApproveOpen(false);
        setNotes('');
        fetchPayouts();
      } else {
        toast.error('Failed to approve payout request');
      }
    } catch (error) {
      toast.error('Error approving payout request');
      console.error(error);
    } finally {
      setApproving(false);
    }
  }, [selectedPayout, notes, fetchPayouts]);

  const handleProcess = useCallback(async () => {
    if (!selectedPayout) return;
    try {
      setApproving(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(
        `/api/admin/payout-requests/${selectedPayout.id}/process`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        toast.success('Payout processed successfully');
        setProcessOpen(false);
        setNotes('');
        fetchPayouts();
      } else {
        toast.error('Failed to process payout');
      }
    } catch (error) {
      toast.error('Error processing payout');
      console.error(error);
    } finally {
      setApproving(false);
    }
  }, [selectedPayout, notes, fetchPayouts]);

  const handleReject = useCallback(async () => {
    if (!selectedPayout) return;
    try {
      setApproving(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(
        `/api/admin/payout-requests/${selectedPayout.id}/reject`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        toast.success('Payout request rejected');
        setRejectOpen(false);
        setRejectionReason('');
        fetchPayouts();
      } else {
        toast.error('Failed to reject payout request');
      }
    } catch (error) {
      toast.error('Error rejecting payout request');
      console.error(error);
    } finally {
      setApproving(false);
    }
  }, [selectedPayout, rejectionReason, fetchPayouts]);

  const stats = useMemo(() => ({
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved').length,
    processing: payouts.filter(p => p.status === 'processing').length,
    completed: payouts.filter(p => p.status === 'completed').length,
    totalPending: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
  }), [payouts]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-3 md:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage freelancer payout requests and process payments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-sm font-medium text-muted-foreground">Pending Requests</div>
          <div className="text-3xl font-bold mt-2">{stats.pending}</div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-sm font-medium text-muted-foreground">Total Pending Amount</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            KES {stats.totalPending.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-sm font-medium text-muted-foreground">Approved</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.approved}</div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize rounded-xl"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Payouts Table */}
      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Freelancer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPayouts ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading payouts...
                  </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No payout requests found
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.freelancerName}</TableCell>
                    <TableCell className="text-sm">{payout.freelancerEmail}</TableCell>
                    <TableCell className="font-semibold">
                      KES {payout.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payout.status]}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(payout.requestDate), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {payout.status === 'pending' && (
                          <>
                            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600"
                                  onClick={() => setSelectedPayout(payout)}
                                >
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Payout Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Freelancer</Label>
                                    <Input
                                      disabled
                                      value={selectedPayout?.freelancerName || ''}
                                    />
                                  </div>
                                  <div>
                                    <Label>Amount</Label>
                                    <Input
                                      disabled
                                      value={`KES ${selectedPayout?.amount.toLocaleString()}`}
                                    />
                                  </div>
                                  <div>
                                    <Label>Notes (optional)</Label>
                                    <Textarea
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Add any notes about this approval..."
                                    />
                                  </div>
                                  <Button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                  >
                                    {approving ? 'Approving...' : 'Approve'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => setSelectedPayout(payout)}
                                >
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Payout Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Freelancer</Label>
                                    <Input
                                      disabled
                                      value={selectedPayout?.freelancerName || ''}
                                    />
                                  </div>
                                  <div>
                                    <Label>Rejection Reason *</Label>
                                    <Textarea
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Please explain why this payout is being rejected..."
                                    />
                                  </div>
                                  <Button
                                    onClick={handleReject}
                                    disabled={approving || !rejectionReason}
                                    className="w-full bg-red-600 hover:bg-red-700"
                                  >
                                    {approving ? 'Rejecting...' : 'Reject'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {payout.status === 'approved' && (
                          <Dialog open={processOpen} onOpenChange={setProcessOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedPayout(payout)}
                              >
                                Process
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Payout</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Freelancer</Label>
                                  <Input
                                    disabled
                                    value={selectedPayout?.freelancerName || ''}
                                  />
                                </div>
                                <div>
                                  <Label>Amount</Label>
                                  <Input
                                    disabled
                                    value={`KES ${selectedPayout?.amount.toLocaleString()}`}
                                  />
                                </div>
                                {selectedPayout?.bankAccount && (
                                  <>
                                    <div className="bg-muted p-3 rounded">
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Account:</strong>{' '}
                                        {selectedPayout.bankAccount.accountName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Bank:</strong>{' '}
                                        {selectedPayout.bankAccount.bankName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Number:</strong>{' '}
                                        {selectedPayout.bankAccount.accountNumber}
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <Label>Notes (optional)</Label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about this payment..."
                                  />
                                </div>
                                <Button
                                  onClick={handleProcess}
                                  disabled={approving}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  {approving ? 'Processing...' : 'Process Payment'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // View details
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}