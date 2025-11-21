"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PauseCircle, Eye, User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

type Client = {
  id: number;
  name: string;
  email: string;
  displayId: string;
  role: 'client' | 'account_owner';
  createdAt: string;
  totalOrders: number;
  completedOrders: number;
};

export default function ManagerOnHoldClientsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchOnHoldClients();
      }
    }
  }, [user, loading, router]);

  const fetchOnHoldClients = async () => {
    try {
      setLoadingClients(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/clients?managerId=${user?.id}&status=on_hold`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch on-hold clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleViewClient = (clientId: number) => {
    router.push(`/manager/clients/${clientId}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 pt-[72px] ml-0 md:ml-64 bg-background transition-all duration-300">
        <div className="p-3 md:p-4 lg:p-5 w-full">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <PauseCircle className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              On Hold Clients
            </h1>
            <p className="text-sm text-muted-foreground">
              Clients assigned to you whose accounts are temporarily on hold
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">On Hold Clients ({clients.length})</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Client accounts that have been temporarily suspended or paused
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <PauseCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-base font-medium mb-2">No Clients On Hold</p>
                  <p className="text-xs text-muted-foreground">
                    All client accounts assigned to you are currently active
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Client ID</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Account Type</TableHead>
                        <TableHead className="text-xs">Total Orders</TableHead>
                        <TableHead className="text-xs">Completed</TableHead>
                        <TableHead className="text-xs">Joined</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow 
                          key={client.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <span className="font-mono text-xs text-primary font-semibold">
                              {client.displayId}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 flex-shrink-0" />
                              <span>{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{client.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.role === 'account_owner' ? (
                              <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 text-[10px] px-2 py-0.5">
                                Account Owner
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                Regular Client
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-xs">{client.totalOrders}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600 text-xs">{client.completedOrders}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(client.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleViewClient(client.id)} className="h-7 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
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
      </main>
    </div>
  );
}