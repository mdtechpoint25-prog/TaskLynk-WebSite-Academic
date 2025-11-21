"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ClientSidebar } from '@/components/client-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, FileText } from 'lucide-react';
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

export default function ClientRevisionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/v2/orders?userId=${user.id}&role=client&_t=${timestamp}`, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const revisionJobs = (data.orders || []).filter((o: any) => 
          o.status === 'revision'
        ).map((o: any) => ({
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
        setJobs(revisionJobs);
      } else {
        toast.error('Failed to fetch revision orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Network error');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else if (!user.approved && user.role !== 'account_owner') {
        router.push('/client/dashboard');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 pt-[72px]">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Revision Orders</h1>
            <p className="text-sm text-muted-foreground">Track orders that have been sent back for revisions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal opacity-90">Total in Revision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{jobs.length}</div>
                  <RotateCcw className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Orders Under Revision</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading revision orders...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-base font-medium mb-2">No orders in revision</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Orders you request revisions for will appear here
                  </p>
                  <Link href="/client/dashboard">
                    <Button variant="outline">View All Orders</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 px-4 text-sm font-semibold">ID</th>
                        <th className="pb-3 px-4 text-sm font-semibold">Topic</th>
                        <th className="pb-3 px-4 text-sm font-semibold">Type of Paper</th>
                        <th className="pb-3 px-4 text-sm font-semibold">Words</th>
                        <th className="pb-3 px-4 text-sm font-semibold">Due in</th>
                        <th className="pb-3 px-4 text-sm font-semibold">Status</th>
                        <th className="pb-3 px-4 text-sm font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr 
                          key={job.id}
                          onClick={() => router.push(`/client/jobs/${job.id}`)}
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-primary font-mono">{job.displayId}</td>
                          <td className="py-3 px-4 text-sm font-medium">{job.title}</td>
                          <td className="py-3 px-4 text-sm capitalize">{job.workType}</td>
                          <td className="py-3 px-4 text-sm">
                            {job.pages ? `${job.pages}Pgs, ${job.pages * 300} words` : 
                             job.slides ? `${job.slides} slides` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(job.actualDeadline).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="default" className="capitalize bg-orange-600 hover:bg-orange-700 text-white">
                              Revision
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-right">
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

          <div className="mt-6 text-center">
            <Link href="/client/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}