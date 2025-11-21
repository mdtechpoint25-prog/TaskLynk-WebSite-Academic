"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

type Job = {
  id: number;
  displayId: string;
  title: string;
  status: string;
  clientName?: string;
  freelancerName?: string;
  amount: number;
  deadline: string;
  createdAt: string;
};

export default function ManagerRevisionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [revisions, setRevisions] = useState<Job[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchRevisions();
      }
    }
  }, [user, loading, router]);

  const fetchRevisions = async () => {
    try {
      setLoadingRevisions(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch('/api/jobs?status=revision', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setRevisions(data);
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
    } finally {
      setLoadingRevisions(false);
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
    <div className="dashboard-container">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="dashboard-main">
        <div className="dashboard-inner">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Revision Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track and manage orders in revision stage
            </p>
          </div>

          {/* Stats Card */}
          <Card className="mb-6 shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Active Revisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{revisions.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Orders requiring revisions
              </p>
            </CardContent>
          </Card>

          {/* Revisions List */}
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle>Revision Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRevisions ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading revisions...</p>
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-base font-medium text-foreground mb-2">No revisions found</p>
                  <p className="text-muted-foreground text-sm">
                    All orders are on track
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {revisions.map((job) => (
                    <Link
                      key={job.id}
                      href={`/manager/jobs/${job.id}`}
                      className="block border rounded-lg p-3 sm:p-4 transition-all hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base">{job.title}</h3>
                            {job.displayId && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {job.displayId}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100">
                              Revision
                            </Badge>
                          </div>
                          {job.clientName && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              Client: <span className="font-medium">{job.clientName}</span>
                            </p>
                          )}
                          {job.freelancerName && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              Writer: <span className="font-medium">{job.freelancerName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            <span className="font-semibold text-foreground">
                              KSh {job.amount.toFixed(2)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due: {format(new Date(job.deadline), 'MMM dd, yyyy')}
                            </span>
                            <span>•</span>
                            <span>Created: {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
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
      </main>
    </div>
  );
}