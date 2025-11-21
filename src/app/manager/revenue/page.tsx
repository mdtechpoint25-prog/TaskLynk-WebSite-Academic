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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DollarSign, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type RevenueData = {
  totalRevenue: number;
  totalCommission: number;
  writerPayouts: number;
  completedOrders: number;
  monthlyData: Array<{ month: string; revenue: number; commissions: number }>;
};

export default function ManagerRevenuePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchRevenueData();
      }
    }
  }, [user, loading, router]);

  const fetchRevenueData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/manager/revenue?managerId=${user?.id}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData || !revenueData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const chartData = {
    labels: revenueData.monthlyData.map((d) => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.monthlyData.map((d) => d.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Commissions',
        data: revenueData.monthlyData.map((d) => d.commissions),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your earnings and commission breakdown
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.totalCommission.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Writer Payouts</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.writerPayouts.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Monthly revenue and commission breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Total Revenue:</span>
            <span className="font-bold text-lg">
              ${revenueData.totalRevenue.toFixed(2)}
            </span>
          </div>
          <div className="border-t" />
          <div className="flex justify-between items-center">
            <span>Writer Payouts:</span>
            <span className="font-bold text-lg">
              -${revenueData.writerPayouts.toFixed(2)}
            </span>
          </div>
          <div className="border-t" />
          <div className="flex justify-between items-center">
            <span className="font-bold">Net Commission:</span>
            <span className="font-bold text-lg text-green-600">
              ${revenueData.totalCommission.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
