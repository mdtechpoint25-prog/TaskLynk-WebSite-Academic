"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Shield, 
  Ban, 
  Crown,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

type User = {
  id: number;
  displayId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt?: string;
  lastLoginAt?: string;
};

export default function AdminsManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      
      const response = await fetch('/api/users/by-role?role=admin&approved=false', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoadingData(false);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
      approved: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
    };
    
    const config = statusMap[status] || statusMap.approved;
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
          <ShieldAlert className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Administrator Management</h1>
        </div>
        <p className="text-muted-foreground">
          View all platform administrators
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Protected Administrator Accounts
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Administrator accounts have full platform access. Changes to admin accounts should be made with extreme caution. 
                Contact the platform owner for any admin-level modifications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {admins.filter(a => a.status === 'approved' || a.status === 'active').length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {admins.filter(a => a.status === 'suspended').length}
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

      {/* Admins List */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Administrators ({filteredAdmins.length})</CardTitle>
          <CardDescription>All platform administrators with full system access</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading administrators...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl">
              <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No administrators found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="border-2 rounded-2xl p-5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Crown className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-lg">{admin.name}</h3>
                        <Badge variant="outline" className="rounded-xl">{admin.displayId}</Badge>
                        {getStatusBadge(admin.status)}
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 rounded-xl">
                          <Shield className="w-3 h-3 mr-1" />
                          Full Access
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{admin.email}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {admin.lastLoginAt && (
                          <span>Last login: {new Date(admin.lastLoginAt).toLocaleDateString()}</span>
                        )}
                        {admin.createdAt && (
                          <span>• Created: {new Date(admin.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-xl">
                        Protected Account
                      </Badge>
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
