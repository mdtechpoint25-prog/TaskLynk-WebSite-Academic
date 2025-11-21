"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type User = {
  id: number;
  name: string;
  email: string;
  displayId: string;
  role: string;
  approved: boolean;
  createdAt: string;
  rating?: number | null;
  balance?: number;
};

export default function ManagerUserManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchUsers();
      }
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        toast.success('User approved successfully');
        fetchUsers();
      } else {
        toast.error('Failed to approve user');
      }
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        toast.success('User rejected successfully');
        fetchUsers();
      } else {
        toast.error('Failed to reject user');
      }
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error('Failed to reject user');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    approved: users.filter(u => u.approved).length,
    pending: users.filter(u => !u.approved).length,
    clients: users.filter(u => u.role === 'client' || u.role === 'account_owner').length,
    freelancers: users.filter(u => u.role === 'freelancer').length,
  };

  return (
    <div className="dashboard-container">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="dashboard-main">
        <div className="dashboard-inner">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">User Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage users across the platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card className="shadow-sm border">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground mt-1">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.clients}</p>
                  <p className="text-xs text-muted-foreground mt-1">Clients</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border">
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.freelancers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Writers</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={roleFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setRoleFilter('all')}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={roleFilter === 'client' ? 'default' : 'outline'}
                    onClick={() => setRoleFilter('client')}
                    size="sm"
                  >
                    Clients
                  </Button>
                  <Button
                    variant={roleFilter === 'freelancer' ? 'default' : 'outline'}
                    onClick={() => setRoleFilter('freelancer')}
                    size="sm"
                  >
                    Writers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-base font-medium text-foreground mb-2">No users found</p>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="border rounded-lg p-3 sm:p-4 transition-all hover:bg-muted/50 border-border shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base">{u.name}</h3>
                            <Badge variant="outline" className="font-mono text-xs">
                              {u.displayId}
                            </Badge>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {u.role}
                            </Badge>
                            {u.approved ? (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                <UserX className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{u.email}</p>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                            <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                            {u.rating !== undefined && u.rating !== null && (
                              <>
                                <span>•</span>
                                <span>Rating: {u.rating.toFixed(1)}</span>
                              </>
                            )}
                            {u.balance !== undefined && (
                              <>
                                <span>•</span>
                                <span>Balance: KSh {u.balance.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {!u.approved && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(u.id)}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(u.id)}
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
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