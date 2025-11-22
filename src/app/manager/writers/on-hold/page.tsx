"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { LeftNav } from '@/components/left-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PauseCircle, Eye, User, Mail, Calendar, Star, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WriterDetailsDialog } from '@/components/writer-details-dialog';

type Writer = {
  id: number;
  name: string;
  email: string;
  displayId: string;
  rating: number | null;
  balance: number;
  createdAt: string;
  totalJobs: number;
  completedJobs: number;
};

export default function ManagerOnHoldWritersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingWriters, setLoadingWriters] = useState(true);
  const [selectedWriterId, setSelectedWriterId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchOnHoldWriters();
      }
    }
  }, [user, loading, router]);

  const fetchOnHoldWriters = async () => {
    try {
      setLoadingWriters(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/writers?managerId=${user?.id}&status=on_hold`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWriters(data);
      }
    } catch (error) {
      console.error('Failed to fetch on-hold writers:', error);
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
    <>
      <LeftNav 
        role="manager" 
        userName={user.name} 
        userRole={user.role}
      />
      <div className="min-h-screen bg-background ml-64 transition-all duration-300">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <PauseCircle className="w-8 h-8 text-orange-600" />
              On Hold Writers (Assigned to You)
            </h1>
            <p className="text-muted-foreground">
              Writers assigned to your manager account whose profiles are temporarily on hold
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>On Hold Writers ({writers.length})</CardTitle>
              <CardDescription>
                Writer accounts that have been temporarily suspended or paused
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWriters ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : writers.length === 0 ? (
                <div className="text-center py-12">
                  <PauseCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">No Writers On Hold</p>
                  <p className="text-sm text-muted-foreground">
                    All writer accounts assigned to you are currently active
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Writer ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Total Jobs</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {writers.map((writer) => (
                        <TableRow 
                          key={writer.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <span className="font-mono text-xs text-primary font-semibold">
                              {writer.displayId}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 flex-shrink-0" />
                              <span>{writer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {writer.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {writer.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{writer.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No rating</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-semibold text-green-600">
                              <DollarSign className="w-4 h-4" />
                              KSh {writer.balance.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{writer.totalJobs}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">{writer.completedJobs}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <WriterDetailsDialog
        writerId={selectedWriterId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
}