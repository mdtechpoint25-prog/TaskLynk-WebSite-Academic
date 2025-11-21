"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  deadline: string;
  status: string;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
  createdAt: string;
};

export default function ManagerCancelledOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

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
      const response = await fetch(`/api/manager/orders?managerId=${user?.id}&status=cancelled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        toast.error('Failed to load cancelled orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('bearer_token');
      const res = await fetch(`/api/manager/orders?managerId=${user.id}&status=cancelled&format=csv`, {
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
      a.download = `manager-cancelled-orders-${user.id}.csv`;
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
          <XCircle className="w-8 h-8 text-red-600" />
          Cancelled Orders
        </h1>
        <p className="text-muted-foreground">
          Orders that were cancelled by admin or client
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="destructive" className="rounded-xl">{jobs.length}</Badge>
                Cancelled Orders
              </CardTitle>
              <CardDescription>
                Review cancelled order history
              </CardDescription>
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
              <XCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Cancelled Orders</p>
              <p className="text-sm">Cancelled orders will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Writer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cancelled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 cursor-pointer transition-colors" onClick={() => router.push(`/manager/jobs/${job.id}`)}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/manager/jobs/${job.id}`} className="text-primary hover:underline font-semibold">
                          {job.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium line-through text-muted-foreground max-w-xs truncate">{job.title}</TableCell>
                      <TableCell>{job.client?.name || 'Unknown'}</TableCell>
                      <TableCell>{job.writer?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize rounded-xl">{job.workType}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">KSh {job.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Link href={`/manager/jobs/${job.id}`}>
                          <Button size="sm" variant="outline" className="rounded-xl">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
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