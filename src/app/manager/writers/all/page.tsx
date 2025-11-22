"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Mail, Phone, Calendar, PenTool, Star } from 'lucide-react';
import { format } from 'date-fns';
import { WriterDetailsDialog } from '@/components/writer-details-dialog';

type Writer = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  approved: boolean;
  rating: number | null;
  balance: number;
  completedJobs: number;
  activeJobs: number;
  createdAt: string;
};

export default function ManagerAllWritersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingWriters, setLoadingWriters] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedWriterId, setSelectedWriterId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchWriters();
      }
    }
  }, [user, loading, router]);

  const fetchWriters = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/writers?managerId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWriters(data);
      }
    } catch (error) {
      console.error('Failed to fetch writers:', error);
    } finally {
      setLoadingWriters(false);
    }
  };

  const handleViewWriter = (writerId: number) => {
    setSelectedWriterId(writerId);
    setDetailsDialogOpen(true);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <PenTool className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              All Writers (Assigned to You)
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage freelance writers assigned to you
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Writers ({writers.length})</CardTitle>
              <CardDescription>
                List of writers linked to your manager account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWriters ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : writers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No writers found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Writer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Active Jobs</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {writers.map((writer) => (
                      <TableRow key={writer.id}>
                        <TableCell className="font-mono text-xs">{writer.displayId}</TableCell>
                        <TableCell className="font-medium">{writer.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {writer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {writer.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {writer.approved ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {writer.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="font-semibold">{writer.rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-500">{writer.activeJobs || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-green-600">
                          {writer.completedJobs || 0}
                        </TableCell>
                        <TableCell className="font-semibold">
                          KSh {writer.balance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(writer.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleViewWriter(writer.id)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <WriterDetailsDialog
        writerId={selectedWriterId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
}