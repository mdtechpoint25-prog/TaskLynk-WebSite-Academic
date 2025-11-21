"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PauseCircle, Eye, FileText, Clock, CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  deadline: string;
  status: string;
  assignedFreelancerId: number | null;
  createdAt: string;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
};

export default function ManagerOnHoldOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [resumingId, setResumingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchOnHoldJobs();
      }
    }
  }, [user, loading, router]);

  const fetchOnHoldJobs = async () => {
    try {
      setLoadingJobs(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/orders?managerId=${user?.id}&status=on_hold`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        toast.error('Failed to load on-hold orders');
      }
    } catch (error) {
      console.error('Failed to fetch on-hold jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleResumeOrder = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setResumingId(jobId);
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      // Determine the previous status to resume to
      let resumeStatus = 'approved';
      if (job.assignedFreelancerId) {
        resumeStatus = 'assigned';
      }

      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: resumeStatus }),
      });

      if (response.ok) {
        toast.success('Order resumed successfully');
        fetchOnHoldJobs();
      } else {
        toast.error('Failed to resume order');
      }
    } catch (error) {
      console.error('Failed to resume order:', error);
      toast.error('Failed to resume order');
    } finally {
      setResumingId(null);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('bearer_token');
      const res = await fetch(`/api/manager/orders?managerId=${user.id}&status=on_hold&format=csv`, {
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
      a.download = `manager-on-hold-orders-${user.id}.csv`;
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
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <PauseCircle className="w-8 h-8 text-orange-600" />
          On Hold Orders
        </h1>
        <p className="text-muted-foreground">
          Orders that have been temporarily paused or put on hold
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>On Hold Orders ({jobs.length})</CardTitle>
              <CardDescription>
                These orders are temporarily paused and require attention
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
            <div className="text-center py-12">
              <PauseCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No Orders On Hold</p>
              <p className="text-sm text-muted-foreground">
                All orders are currently active or completed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Work Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow 
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50 bg-orange-50 dark:bg-orange-950/20"
                      onClick={() => router.push(`/manager/jobs/${job.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Link 
                          href={`/manager/jobs/${job.id}`}
                          className="font-mono text-xs text-primary hover:underline font-semibold"
                        >
                          {job.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span>{job.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{job.client?.name || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize rounded-xl">
                          {job.workType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        KSh {job.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{format(new Date(job.deadline), 'MMM dd, yyyy')}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(job.deadline), 'HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.writer?.name ? (
                          <span className="text-sm">{job.writer.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Link href={`/manager/jobs/${job.id}`}>
                            <Button size="sm" variant="outline" className="rounded-xl">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            className="bg-green-600 text-white hover:bg-green-700 rounded-xl"
                            onClick={(e) => handleResumeOrder(job.id, e)}
                            disabled={resumingId === job.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {resumingId === job.id ? 'Resuming...' : 'Resume'}
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