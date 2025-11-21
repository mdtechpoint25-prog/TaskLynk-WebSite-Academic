"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

type Order = {
  id: number;
  displayId?: string;
  orderNumber: string;
  title: string;
  pages: number | null;
  slides: number | null;
  deadline: string;
  actualDeadline: string;
  status: string;
  amount: number;
  client?: { name: string };
  writer?: { name: string };
};

type DashboardData = {
  manager: any;
  stats: {
    totalClients: number;
    totalWriters: number;
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    deliveredOrders: number;
    completedOrders: number;
    revisionOrders: number;
  };
  clients: any[];
  writers: any[];
  orders: Order[];
};

export default function ManagerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const hasCheckedAuth = useRef(false);
  const hasFetchedData = useRef(false);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      setError(null);
      const timestamp = Date.now();
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(`/api/manager/dashboard?managerId=${user.id}&_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch dashboard data');
        toast.error(errorData.error || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Network error. Please check your connection.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    if (user.role !== 'manager') {
      window.location.href = '/';
      return;
    }
    
    // Fetch data only once on mount
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchDashboardData();
    }
  }, [user, loading]);

  const handleExportOrders = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/orders?managerId=${user.id}&format=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manager-orders-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Orders exported successfully');
      } else {
        toast.error('Failed to export orders');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const statusFlow = [
    { label: 'Pending', count: dashboardData?.stats.pendingOrders || 0, color: 'bg-yellow-500' },
    { label: 'Progress', count: dashboardData?.stats.inProgressOrders || 0, color: 'bg-orange-500' },
    { label: 'Delivered', count: dashboardData?.stats.deliveredOrders || 0, color: 'bg-blue-500' },
    { label: 'Completed', count: dashboardData?.stats.completedOrders || 0, color: 'bg-green-500' },
    { label: 'Revision', count: dashboardData?.stats.revisionOrders || 0, color: 'bg-cyan-500' },
  ];

  const filteredOrders = (dashboardData?.orders || []).filter(order =>
    (order.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full -m-6">
      {loadingData ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading dashboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} size="sm">Retry</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b">
            <Card className="rounded-none border-0 border-r">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{dashboardData?.stats.totalClients || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Clients</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none border-0 border-r">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{dashboardData?.stats.totalWriters || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Writers</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none border-0 border-r">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{dashboardData?.stats.totalOrders || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none border-0">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{dashboardData?.stats.completedOrders || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white dark:bg-gray-800 border-y p-3">
            <div className="flex items-center justify-between gap-2 min-w-max overflow-x-auto">
              {statusFlow.map((status, index) => (
                <div key={status.label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${status.color} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                      {status.count}
                    </div>
                    <p className="text-[10px] mt-1.5 font-medium text-center whitespace-nowrap">{status.label}</p>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className="w-6 h-0.5 bg-gray-300 dark:bg-gray-600 mx-1.5"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 px-4 py-3 border-b">
            <Input
              type="text"
              placeholder="Search orders by ID or title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md text-xs h-8"
            />
            <Button onClick={handleExportOrders} size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>

          <Card className="rounded-none border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 px-3 text-xs font-semibold">ORDER</th>
                      <th className="pb-2 px-3 text-xs font-semibold">Topic</th>
                      <th className="pb-2 px-3 text-xs font-semibold">Client</th>
                      <th className="pb-2 px-3 text-xs font-semibold">Writer</th>
                      <th className="pb-2 px-3 text-xs font-semibold">Status</th>
                      <th className="pb-2 px-3 text-xs font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.slice(0, 20).map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => router.push(`/manager/orders/${order.id}`)}
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2 px-3 text-xs text-primary font-mono">{order.displayId || order.orderNumber}</td>
                          <td className="py-2 px-3 text-xs truncate max-w-[200px]">{order.title}</td>
                          <td className="py-2 px-3 text-xs">{order.client?.name || '-'}</td>
                          <td className="py-2 px-3 text-xs">{order.writer?.name || '-'}</td>
                          <td className="py-2 px-3">
                            <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0.5">
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-xs font-bold text-right">
                            KSh {Number(order.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Showing {Math.min(filteredOrders.length, 20)} of {filteredOrders.length} orders
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}