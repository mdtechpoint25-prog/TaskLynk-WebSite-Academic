"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Activity,
  Package,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';

type Stats = {
  users: {
    totalUsers: number;
    clientCount: number;
    freelancerCount: number;
    pendingUsers: number;
  };
  jobs: {
    totalJobs: number;
    pendingJobs: number;
    inProgressJobs: number;
    completedJobs: number;
    approvedJobs: number;
    assignedJobs: number;
    deliveredJobs: number;
    editingJobs: number;
  };
  payments: {
    totalAmount: number;
  };
};

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const hasCheckedAuth = useRef(false);
  const hasFetchedStats = useRef(false);

  const fetchStats = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/stats?_=${timestamp}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    if (user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    
    if (!hasFetchedStats.current) {
      hasFetchedStats.current = true;
      fetchStats();
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const salesTarget = 168500;
  const currentSales = stats?.payments.totalAmount || 0;
  const salesPercentage = Math.round((currentSales / salesTarget) * 100);

  return (
    <div className="w-full p-3 md:p-4 lg:p-6 space-y-6">
      {/* Congratulations Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Congratulations {user.name}! 🎉</h2>
              <p className="text-blue-100 mb-4">You are the best admin of this month</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
                <p className="text-4xl font-bold">KSh {currentSales.toLocaleString()}</p>
                <p className="text-sm text-blue-100 mt-1">{salesPercentage}% of sales target</p>
              </div>
              <Link href="/admin/payments">
                <Button className="mt-4 bg-white text-blue-600 hover:bg-blue-50 rounded-xl">
                  View Details
                </Button>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-16 h-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingStats ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Main Stats - 4 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">+24%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{(stats?.jobs.totalJobs || 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">+14%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
                <p className="text-3xl font-bold">KSh {(stats?.payments.totalAmount || 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-semibold">-35%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Visits</p>
                <p className="text-3xl font-bold">{((stats?.users.totalUsers || 0) * 15).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">+18%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Bounce Rate</p>
                <p className="text-3xl font-bold">24.6%</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Pie Chart */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Order Status</span>
                  <Button variant="ghost" size="icon">
                    <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
                      <circle cx="2" cy="2" r="2"/>
                      <circle cx="2" cy="8" r="2"/>
                      <circle cx="2" cy="14" r="2"/>
                    </svg>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-48 h-48">
                    {/* Simple SVG Pie Chart */}
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="75.4 251.2" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="20" strokeDasharray="62.8 251.2" strokeDashoffset="-75.4" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="20" strokeDasharray="50.2 251.2" strokeDashoffset="-138.2" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="20" strokeDasharray="62.8 251.2" strokeDashoffset="-188.4" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold">68%</p>
                        <p className="text-xs text-muted-foreground">Total Sales</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-semibold">{stats?.jobs.pendingJobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <span className="font-semibold">{stats?.jobs.inProgressJobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <span className="font-semibold">{stats?.jobs.completedJobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                      <span className="text-sm">Delivered</span>
                    </div>
                    <span className="font-semibold">{stats?.jobs.deliveredJobs || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales & Views Bar Chart */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sales & Views</span>
                  <Button variant="ghost" size="icon">
                    <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
                      <circle cx="2" cy="2" r="2"/>
                      <circle cx="2" cy="8" r="2"/>
                      <circle cx="2" cy="14" r="2"/>
                    </svg>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-4 px-4">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, idx) => {
                    const salesHeight = Math.random() * 60 + 20;
                    const viewsHeight = Math.random() * 60 + 20;
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex gap-1 items-end" style={{ height: '180px' }}>
                          <div 
                            className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${salesHeight}%` }}
                          />
                          <div 
                            className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${viewsHeight}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-sm">Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm">Views</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Stats */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="188.4 251.2" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">75%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Monthly</h3>
                    <p className="text-3xl font-bold mb-1">{((stats?.jobs.completedJobs || 0) * 650).toLocaleString()}</p>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      16.5% <span className="text-muted-foreground">$5,21 USD</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Stats */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="8" strokeDasharray="220 251.2" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-yellow-600">88%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Yearly</h3>
                    <p className="text-3xl font-bold mb-1">{((stats?.payments.totalAmount || 0) * 12).toLocaleString()}</p>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      24.8% <span className="text-muted-foreground">$267.35 USD</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/admin/user-management">
                  <Button variant="outline" className="w-full justify-start h-auto py-4 rounded-xl">
                    <Users className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Manage Users</p>
                      <p className="text-xs text-muted-foreground">{stats?.users.pendingUsers || 0} pending</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/jobs">
                  <Button variant="outline" className="w-full justify-start h-auto py-4 rounded-xl">
                    <FileText className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">View Orders</p>
                      <p className="text-xs text-muted-foreground">{stats?.jobs.totalJobs || 0} total</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/payments">
                  <Button variant="outline" className="w-full justify-start h-auto py-4 rounded-xl">
                    <DollarSign className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Payments</p>
                      <p className="text-xs text-muted-foreground">Track revenue</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/payouts">
                  <Button variant="outline" className="w-full justify-start h-auto py-4 rounded-xl">
                    <UserPlus className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Payouts</p>
                      <p className="text-xs text-muted-foreground">Process payouts</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}