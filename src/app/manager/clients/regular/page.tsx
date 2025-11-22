"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Mail, Phone, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

type Client = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  accountOwner: boolean;
  approved: boolean;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
};

export default function ManagerRegularClientsPage() {
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
        fetchClients();
      }
    }
  }, [user, loading, router]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/manager/clients?managerId=${user?.id}&accountOwner=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
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
              <User className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
              Regular Clients
            </h1>
            <p className="text-sm text-muted-foreground">
              Standard client accounts assigned to your manager account
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Regular Clients ({clients.length})</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Standard client accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No regular clients found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Client ID</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Phone</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Orders</TableHead>
                        <TableHead className="text-xs">Total Spent</TableHead>
                        <TableHead className="text-xs">Joined</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-mono text-xs">{client.displayId}</TableCell>
                          <TableCell className="font-medium text-xs">{client.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{client.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.approved ? (
                              <Badge className="bg-green-500 text-[10px] px-2 py-0.5">Active</Badge>
                            ) : (
                              <Badge className="bg-yellow-500 text-[10px] px-2 py-0.5">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-xs">
                            {client.orderCount || 0}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600 text-xs">
                            KSh {(client.totalSpent || 0).toFixed(2)}
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