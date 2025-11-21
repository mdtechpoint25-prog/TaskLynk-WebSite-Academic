"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, UserCog, Users, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Manager = {
  id: number;
  name: string;
  email: string;
  approved: boolean;
  assignedClientsCount?: number;
  assignedWritersCount?: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedManagerId: number | null;
};

export default function AdminManagersManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [writers, setWriters] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Assignment dialog state
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [selectedWriterIds, setSelectedWriterIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

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
      const headers = getAuthHeader();
      const [managersRes, clientsRes, writersRes] = await Promise.all([
        fetch('/api/users?role=manager', { headers }),
        fetch('/api/users?role=client,account_owner', { headers }),
        fetch('/api/users?role=freelancer', { headers })
      ]);

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData);
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }
      if (writersRes.ok) {
        const writersData = await writersRes.json();
        setWriters(writersData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const openAssignDialog = (manager: Manager) => {
    setSelectedManager(manager);
    
    // Pre-select clients and writers already assigned to this manager
    const assignedClients = clients
      .filter(c => c.assignedManagerId === manager.id)
      .map(c => c.id);
    const assignedWriters = writers
      .filter(w => w.assignedManagerId === manager.id)
      .map(w => w.id);
    
    setSelectedClientIds(assignedClients);
    setSelectedWriterIds(assignedWriters);
    setAssignDialogOpen(true);
  };

  const handleAssignUsers = async () => {
    if (!selectedManager) return;

    try {
      setAssigning(true);
      const res = await fetch(`/api/admin/managers/${selectedManager.id}/assign-users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(getAuthHeader() || {}) },
        body: JSON.stringify({
          clientIds: selectedClientIds,
          writerIds: selectedWriterIds
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistic state update: reflect new assignments immediately
        setClients(prev => prev.map(c => {
          if (selectedClientIds.includes(c.id)) return { ...c, assignedManagerId: selectedManager.id };
          if (c.assignedManagerId === selectedManager.id && !selectedClientIds.includes(c.id)) return { ...c, assignedManagerId: null };
          return c;
        }));
        setWriters(prev => prev.map(w => {
          if (selectedWriterIds.includes(w.id)) return { ...w, assignedManagerId: selectedManager.id };
          if (w.assignedManagerId === selectedManager.id && !selectedWriterIds.includes(w.id)) return { ...w, assignedManagerId: null };
          return w;
        }));

        toast.success(`Assigned ${data.assignedClients} client(s) and ${data.assignedWriters} writer(s) to ${selectedManager.name}`);
        setAssignDialogOpen(false);
        setSelectedManager(null);
        setSelectedClientIds([]);
        setSelectedWriterIds([]);
        // Optional: background refresh to ensure consistency
        // fetchData();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to assign users');
      }
    } catch (error) {
      console.error('Failed to assign users:', error);
      toast.error('Failed to assign users');
    } finally {
      setAssigning(false);
    }
  };

  const toggleClient = (clientId: number) => {
    setSelectedClientIds(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleWriter = (writerId: number) => {
    setSelectedWriterIds(prev =>
      prev.includes(writerId)
        ? prev.filter(id => id !== writerId)
        : [...prev, writerId]
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const approvedManagers = managers.filter(m => m.approved);

  return (
    <>
      {/* Floating Back Button */}
      <Link 
        href="/admin/dashboard"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
      >
        <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        <span className="absolute right-full mr-2 sm:mr-3 px-2 sm:px-3 py-1 bg-primary text-primary-foreground text-xs sm:text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Back to Dashboard
        </span>
      </Link>

      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <UserCog className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Manage Managers</h1>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Assign clients and writers to managers for better organization
        </p>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Total Managers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                  {approvedManagers.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                  {clients.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Writers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
                  {writers.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Managers Table */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Manager Assignments</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Click "Assign Users" to manage client and writer assignments for each manager
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 md:p-6">
              {approvedManagers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No approved managers found. Approve managers first to assign users.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Manager</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Email</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Assigned Clients</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Assigned Writers</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedManagers.map((manager) => {
                        const assignedClientsCount = clients.filter(c => c.assignedManagerId === manager.id).length;
                        const assignedWritersCount = writers.filter(w => w.assignedManagerId === manager.id).length;
                        
                        return (
                          <TableRow key={manager.id}>
                            <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                              {manager.name}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                              {manager.email}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={assignedClientsCount > 0 ? "default" : "secondary"} className="text-[8px] sm:text-xs">
                                {assignedClientsCount} Clients
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={assignedWritersCount > 0 ? "default" : "secondary"} className="text-[8px] sm:text-xs">
                                {assignedWritersCount} Writers
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openAssignDialog(manager)}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Assign Users</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}