"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Calendar, Download, PauseCircle, AlignJustify } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  editing: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
  delivered: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  revision: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
};

export default function ManagerAllOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchOrders();
      }
    }
  }, [user, loading, router]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/orders?managerId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('bearer_token');
      const res = await fetch(`/api/manager/orders?managerId=${user.id}&format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manager-orders-${user.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const authHeaders = () => {
    const token = localStorage.getItem('bearer_token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } as HeadersInit;
  };

  const handlePutOnHold = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/jobs/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'on_hold' }),
      });
      if (res.ok) {
        toast.success('Order put on hold');
        fetchOrders();
      } else {
        toast.error('Failed to put order on hold');
      }
    } catch (err) {
      console.error('Failed to put order on hold', err);
      toast.error('Failed to put order on hold');
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
    <div className="dashboard-container">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="dashboard-main">
        <div className="dashboard-inner">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              All Orders
            </h1>
            <p className="text-muted-foreground">
              Complete overview of all orders from your assigned clients and writers
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>All Orders ({orders.length})</CardTitle>
                  <CardDescription>
                    View and manage all orders across all statuses
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleExport} className="shrink-0">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">No Orders Found</p>
                  <p className="text-sm text-muted-foreground">
                    There are no orders from your assigned clients and writers yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Writer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const displayCpp = order.effectiveCpp || order.baseCpp || (order.pages ? order.amount / order.pages : 0);
                        
                        return (
                          <TableRow 
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell>
                              <Link href={`/manager/jobs/${order.id}`} className="font-mono text-xs text-primary font-semibold hover:underline">
                                {order.displayId}
                              </Link>
                            </TableCell>
                            <TableCell className="font-medium max-w-xs">
                              <div className="flex flex-col gap-1">
                                <span className="truncate">{order.title}</span>
                                {order.singleSpaced && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 text-xs w-fit">
                                    <AlignJustify className="w-3 h-3 mr-1" />
                                    Single Spaced
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {order.workType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {order.client?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {order.writer?.name || 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-green-600">KSh {order.amount.toFixed(2)}</span>
                                {order.pages && displayCpp > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    CPP: KSh {displayCpp.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}
                              >
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(order.actualDeadline || order.deadline), 'MMM dd, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/manager/jobs/${order.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </Link>
                                {order.status !== 'on_hold' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                                    onClick={(e) => handlePutOnHold(order.id, e)}
                                  >
                                    <PauseCircle className="w-4 h-4 mr-1" />
                                    Put On Hold
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}