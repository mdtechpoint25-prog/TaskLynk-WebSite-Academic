"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PauseCircle } from 'lucide-react';

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
};

export default function ClientOnHoldPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Allow both clients and account owners
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/jobs?clientId=${user.id}&status=on_hold&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch on-hold jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <PauseCircle className="w-8 h-8 text-amber-600" />
                On Hold Orders
              </h1>
              <p className="text-muted-foreground">
                Orders that are temporarily paused
              </p>
            </div>

            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="text-2xl">On Hold Orders</CardTitle>
                <CardDescription>
                  These orders are currently on hold and not being actively worked on
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading on-hold orders...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-lg">
                    <PauseCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No On-Hold Orders</p>
                    <p className="text-muted-foreground">
                      You don't have any orders on hold at the moment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div 
                        key={job.id}
                        onClick={() => router.push(`/client/jobs/${job.id}`)}
                        className="border rounded-lg p-3 transition-all cursor-pointer hover:shadow-md hover:bg-primary/5 border-border hover:border-primary/40"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <h3 className="font-semibold text-base truncate text-foreground">
                              {job.title}
                            </h3>
                            {job.displayId && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded font-semibold flex-shrink-0 text-primary bg-primary/10">
                                {job.displayId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm flex-wrap">
                            <span className="capitalize font-medium text-muted-foreground">
                              {job.workType}
                            </span>
                            <span className="font-bold text-foreground">
                              KSh {job.amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(job.actualDeadline || job.deadline).toLocaleDateString()}
                            </span>
                            <Badge variant="secondary" className="capitalize font-medium text-xs whitespace-nowrap bg-amber-100 text-amber-700 hover:bg-amber-200">
                              On Hold
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
    </div>
  );
}