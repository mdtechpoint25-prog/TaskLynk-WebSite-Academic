"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, X, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Bid = {
  id: number;
  jobId: number;
  jobTitle: string;
  freelancerId: number;
  freelancerName: string;
  bidAmount: number;
  message: string;
  status: string;
  createdAt: string;
};

export default function ClientBidsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else {
        fetchBids();
      }
    }
  }, [user, loading, router]);

  const fetchBids = async () => {
    try {
      setLoadingBids(true);
      const response = await fetch(`/api/client/bids?clientId=${user?.id}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || []);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoadingBids(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    setSelectedBid(bid);
    setDialogOpen(true);
  };

  const confirmAccept = async () => {
    if (!selectedBid) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/bids/${selectedBid.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedBid.jobId }),
      });

      if (response.ok) {
        toast.success('Bid accepted successfully!');
        setDialogOpen(false);
        fetchBids();
      } else {
        toast.error('Failed to accept bid');
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast.error('Error accepting bid');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectBid = async (bidId: number) => {
    try {
      const response = await fetch(`/api/bids/${bidId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Bid rejected');
        fetchBids();
      } else {
        toast.error('Failed to reject bid');
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast.error('Error rejecting bid');
    }
  };

  if (loading || loadingBids) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Freelancer Bids</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage bids from freelancers on your orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Bids ({bids.length})</CardTitle>
          <CardDescription>
            Accept or reject bids to assign freelancers to your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <Alert>
              <AlertDescription>
                No bids yet. Orders you post will receive bids from freelancers.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell className="font-medium">{bid.jobTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {bid.freelancerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold">
                          <DollarSign className="h-4 w-4" />
                          {bid.bidAmount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        {bid.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bid.status === 'accepted' ? 'default' : 'secondary'}>
                          {bid.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {bid.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcceptBid(bid)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectBid(bid.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Bid</DialogTitle>
            <DialogDescription>
              Accept this bid to assign the freelancer to the order
            </DialogDescription>
          </DialogHeader>
          {selectedBid && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Job</p>
                  <p className="font-semibold">{selectedBid.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Freelancer</p>
                  <p className="font-semibold">{selectedBid.freelancerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bid Amount</p>
                  <p className="font-semibold">${selectedBid.bidAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAccept} disabled={processing}>
              {processing ? 'Processing...' : 'Accept Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
