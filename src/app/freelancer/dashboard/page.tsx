"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Briefcase, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string;
  pages: number | null;
  slides: number | null;
};

// Status display helper to match menu labels exactly
const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'available': 'Available',
    'assigned': 'Assigned',
    'in_progress': 'In Progress',
    'in-progress': 'In Progress',
    'editing': 'Editing',
    'completed': 'Completed',
    'revision': 'Revision',
    'approved': 'Approved',
    'delivered': 'Delivered',
    'paid': 'Paid',
    'cancelled': 'Cancelled',
    'on-hold': 'On Hold',
    'on_hold': 'On Hold',
  };
  return statusMap[status] || status;
};

export default function FreelancerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const hasCheckedAuth = useRef(false);
  const hasFetchedData = useRef(false);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoadingJobs(true);
    try {
      const timestamp = Date.now();
      if (user.approved) {
        const response = await fetch(`/api/v2/orders?userId=${user.id}&role=freelancer&_=${timestamp}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const mapped: Job[] = (data.orders || []).map((o: any) => ({
            id: o.id,
            displayId: o.orderNumber || '',
            title: o.title,
            workType: o.workType,
            amount: Number(o.writerTotal ?? 0),
            status: o.status,
            deadline: new Date(o.deadline).toISOString(),
            pages: o.pageCount || null,
            slides: o.slideCount || null,
          }));
          setMyJobs(mapped);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'freelancer') {
      window.location.href = '/';
    } else if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchDashboardData();
    }
  }, [loading, user]);

  const stats = useMemo(() => {
    const availableJobs = myJobs.filter(j => j.status === 'available').length;
    const assignedJobs = myJobs.filter(j => j.status === 'assigned').length;
    const inProgressJobs = myJobs.filter(j => j.status === 'in_progress' || j.status === 'in-progress').length;
    const editingJobs = myJobs.filter(j => j.status === 'editing').length;
    const completedJobs = myJobs.filter(j => j.status === 'completed').length;
    const revisionJobs = myJobs.filter(j => j.status === 'revision').length;
    const approvedJobs = myJobs.filter(j => j.status === 'approved').length;

    return {
      availableJobs,
      assignedJobs,
      inProgressJobs,
      editingJobs,
      completedJobs,
      revisionJobs,
      approvedJobs,
    };
  }, [myJobs]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusFlow = [
    { label: 'Available', count: stats.availableJobs, color: 'bg-blue-500' },
    { label: 'Assigned', count: stats.assignedJobs, color: 'bg-purple-500' },
    { label: 'In Progress', count: stats.inProgressJobs, color: 'bg-orange-500' },
    { label: 'Editing', count: stats.editingJobs, color: 'bg-indigo-500' },
    { label: 'Completed', count: stats.completedJobs, color: 'bg-green-500' },
    { label: 'Revision', count: stats.revisionJobs, color: 'bg-cyan-500' },
    { label: 'Approved', count: stats.approvedJobs, color: 'bg-emerald-500' },
  ];

  const filteredJobs = myJobs.filter(job =>
    job.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full -m-6">
      {!user.approved && (
        <Alert className="mb-0 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 rounded-none border-y">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Account Pending Approval:</strong> Your account is awaiting admin approval.
          </AlertDescription>
        </Alert>
      )}

      {user.approved && (
        <>
          {/* Horizontal Status Flow - Full Width */}
          <div className="bg-white dark:bg-gray-800 border-y py-4 px-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
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
            <p className="text-center text-xs text-muted-foreground mt-3">
              Your average rating is 90%
            </p>
          </div>

          {/* Search Bar */}
          <div className="py-3 px-4 border-b">
            <Input
              type="text"
              placeholder="Search order by ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-8"
            />
          </div>

          {/* Current Orders - Full Width Card */}
          <Card className="rounded-none border-0 border-b">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-base md:text-lg">Current Orders</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loadingJobs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-3">No jobs assigned yet</p>
                  <Link href="/freelancer/orders">
                    <Button size="sm">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                      <span className="text-xs">Browse Available Jobs</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 px-3 text-xs font-semibold">#ID</th>
                        <th className="pb-2 px-3 text-xs font-semibold">Topic</th>
                        <th className="pb-2 px-3 text-xs font-semibold">Status</th>
                        <th className="pb-2 px-3 text-xs font-semibold">Pages</th>
                        <th className="pb-2 px-3 text-xs font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map((job) => (
                        <tr 
                          key={job.id}
                          onClick={() => router.push(`/freelancer/jobs/${job.displayId || job.id}`)}
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2 px-3 text-xs text-primary font-mono">{job.displayId}</td>
                          <td className="py-2 px-3 text-xs font-medium">{job.title}</td>
                          <td className="py-2 px-3">
                            <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0.5">
                              {getStatusDisplay(job.status)}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-xs">
                            {job.pages ? `${job.pages}pg(s)` : 
                             job.slides ? `${job.slides} slides` : 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-xs font-bold text-right text-green-600">
                            $ {job.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}