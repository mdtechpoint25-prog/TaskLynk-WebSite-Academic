"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock, PauseCircle, CheckCircle, PlayCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

type Job = {
  id: number;
  displayId: string;
  orderNumber: string | null;
  title: string;
  workType: string;
  amount: number;
  deadline: string;
  actualDeadline: string;
  status: string;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
  createdAt: string;
};

export default function ManagerInProgressOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [holdingId, setHoldingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/orders?managerId=${user?.id}&status=in_progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        toast.error('Failed to fetch in-progress orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handlePutOnHold = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setHoldingId(jobId);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'on_hold' })
      });
      if (response.ok) {
        toast.success('Order put on hold');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to put order on hold');
      }
    } catch (e) {
      console.error('Failed to put order on hold', e);
      toast.error('Failed to put order on hold');
    } finally {
      setHoldingId(null);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('bearer_token');
      const res = await fetch(`/api/manager/orders?managerId=${user.id}&status=in_progress&format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        toast.error('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manager-in-progress-orders-${user.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Orders exported successfully');
    } catch (e) {
      console.error('Export failed', e);
      toast.error('Export failed');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <PlayCircle className="w-8 h-8 text-purple-600" />
          In Progress Orders
        </h1>
        <p className="text-muted-foreground">
          Orders currently being worked on by assigned writers
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>In Progress ({jobs.length})</CardTitle>
              <CardDescription>Manage orders that are underway</CardDescription>
            </div>
            <Button size="sm" onClick={handleExport} variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No In Progress Orders</p>
              <p className="text-sm">You'll see orders here once writers start working on them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Writer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/manager/jobs/${job.id}`)}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/manager/jobs/${job.id}`} className="text-primary hover:underline font-semibold">
                          {job.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{job.orderNumber || 'N/A'}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{job.title}</TableCell>
                      <TableCell>{job.client?.name || 'Unknown'}</TableCell>
                      <TableCell>{job.writer?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize rounded-xl">{job.workType}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">KSh {job.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(job.actualDeadline || job.deadline), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/manager/jobs/${job.id}`}>
                            <Button size="sm" variant="outline" className="rounded-xl">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 rounded-xl"
                            onClick={(e) => handlePutOnHold(job.id, e)}
                            disabled={holdingId === job.id}
                          >
                            <PauseCircle className="w-4 h-4 mr-1" />
                            {holdingId === job.id ? 'Holding...' : 'Put On Hold'}
                          </Button>
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
    </div>
  );
}