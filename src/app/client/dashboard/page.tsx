"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FileText, Plus, AlertTriangle, RefreshCw, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string;
  actualDeadline: string;
  createdAt: string;
  pages: number | null;
  slides: number | null;
};

export default function ClientDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const hasCheckedAuth = useRef(false);
  const hasFetchedJobs = useRef(false);

  const fetchJobs = useCallback(async (silent = false) => {
    if (!user) return;
    
    if (!silent) setRefreshing(true);
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/v2/orders?userId=${user.id}&role=client&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const mapped: Job[] = (data.orders || []).map((o: any) => ({
          id: o.id,
          displayId: o.orderNumber || '',
          title: o.title,
          workType: o.workType,
          amount: Number(o.clientTotal ?? 0),
          status: o.status,
          deadline: new Date(o.deadline).toISOString(),
          actualDeadline: new Date(o.deadline).toISOString(),
          createdAt: new Date(o.createdAt).toISOString(),
          pages: o.pageCount || null,
          slides: o.slideCount || null,
        }));
        setJobs(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (!silent) toast.error('Network error');
    } finally {
      setLoadingJobs(false);
      if (!silent) setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    if (user.role !== 'client' && user.role !== 'account_owner') {
      window.location.href = '/';
      return;
    }
    
    // Fetch jobs only once on mount
    if (!hasFetchedJobs.current) {
      hasFetchedJobs.current = true;
      fetchJobs();
    }
  }, [user, loading, fetchJobs]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const inProgressJobs = jobs.filter(j => ['approved', 'assigned', 'in_progress'].includes(j.status));
  const revisionJobs = jobs.filter(j => j.status === 'revision');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  const statusFlow = [
    { label: 'Pending', count: pendingJobs.length, color: 'bg-yellow-500' },
    { label: 'Available', count: jobs.filter(j => j.status === 'available').length, color: 'bg-blue-500' },
    { label: 'Assigned', count: jobs.filter(j => j.status === 'assigned').length, color: 'bg-purple-500' },
    { label: 'Progress', count: jobs.filter(j => j.status === 'in_progress').length, color: 'bg-orange-500' },
    { label: 'Editing', count: jobs.filter(j => j.status === 'editing').length, color: 'bg-indigo-500' },
    { label: 'Completed', count: completedJobs.length, color: 'bg-green-500' },
    { label: 'Revision', count: revisionJobs.length, color: 'bg-cyan-500' },
    { label: 'Cancelled', count: jobs.filter(j => j.status === 'cancelled').length, color: 'bg-red-500' },
    { label: 'Approved', count: jobs.filter(j => j.status === 'approved').length, color: 'bg-emerald-500' },
  ];

  const filteredJobs = jobs.filter(job =>
    job.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full -m-6">
      {!user.approved && (
        <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-none border-y mb-0">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-900 dark:text-amber-200 font-medium ml-2">
            <strong>Account Pending Approval:</strong> Your account is awaiting admin approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold mb-0.5">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome and Thank you</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchJobs(false)} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
            {user.approved && (
              <Link href="/client/new-job">
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">Place New Order</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Status Flow */}
      <div className="bg-white dark:bg-gray-800 border-y py-3 px-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {statusFlow.map((status, index) => (
            <div key={status.label} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full ${status.color} text-white flex items-center justify-center font-bold text-xs shadow-md`}>
                  {status.count}
                </div>
                <p className="text-[9px] mt-1 font-medium text-center whitespace-nowrap">{status.label}</p>
              </div>
              {index < statusFlow.length - 1 && (
                <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Check ratings for each writer, client or editor
        </p>
      </div>

      {/* Search Bar */}
      <div className="py-3 px-4 border-b">
        <Input
          type="text"
          placeholder="Search order by ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs h-8"
        />
      </div>

      {/* Orders Table */}
      {user.approved && (
        <Card className="rounded-none border-0 border-b">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Order History</CardTitle>
              <span className="text-[10px] text-muted-foreground">
                Total orders: {jobs.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {loadingJobs ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-6 bg-muted/30 rounded-lg">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium mb-1">No orders yet</p>
                <p className="text-[10px] text-muted-foreground mb-3">Start by posting your first order</p>
                <Link href="/client/new-job">
                  <Button size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs">Post Your First Order</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 px-2 text-[10px] font-semibold">ID</th>
                      <th className="pb-2 px-2 text-[10px] font-semibold">Topic</th>
                      <th className="pb-2 px-2 text-[10px] font-semibold">Type of Paper</th>
                      <th className="pb-2 px-2 text-[10px] font-semibold">Words</th>
                      <th className="pb-2 px-2 text-[10px] font-semibold">Due in</th>
                      <th className="pb-2 px-2 text-[10px] font-semibold">Status</th>
                      <th className="pb-2 px-2 text-[10px] font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr 
                        key={job.id}
                        onClick={() => router.push(`/client/jobs/${job.id}`)}
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="py-1.5 px-2 text-[10px] text-primary font-mono">{job.displayId}</td>
                        <td className="py-1.5 px-2 text-[10px] font-medium">{job.title}</td>
                        <td className="py-1.5 px-2 text-[10px] capitalize">{job.workType}</td>
                        <td className="py-1.5 px-2 text-[10px]">
                          {job.pages ? `${job.pages}Pgs, ${job.pages * 300} words` : 
                           job.slides ? `${job.slides} slides` : 'N/A'}
                        </td>
                        <td className="py-1.5 px-2 text-[10px]">
                          {new Date(job.actualDeadline).toLocaleDateString()}
                        </td>
                        <td className="py-1.5 px-2">
                          <Badge 
                            variant={
                              job.status === 'completed' ? 'default' :
                              job.status === 'delivered' ? 'default' :
                              job.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                            className="capitalize text-[9px] px-1.5 py-0.5"
                          >
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-2 text-[10px] font-bold text-right">
                          KSh {job.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Section */}
      <div className="flex items-center justify-center gap-2 text-[10px] bg-primary/5 px-4 py-2 border-t border-primary/15">
        <Phone className="w-3 h-3 text-primary" />
        <span className="font-semibold">Call us:</span>
        <a href="tel:0701066845" className="text-primary hover:underline font-bold">0701066845</a>
        <span className="text-muted-foreground">/</span>
        <a href="tel:0702794172" className="text-primary hover:underline font-bold">0702794172</a>
      </div>
    </div>
  );
}