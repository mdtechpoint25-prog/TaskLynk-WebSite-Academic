"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Star, Award } from 'lucide-react';
import Link from 'next/link';

type PerformanceData = {
  freelancers: Array<{
    id: number;
    name: string;
    displayId: string;
    rating: number | null;
    completedOrders: number;
    totalEarnings: number;
    badge?: string;
  }>;
  clients: Array<{
    id: number;
    name: string;
    displayId: string;
    totalOrders: number;
    totalSpent: number;
    tier?: string;
  }>;
};

export default function ManagerPerformancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchPerformanceData();
      }
    }
  }, [user, loading, router]);

  const fetchPerformanceData = async () => {
    try {
      setLoadingData(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      // Fetch freelancers and clients data in parallel
      const [freelancersRes, clientsRes] = await Promise.all([
        fetch('/api/users/by-role?role=freelancer', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/users/by-role?role=client', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const freelancers = freelancersRes.ok ? await freelancersRes.json() : [];
      const clients = clientsRes.ok ? await clientsRes.json() : [];

      setPerformanceData({ freelancers, clients });
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
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

  const topFreelancers = performanceData?.freelancers
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10) || [];

  const topClients = performanceData?.clients
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10) || [];

  return (
    <div className="dashboard-container">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="dashboard-main">
        <div className="dashboard-inner">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Performance Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track top performers and client engagement
            </p>
          </div>

          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading performance data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Freelancers */}
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Top Performing Writers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topFreelancers.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-base font-medium text-foreground mb-2">No writers found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topFreelancers.map((freelancer, index) => (
                        <Link
                          key={freelancer.id}
                          href={`/manager/user-management?userId=${freelancer.id}`}
                          className="block border rounded-lg p-3 sm:p-4 transition-all hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary'
                                }`}>
                                  #{index + 1}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold text-base truncate">{freelancer.name}</h3>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {freelancer.displayId}
                                  </Badge>
                                  {freelancer.badge && (
                                    <Badge variant="secondary" className="capitalize text-xs">
                                      {freelancer.badge}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  {freelancer.rating !== null && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      {freelancer.rating.toFixed(1)}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>{freelancer.completedOrders} orders</span>
                                  <span>•</span>
                                  <span className="font-semibold text-green-600">
                                    KSh {freelancer.totalEarnings.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Clients */}
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topClients.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-base font-medium text-foreground mb-2">No clients found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topClients.map((client, index) => (
                        <Link
                          key={client.id}
                          href={`/manager/user-management?userId=${client.id}`}
                          className="block border rounded-lg p-3 sm:p-4 transition-all hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary'
                                }`}>
                                  #{index + 1}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold text-base truncate">{client.name}</h3>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {client.displayId}
                                  </Badge>
                                  {client.tier && (
                                    <Badge variant="secondary" className="capitalize text-xs">
                                      {client.tier}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  <span>{client.totalOrders} orders</span>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-600">
                                    KSh {client.totalSpent.toFixed(2)} spent
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}