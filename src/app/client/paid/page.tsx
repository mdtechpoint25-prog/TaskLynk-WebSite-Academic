"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ChatWithUsWidget } from '@/components/chat-with-us-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

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
  paymentConfirmed: boolean;
};

export default function ClientPaidPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async (silent = false) => {
    if (!user) return;
    if (!silent) setRefreshing(true);
    try {
      // Fetch completed orders and filter for payment confirmed on frontend
      const response = await fetch(`/api/jobs?clientId=${user.id}&status=completed&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to only show orders where payment has been confirmed by admin
        const paidOrders = data.filter((job: Job) => job.paymentConfirmed === true);
        setJobs(paidOrders);
      } else if (!silent) {
        toast.error('Failed to fetch paid orders');
      }
    } catch (e) {
      if (!silent) toast.error('Network error');
    } finally {
      setLoadingJobs(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      // Allow both clients and account owners; only gate approval for regular clients
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else if (!user.approved && user.role !== 'account_owner') {
        router.push('/client/dashboard');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  return (
    
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
          <ChatWithUsWidget />
          
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
                    <Receipt className="w-8 h-8 text-emerald-600" />
                    Paid Orders
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground">
                    Orders with confirmed payments. You can download your final files.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="lg" onClick={() => { fetchJobs(false); toast.success('Refreshing paid orders...'); }} disabled={refreshing}>
                    <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Link href="/client/dashboard">
                    <Button variant="secondary" size="lg">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>

            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Paid Orders</CardTitle>
                <CardDescription className="text-base">These orders are fully paid and finalized</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading paid orders...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-lg">
                    <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No paid orders</p>
                    <p className="text-muted-foreground mb-6">Paid orders will appear here after admin payment confirmation</p>
                    <Link href="/client/accepted">
                      <Button variant="outline" size="lg">View Accepted Orders</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div key={job.id} onClick={() => router.push(`/client/jobs/${job.id}`)} className="border-2 rounded-lg p-4 sm:p-5 transition-all cursor-pointer hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-bold text-lg sm:text-xl text-foreground">{job.title}</h3>
                              {job.displayId && (
                                <span className="text-xs font-mono px-2.5 py-1 rounded-md font-semibold text-primary bg-primary/10">{job.displayId}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm whitespace-nowrap">Paid</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span className="capitalize font-medium">{job.workType}</span>
                          <span>•</span>
                          <span className="font-bold text-foreground">KSh {job.amount.toFixed(2)}</span>
                          <span>•</span>
                          <span className="font-medium">Deadline: {new Date(job.actualDeadline || job.deadline).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Payment confirmed. <Link href="/client/accepted" className="underline hover:text-primary">View accepted orders</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}