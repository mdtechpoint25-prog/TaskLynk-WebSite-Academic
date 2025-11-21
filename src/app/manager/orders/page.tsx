"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, AlignJustify, RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

type Order = {
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
  singleSpaced: boolean | null;
  baseCpp: number | null;
  effectiveCpp: number | null;
  client?: {
    id: number;
    displayId: string;
    name: string;
  } | null;
  writer?: {
    id: number;
    displayId: string;
    name: string;
  } | null;
};

export default function ManagerOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const hasCheckedAuth = useRef(false);

  // Sync filter with URL query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const allowed = [
      'all','pending','approved','accepted','assigned','in_progress','editing','delivered','completed','paid','on_hold','cancelled','revision'
    ];
    const apply = () => {
      const qp = new URLSearchParams(window.location.search).get('status');
      if (qp && allowed.includes(qp) && qp !== filter) setFilter(qp);
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
      url.searchParams.set('status', filter);
    }
    window.history.replaceState({}, '', url.toString());
  }, [filter]);

  // Countdown helper
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

  // Auth check
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'manager') {
      router.replace('/');
    } else {
      fetchOrders();
    }
  }, [loading, user, router]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      if (!silent) setRefreshing(true);
      
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/orders?managerId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      if (!silent) toast.error('Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchOrders(false);
    toast.success('Refreshing orders...');
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('bearer_token');
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/manager/orders?managerId=${user.id}${statusParam}&format=csv`, {
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
      a.download = `manager-orders-${filter}-${user.id}.csv`;
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

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  // Status badges
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
  const count = (s: string) => orders.filter(o => o.status === s).length;
  const total = orders.length;

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
                View and manage all orders from your assigned clients and writers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleExport}
                className="rounded-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Export CSV
              </Button>
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
              <p className="text-xs text-muted-foreground mb-1">Delivered</p>
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
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:grid-cols-12 mb-4 rounded-xl">
            <TabsTrigger value="all" className="text-xs rounded-lg">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs rounded-lg">Approved</TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs rounded-lg">Accepted</TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs rounded-lg">Assigned</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs rounded-lg">In Progress</TabsTrigger>
            <TabsTrigger value="editing" className="text-xs rounded-lg">Editing</TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs rounded-lg">Delivered</TabsTrigger>
            <TabsTrigger value="revision" className="text-xs rounded-lg">Revision</TabsTrigger>
            <TabsTrigger value="paid" className="text-xs rounded-lg">Paid</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs rounded-lg">Completed</TabsTrigger>
            <TabsTrigger value="on_hold" className="text-xs rounded-lg">On Hold</TabsTrigger>
          </TabsList>

          {/* Orders list */}
          <TabsContent value={filter} className="mt-0">
            <Card className="shadow-lg border-2 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl capitalize">{filter.replace('_', ' ')} Orders</CardTitle>
                <CardDescription>
                  {filter === 'all' && 'All orders from your assigned clients and writers'}
                  {filter === 'pending' && 'Orders awaiting your acceptance'}
                  {filter === 'approved' && 'Orders approved and ready for assignment'}
                  {filter === 'accepted' && 'Orders you have accepted'}
                  {filter === 'assigned' && 'Orders assigned to writers'}
                  {filter === 'in_progress' && 'Orders currently being worked on'}
                  {filter === 'editing' && 'Orders submitted by writers awaiting review'}
                  {filter === 'delivered' && 'Orders delivered to client awaiting approval'}
                  {filter === 'revision' && 'Orders in revision stage'}
                  {filter === 'paid' && 'Orders that have been paid for'}
                  {filter === 'completed' && 'Successfully completed orders'}
                  {filter === 'on_hold' && 'Orders temporarily paused'}
                  {filter === 'cancelled' && 'Cancelled orders'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No orders found</p>
                    <p className="text-muted-foreground">
                      No orders match the selected filter
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const deadlineToUse = order.actualDeadline || order.deadline;
                      const cd = getCountdown(deadlineToUse);
                      const displayCpp = order.effectiveCpp || order.baseCpp || (order.pages ? order.amount / order.pages : 0);
                      
                      return (
                        <div
                          key={order.id}
                          onClick={() => router.push(`/manager/orders/${order.id}`)}
                          className="border-2 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg sm:text-xl text-foreground">
                                  {order.title}
                                </h3>
                                {order.displayId && (
                                  <span className="text-xs font-mono px-2.5 py-1 rounded-xl font-semibold text-primary bg-primary/10">
                                    {order.displayId}
                                  </span>
                                )}
                                {order.singleSpaced && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 rounded-xl">
                                    <AlignJustify className="w-3 h-3 mr-1" />
                                    Single Spaced
                                  </Badge>
                                )}
                              </div>
                              {order.client?.name && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Client: <span className="font-medium">{order.client.name}</span>
                                </p>
                              )}
                              {order.writer?.name && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Writer: <span className="font-medium">{order.writer.name}</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="capitalize font-medium">{order.workType}</span>
                            <span>•</span>
                            {order.pages && (
                              <>
                                <span>{order.pages} page{order.pages > 1 ? 's' : ''}</span>
                                <span>•</span>
                              </>
                            )}
                            {order.slides && (
                              <>
                                <span>{order.slides} slide{order.slides > 1 ? 's' : ''}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="font-bold text-foreground">
                              KSh {order.amount.toFixed(2)}
                            </span>
                            {order.pages && displayCpp > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-xs">(CPP: KSh {displayCpp.toFixed(0)})</span>
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
                              Posted: {format(new Date(order.createdAt), 'MMM dd, yyyy')}
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
