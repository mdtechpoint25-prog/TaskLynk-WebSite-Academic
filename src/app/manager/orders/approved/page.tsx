"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { LeftNav } from '@/components/left-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ExportOrdersCSVButton } from '@/components/manager/export-orders-csv-button';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  deadline: string;
  status: string;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
  createdAt: string;
};

export default function ManagerApprovedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/orders?managerId=${user?.id}&status=approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoadingJobs(false);
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
    <>
      <DashboardNav />
      <LeftNav role="manager" userName={user.name} userRole={user.role} />
      <div className="min-h-screen bg-background ml-64">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Approved Orders</h1>
            <p className="text-muted-foreground">
              Orders approved by admin and ready for assignment
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approved Orders ({jobs.length})</CardTitle>
                  <CardDescription>
                    Orders awaiting writer assignment
                  </CardDescription>
                </div>
                <ExportOrdersCSVButton managerId={user.id} status="approved" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No approved orders found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">
                          <Link href={`/manager/jobs/${job.id}`} className="text-primary hover:underline">
                            {job.displayId}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.client?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{job.workType}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">KSh {job.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(job.deadline), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/manager/jobs/${job.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}