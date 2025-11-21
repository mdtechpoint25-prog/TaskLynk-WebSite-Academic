"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type WriterPerformance = {
  id: number;
  writerId: number;
  writerName: string;
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  onTimeDelivery: number;
  avgCompletionTime: string;
  totalEarned: number;
};

export default function WriterPerformancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [writers, setWriters] = useState<WriterPerformance[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchWriterPerformance();
      }
    }
  }, [user, loading, router]);

  const fetchWriterPerformance = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/manager/writers/performance?managerId=${user?.id}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setWriters(data.writers || []);
      }
    } catch (error) {
      console.error('Failed to fetch writer performance:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const avgRating =
    writers.length > 0
      ? (writers.reduce((sum, w) => sum + w.averageRating, 0) / writers.length).toFixed(1)
      : '0';

  const totalOrders = writers.reduce((sum, w) => sum + w.completedOrders, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Writer Performance</h1>
        <p className="text-muted-foreground mt-2">
          Track performance metrics for your writing team
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{writers.length}</div>
            <p className="text-xs text-muted-foreground">Active writers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total team output</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Writer Metrics</CardTitle>
          <CardDescription>
            Detailed performance breakdown for each writer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {writers.length === 0 ? (
            <Alert>
              <AlertDescription>
                No writers assigned yet
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Writer</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>On-Time %</TableHead>
                    <TableHead>Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {writers.map((writer) => (
                    <TableRow key={writer.id}>
                      <TableCell className="font-medium">{writer.writerName}</TableCell>
                      <TableCell>{writer.totalOrders}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {writer.completedOrders}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-600" />
                          {writer.averageRating.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {writer.onTimeDelivery}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${writer.totalEarned.toFixed(2)}
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
  );
}
