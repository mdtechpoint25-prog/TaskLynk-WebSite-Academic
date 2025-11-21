"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

type User = {
  id: number;
  displayId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  balance?: number;
  totalEarnings?: number;
};

export default function ManagersManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [managers, setManagers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('bearer_token');
      
      // Fetch ALL managers (not just unapproved ones)
      const response = await fetch('/api/users?role=manager', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      } else {
        toast.error('Failed to load managers');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load managers');
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      let endpoint = '';
      let method = 'POST';
      
      if (newStatus === 'approved') {
        endpoint = `/api/users/${userId}/approve`;
      } else if (newStatus === 'suspended') {
        endpoint = `/api/users/${userId}/suspend`;
      } else if (newStatus === 'rejected') {
        endpoint = `/api/users/${userId}/reject`;
      } else if (newStatus === 'unsuspend') {
        endpoint = `/api/users/${userId}/unsuspend`;
        newStatus = 'approved';
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(`Manager ${newStatus} successfully`);
        await fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${newStatus} manager`);
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredManagers = managers.filter(manager => {
    const matchesSearch = 
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      manager.status === statusFilter ||
      (statusFilter === 'approved' && (manager.status === 'approved' || manager.status === 'active'));
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
      rejected: { label: 'Rejected', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' },
    };
    
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={`${config.className} rounded-xl`}>{config.label}</Badge>;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Manager Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage all managers and their permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{managers.length}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {managers.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {managers.filter(m => m.status === 'approved' || m.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {managers.filter(m => m.status === 'suspended').length}
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Managers List */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Managers ({filteredManagers.length})</CardTitle>
          <CardDescription>View and manage all manager accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading managers...</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl">
              <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No managers found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredManagers.map((manager) => (
                <div
                  key={manager.id}
                  className="border-2 rounded-2xl p-5 transition-all hover:bg-muted/50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg">{manager.name}</h3>
                        <Badge variant="outline" className="rounded-xl">{manager.displayId}</Badge>
                        {getStatusBadge(manager.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{manager.email}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {manager.totalEarnings !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Earnings: KSh {manager.totalEarnings?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        {manager.balance !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Balance: KSh {manager.balance?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {manager.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleStatusChange(manager.id, 'approved')}
                            disabled={actionLoading}
                            size="sm"
                            className="rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(manager.id, 'rejected')}
                            disabled={actionLoading}
                            variant="destructive"
                            size="sm"
                            className="rounded-xl"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {(manager.status === 'approved' || manager.status === 'active') && (
                        <Button
                          onClick={() => handleStatusChange(manager.id, 'suspended')}
                          disabled={actionLoading}
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                      {manager.status === 'suspended' && (
                        <Button
                          onClick={() => handleStatusChange(manager.id, 'approved')}
                          disabled={actionLoading}
                          size="sm"
                          className="rounded-xl"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Unsuspend
                        </Button>
                      )}
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