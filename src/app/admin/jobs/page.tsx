"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, UserPlus, FileText, Clock, PauseCircle, AlignJustify, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

type Job = {
  id: number;
  clientId: number;
  clientName?: string | null;
  displayId: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  freelancerDeadline?: string;
  status: string;
  assignedFreelancerId: number | null;
  freelancerName?: string | null;
  adminApproved: boolean;
  createdAt: string;
  singleSpaced: boolean | null;
  baseCpp: number | null;
  effectiveCpp: number | null;
};

type Bid = {
  id: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
};

export default function AdminJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<{[key: number]: Bid[]}>({});
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('pending');
  const hasCheckedAuth = useRef(false);

  // Sync filter with URL query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const allowed = [
      'all','pending','approved','accepted','assigned','in_progress','editing','delivered','completed','paid','on_hold','cancelled','revision','revisions'
    ];
    const apply = () => {
      const qp = new URLSearchParams(window.location.search).get('status');
      if (qp && allowed.includes(qp) && qp !== filter) setFilter(qp === 'revisions' ? 'revision' : qp);
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, [filter]);

  // Update URL when filter changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (filter === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', filter === 'revision' ? 'revisions' : filter);
    }
    window.history.replaceState({}, '', url.toString());
  }, [filter]);

  // Countdown helper (no live timer - just calculate once per render)
  const getCountdown = (deadlineStr: string) => {
    const due = new Date(deadlineStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    if (isNaN(due.getTime())) return { text: '-', expired: false, urgent: false };
    if (diffMs <= 0) return { text: 'Expired', expired: true, urgent: true };
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const urgent = diffMs <= twelveHoursMs;
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return { text: `${d}d ${h}h ${m}m`, expired: false, urgent };
    if (h > 0) return { text: `${h}h ${m}m`, expired: false, urgent };
    return { text: `${m}m`, expired: false, urgent };
  };

  // Auth check - runs once
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchJobs();
    }
  }, [loading, user, router]);

  const fetchJobs = async (silent = false) => {
    try {
      if (!silent) setLoadingJobs(true);
      if (!silent) setRefreshing(true);
      
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
        
        // Fetch bids count for each job
        data.forEach(async (job: Job) => {
          const bidsResponse = await fetch(`/api/bids?jobId=${job.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            setBids(prev => ({ ...prev, [job.id]: bidsData }));
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (!silent) toast.error('Failed to fetch orders');
    } finally {
      setLoadingJobs(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchJobs(false);
    toast.success('Refreshing orders...');
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'all') return true;
    if (filter === 'on_hold') return j.status === 'on_hold';
    return j.status === filter;
  });

  // Clear, consistent status badges per spec
  const getStatusBadge = (status: string) => {
    const cls: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      approved: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100',
      assigned: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      editing: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      revision: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      paid: 'bg-amber-200 text-amber-900 dark:bg-amber-700 dark:text-amber-100',
      completed: 'bg-emerald-700 text-white',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    };
    const label = status.replace('_', ' ');
    return <Badge className={`${cls[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'} capitalize`}>{label}</Badge>;
  };

  // Quick counts for stats
  const count = (s: string) => jobs.filter(j => j.status === s).length;
  const total = jobs.length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <div className="w-full p-6">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Management</h1>
              <p className="text-muted-foreground">
                View and manage all orders on the platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="rounded-xl"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* At-a-glance stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="shadow-sm border rounded-2xl">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{total}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border rounded-2xl">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{count('pending')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border rounded-2xl">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{count('in_progress')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border rounded-2xl">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="text-2xl font-bold text-green-600">{count('delivered')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border rounded-2xl">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-1">Revisions</p>
              <p className="text-2xl font-bold text-orange-600">{count('revision')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border rounded-2xl">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{count('completed')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:grid-cols-9 mb-4 rounded-xl">
            <TabsTrigger value="all" className="text-xs rounded-lg">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs rounded-lg">Approved</TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs rounded-lg">Assigned</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs rounded-lg">In Progress</TabsTrigger>
            <TabsTrigger value="editing" className="text-xs rounded-lg">Editing</TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs rounded-lg">Delivered</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs rounded-lg">Completed</TabsTrigger>
            <TabsTrigger value="revision" className="text-xs rounded-lg">Revisions</TabsTrigger>
          </TabsList>

          {/* Orders list - Card based */}
          <TabsContent value={filter} className="mt-0">
            <Card className="shadow-lg border-2 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl capitalize">{filter.replace('_', ' ')} Orders</CardTitle>
                <CardDescription>
                  {filter === 'all' && 'All orders regardless of status'}
                  {filter === 'pending' && 'Orders waiting for admin approval before being available for assignment'}
                  {filter === 'approved' && 'Orders approved by admin and ready to assign to freelancers'}
                  {filter === 'accepted' && 'Orders that have been accepted and approved by the client after delivery'}
                  {filter === 'assigned' && 'Orders assigned to freelancers'}
                  {filter === 'in_progress' && 'Orders currently being worked on'}
                  {filter === 'editing' && 'Orders submitted by freelancers awaiting admin review'}
                  {filter === 'delivered' && 'Orders delivered to client and awaiting client approval'}
                  {filter === 'paid' && 'Orders that have been paid for by the client'}
                  {filter === 'completed' && 'Successfully completed orders'}
                  {filter === 'on_hold' && 'Orders temporarily paused or on hold'}
                  {filter === 'revision' && 'Orders in revision stage'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading orders...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No orders found</p>
                    <p className="text-muted-foreground">
                      No orders match the selected filter
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredJobs.map((job) => {
                      const jobBids = bids[job.id] || [];
                      const lowestBid = jobBids.length > 0 ? Math.min(...jobBids.map(b => b.bidAmount)) : null;
                      const deadlineToUse = (job as any).freelancerDeadline || job.deadline;
                      const cd = getCountdown(deadlineToUse);
                      const displayCpp = job.effectiveCpp || job.baseCpp || (job.pages ? job.amount / job.pages : 0);
                      
                      return (
                        <div
                          key={job.id}
                          onClick={() => router.push(`/admin/jobs/${job.id}`)}
                          className="border-2 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg sm:text-xl text-foreground">
                                  {job.title}
                                </h3>
                                {job.displayId && (
                                  <span className="text-xs font-mono px-2.5 py-1 rounded-xl font-semibold text-primary bg-primary/10">
                                    {job.displayId}
                                  </span>
                                )}
                                {job.singleSpaced && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 rounded-xl">
                                    <AlignJustify className="w-3 h-3 mr-1" />
                                    Single Spaced
                                  </Badge>
                                )}
                                {jobBids.length > 0 && (
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200 rounded-xl">
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    {jobBids.length} {jobBids.length === 1 ? 'Bid' : 'Bids'}
                                  </Badge>
                                )}
                              </div>
                              {job.clientName && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Client: <span className="font-medium">{job.clientName}</span>
                                </p>
                              )}
                              {job.freelancerName && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Writer: <span className="font-medium">{job.freelancerName}</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(job.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="capitalize font-medium">{job.workType}</span>
                            <span>•</span>
                            {job.pages && (
                              <>
                                <span>{job.pages} page{job.pages > 1 ? 's' : ''}</span>
                                <span>•</span>
                              </>
                            )}
                            {job.slides && (
                              <>
                                <span>{job.slides} slide{job.slides > 1 ? 's' : ''}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="font-bold text-foreground">
                              KSh {job.amount.toFixed(2)}
                            </span>
                            {job.pages && displayCpp > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-xs">(CPP: KSh {displayCpp.toFixed(0)})</span>
                              </>
                            )}
                            {lowestBid && lowestBid < job.amount && (
                              <>
                                <span>•</span>
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Lowest bid: KSh {lowestBid.toFixed(2)}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(deadlineToUse), 'MMM dd, yyyy')}
                              <span className={`ml-1 ${cd.expired || cd.urgent ? 'text-red-600' : 'text-green-600'}`}>
                                ({cd.text})
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              Posted: {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}