"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

type ClientDetails = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  approved: boolean;
  balance: number;
  totalSpent: number;
  completedJobs: number;
  createdAt: string;
};

type Order = {
  id: number;
  displayId: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  deadline: string;
};

export default function ManagerClientDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchClientDetails();
      }
    }
  }, [user, loading, router, clientId]);

  const fetchClientDetails = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('bearer_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [clientRes, ordersRes] = await Promise.all([
        fetch(`/api/users/${clientId}`, { headers }),
        fetch(`/api/jobs?clientId=${clientId}`, { headers })
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      } else {
        toast.error('Failed to load client details');
        router.push('/manager/clients/all');
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to fetch client details:', error);
      toast.error('Failed to load client details');
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link 
          href="/manager/clients/all"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                {client.role === 'account_owner' && <Crown className="w-8 h-8 text-yellow-600" />}
                {client.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{client.displayId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {client.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {client.phone}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={client.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {client.status}
              </Badge>
              {client.role === 'account_owner' && (
                <Badge className="bg-purple-500">Account Owner</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{activeOrders.length}</p>
                <p className="text-xs text-muted-foreground">Active Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                <p className="text-2xl font-bold text-amber-600">KSh {client.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Account details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                  <Badge variant={client.approved ? 'default' : 'secondary'} className="capitalize">
                    {client.approved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{format(new Date(client.createdAt), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-lg font-semibold text-green-600">KSh {client.balance.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                  <p className="text-lg font-semibold">
                    {orders.length > 0 
                      ? Math.round((completedOrders.length / orders.length) * 100)
                      : 0}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                  <p className="text-lg font-semibold text-amber-600">
                    KSh {orders.length > 0 
                      ? (client.totalSpent / orders.length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders ({orders.length})</CardTitle>
            <CardDescription>Order history for this client</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 10).map((order) => (
                  <Link 
                    key={order.id}
                    href={`/manager/jobs/${order.id}`}
                    className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{order.title}</h4>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {order.displayId}
                        </p>
                      </div>
                      <Badge className="capitalize">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-green-600">
                        KSh {order.amount.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span>Due: {format(new Date(order.deadline), 'MMM dd, yyyy')}</span>
                      <span>•</span>
                      <span>Posted: {format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}