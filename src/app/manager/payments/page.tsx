"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Receipt } from 'lucide-react';
import { format } from 'date-fns';

type Payment = {
  id: number;
  orderId: number;
  clientId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string | null;
  createdAt: string;
  clientName?: string;
  orderTitle?: string;
};

export default function ManagerPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchPayments();
      }
    }
  }, [user, loading, router]);

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch('/api/payments', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="dashboard-container">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="dashboard-main">
        <div className="dashboard-inner">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payment Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track and manage payments across the platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">KSh {totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {payments.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{completedPayments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully processed
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payments List */}
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading payments...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-base font-medium text-foreground mb-2">No payments found</p>
                  <p className="text-muted-foreground text-sm">
                    Payment records will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-3 sm:p-4 transition-all hover:bg-muted/50 border-border shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base">
                              {payment.orderTitle || `Order #${payment.orderId}`}
                            </h3>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                              {payment.status}
                            </Badge>
                          </div>
                          {payment.clientName && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              Client: <span className="font-medium">{payment.clientName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            <span className="capitalize">{payment.paymentMethod}</span>
                            {payment.transactionId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px] sm:text-xs">{payment.transactionId}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            KSh {Number(payment.amount || 0).toFixed(2)}
                          </p>
                        </div>
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
  );
}