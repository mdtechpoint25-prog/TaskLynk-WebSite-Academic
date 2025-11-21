"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  TrendingUp,
  TrendingDown,
  Eye,
  Activity,
  RefreshCw,
  CheckCircle,
  Clock,
  UserCheck,
  Edit3,
  Send,
  Award,
  PauseCircle
} from 'lucide-react';
import Link from 'next/link';
import { 
  Area, AreaChart, 
  Bar, BarChart, 
  ResponsiveContainer, 
  XAxis, YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

type DashboardData = {
  manager: any;
  stats: {
    totalClients: number;
    totalWriters: number;
    totalOrders: number;
    pendingOrders: number;
    acceptedOrders: number;
    assignedOrders: number;
    editingOrders: number;
    deliveredOrders: number;
    completedOrders: number;
    revisionOrders: number;
    onHoldOrders: number;
  };
  clients: any[];
  writers: any[];
  orders: any[];
};

export default function ManagerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/manager/dashboard?managerId=${user.id}&_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate additional stats
        const stats = {
          ...data.stats,
          acceptedOrders: data.orders.filter((o: any) => o.status === 'accepted').length,
          assignedOrders: data.orders.filter((o: any) => o.status === 'in_progress').length,
          editingOrders: data.orders.filter((o: any) => o.status === 'editing').length,
          onHoldOrders: data.orders.filter((o: any) => o.status === 'on_hold').length,
        };
        
        setDashboardData({ ...data, stats });
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate completion rate
  const completionRate = dashboardData?.stats.totalOrders 
    ? (dashboardData.stats.completedOrders / dashboardData.stats.totalOrders * 100)
    : 0;

  // Prepare chart data from orders
  const prepareChartData = () => {
    if (!dashboardData?.orders) return [];

    const monthlyData: { [key: string]: { completed: number; in_progress: number; pending: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize all months
    months.forEach(month => {
      monthlyData[month] = { completed: 0, in_progress: 0, pending: 0 };
    });

    // Count orders by month and status
    dashboardData.orders.forEach(order => {
      const date = new Date(order.createdAt);
      const month = months[date.getMonth()];
      
      if (order.status === 'completed') {
        monthlyData[month].completed++;
      } else if (order.status === 'in_progress') {
        monthlyData[month].in_progress++;
      } else if (order.status === 'pending') {
        monthlyData[month].pending++;
      }
    });

    return months.map(month => ({
      month,
      ...monthlyData[month]
    }));
  };

  const chartData = prepareChartData();

  // Calculate status distribution
  const statusDistribution = dashboardData?.orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">Manager Dashboard</h1>
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Manage your assigned orders and track progress through the complete workflow</p>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : dashboardData ? (
        <>
          {/* Top Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {/* Total Orders */}
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
              <CardContent className="p-2 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-4">
                  <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold tracking-wide opacity-90">TOTAL ORDERS</div>
                  <FileText className="h-5 w-5 sm:h-8 sm:w-8 md:h-10 md:w-10 opacity-70" />
                </div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">
                  {dashboardData.stats.totalOrders}
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs opacity-80">Assigned Orders</div>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <CardContent className="p-2 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-4">
                  <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold tracking-wide opacity-90">COMPLETION</div>
                  <Award className="h-5 w-5 sm:h-8 sm:w-8 md:h-10 md:w-10 opacity-70" />
                </div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">
                  {completionRate.toFixed(1)}%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs opacity-80">Completion Rate</div>
              </CardContent>
            </Card>

            {/* Total Clients */}
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
              <CardContent className="p-2 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-4">
                  <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold tracking-wide opacity-90">CLIENTS</div>
                  <Users className="h-5 w-5 sm:h-8 sm:w-8 md:h-10 md:w-10 opacity-70" />
                </div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">
                  {dashboardData.stats.totalClients}
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs opacity-80">Assigned Clients</div>
              </CardContent>
            </Card>

            {/* Total Writers */}
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <CardContent className="p-2 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-4">
                  <div className="text-[8px] sm:text-[10px] md:text-xs font-semibold tracking-wide opacity-90">WRITERS</div>
                  <Activity className="h-5 w-5 sm:h-8 sm:w-8 md:h-10 md:w-10 opacity-70" />
                </div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">
                  {dashboardData.stats.totalWriters}
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs opacity-80">Assigned Writers</div>
              </CardContent>
            </Card>
          </div>

          {/* Order Workflow Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
            <Link href="/manager/orders/pending">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {dashboardData.stats.pendingOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/accepted">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Accepted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.stats.acceptedOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/assigned">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Assigned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {dashboardData.stats.assignedOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/editing">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    Editing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData.stats.editingOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/delivered">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    Delivered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-600">
                    {dashboardData.stats.deliveredOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/completed">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.stats.completedOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/revision">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Revision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {dashboardData.stats.revisionOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/orders/on-hold">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <PauseCircle className="w-3 h-3" />
                    On Hold
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">
                    {dashboardData.stats.onHoldOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
              {/* Order Statistics Chart */}
              <Card className="bg-card border-border">
                <CardHeader className="p-2 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1 sm:gap-2 text-card-foreground text-xs sm:text-sm md:text-base">
                      Order Statistics
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full animate-pulse"></div>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(34 197 94)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="rgb(34 197 94)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(59 130 246)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="rgb(59 130 246)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(245 158 11)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="rgb(245 158 11)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(from var(--color-border) calc(l * 0.8) c h)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="var(--color-muted-foreground)"
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis 
                        stroke="var(--color-muted-foreground)"
                        style={{ fontSize: '10px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-popover)', 
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="completed" stroke="rgb(34 197 94)" strokeWidth={2} fill="url(#colorCompleted)" name="Completed" />
                      <Area type="monotone" dataKey="in_progress" stroke="rgb(59 130 246)" strokeWidth={2} fill="url(#colorProgress)" name="In Progress" />
                      <Area type="monotone" dataKey="pending" stroke="rgb(245 158 11)" strokeWidth={2} fill="url(#colorPending)" name="Pending" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Orders Table */}
              <Card className="bg-card border-border">
                <CardHeader className="p-2 sm:p-4 md:p-6">
                  <CardTitle className="text-card-foreground text-xs sm:text-sm md:text-base">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Client</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-2 font-medium">{order.displayId}</td>
                            <td className="p-2 text-muted-foreground">{order.client?.name || 'Unknown'}</td>
                            <td className="p-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                order.status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                order.status === 'delivered' ? 'bg-purple-500/20 text-purple-600' :
                                'bg-yellow-500/20 text-yellow-600'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-2 text-right font-semibold">KSh {order.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Lists */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
              {/* Assigned Clients */}
              <Card className="bg-card border-border">
                <CardHeader className="p-2 sm:p-4 md:p-6">
                  <CardTitle className="text-card-foreground text-xs font-semibold">ASSIGNED CLIENTS</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0 space-y-2">
                  {dashboardData.clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div>
                        <div className="text-sm font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.displayId}</div>
                      </div>
                      <div className="text-xs">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                          client.approved ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'
                        }`}>
                          {client.approved ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dashboardData.clients.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No assigned clients
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned Writers */}
              <Card className="bg-card border-border">
                <CardHeader className="p-2 sm:p-4 md:p-6">
                  <CardTitle className="text-card-foreground text-xs font-semibold">ASSIGNED WRITERS</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0 space-y-2">
                  {dashboardData.writers.slice(0, 5).map((writer) => (
                    <div key={writer.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div>
                        <div className="text-sm font-medium">{writer.name}</div>
                        <div className="text-xs text-muted-foreground">{writer.displayId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold">
                          {writer.rating ? `⭐ ${writer.rating.toFixed(1)}` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {writer.completedJobs} jobs
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.writers.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No assigned writers
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      )}
    </div>
  );
}