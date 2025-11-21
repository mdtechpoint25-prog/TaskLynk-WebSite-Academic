"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Trash2, Ban, PlayCircle, Shield, ArrowLeft, UserCog, Users, Mail, MessageSquare, Edit, TrendingUp, UserPlus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { InviteManagerDialog } from '@/components/invite-manager-dialog';
import { DashboardNav } from '@/components/dashboard-nav';
import { LeftNav } from '@/components/left-nav';

type Manager = {
  id: number;
  email: string;
  name: string;
  role: string;
  approved: boolean;
  phone: string | null;
  status: string;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  blacklistReason: string | null;
  createdAt: string;
  invitationToken: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedManagerId: number | null;
};

export default function AdminManagersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [writers, setWriters] = useState<User[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  
  // Invite Manager Dialog
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);
  
  // Selected manager and action type state
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'remove' | 'suspend' | 'unsuspend' | 'blacklist' | 'message' | 'edit' | 'assign' | null>(null);
  
  // Suspend dialog state
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [suspendReason, setSuspendReason] = useState('');
  
  // Blacklist dialog state
  const [blacklistReason, setBlacklistReason] = useState('');

  // Message state
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Edit manager state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  // Assignment dialog state
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [selectedWriterIds, setSelectedWriterIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [fixingRoles, setFixingRoles] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<number | null>(null);

  // Sidebar state for pinned layout
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      setLoadingManagers(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      // Managers - use stable by-role endpoint
      const managersPromise = fetch('/api/users/by-role?role=manager', { headers: { ...authHeaders } });
      // Use stable by-role endpoints for clients and writers to avoid 500s
      const clientsPromise = fetch('/api/users/by-role?role=account_owner', { headers: { ...authHeaders } });
      const writersPromise = fetch('/api/users/by-role?role=freelancer', { headers: { ...authHeaders } });

      const [managersRes, clientsRes, writersRes] = await Promise.all([managersPromise, clientsPromise, writersPromise]);

      if (managersRes.ok) {
        const data = await managersRes.json();
        const legitimateManagers = (data as Manager[]).filter((m: any) => {
          const roleOk = String(m.role || '').toLowerCase() === 'manager' || String(m.role_id || '') === '3';
          const statusStr = String(m.status || '').toLowerCase();
          const isApproved = Boolean(m.approved) || statusStr === 'approved' || statusStr === 'active';
          const notBlacklisted = statusStr !== 'blacklisted';
          return roleOk && isApproved && notBlacklisted;
        });
        setManagers(legitimateManagers);
      } else {
        const err = await managersRes.json().catch(() => ({}));
        console.error('Managers fetch failed:', err);
        toast.error('Failed to load managers');
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      } else {
        const err = await clientsRes.json().catch(() => ({}));
        console.error('Clients fetch failed:', err);
      }

      if (writersRes.ok) {
        const writersData = await writersRes.json();
        setWriters(writersData);
      } else {
        const err = await writersRes.json().catch(() => ({}));
        console.error('Writers fetch failed:', err);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleApprove = async (managerId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${managerId}/approve`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        toast.success('Manager approved successfully');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
      } else {
        toast.error('Failed to approve manager');
      }
    } catch (error) {
      console.error('Failed to approve manager:', error);
      toast.error('Failed to approve manager');
    }
  };

  const handleReject = async (managerId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${managerId}/reject`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reason: 'Unfortunately, your manager application was not approved at this time.'
        }),
      });

      if (response.ok) {
        toast.success('Manager rejected and notified');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Failed to reject manager');
      }
    } catch (error) {
      console.error('Failed to reject manager:', error);
      toast.error('Failed to reject manager');
    }
  };

  const handleRemove = async (managerId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${managerId}/remove`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        toast.success('Manager removed successfully');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
      } else {
        toast.error('Failed to remove manager');
      }
    } catch (error) {
      console.error('Failed to remove manager:', error);
      toast.error('Failed to remove manager');
    }
  };

  const handleSuspend = async () => {
    if (!selectedManager || !suspendReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }

    try {
      const token = localStorage.getItem('bearer_token');
      // FIX: Use PATCH method and 'duration' field (not 'days')
      const response = await fetch(`/api/users/${selectedManager.id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ 
          duration: parseInt(suspendDuration),
          reason: suspendReason 
        }),
      });

      if (response.ok) {
        toast.success('Manager suspended successfully');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
        setSuspendDuration('7');
        setSuspendReason('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to suspend manager');
      }
    } catch (error) {
      console.error('Failed to suspend manager:', error);
      toast.error('Failed to suspend manager');
    }
  };

  const handleUnsuspend = async (managerId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      // FIX: Use PATCH method (not POST)
      const response = await fetch(`/api/users/${managerId}/unsuspend`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        toast.success('Manager unsuspended successfully');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to unsuspend manager');
      }
    } catch (error) {
      console.error('Failed to unsuspend manager:', error);
      toast.error('Failed to unsuspend manager');
    }
  };

  const handleBlacklist = async () => {
    if (!selectedManager || !blacklistReason.trim()) {
      toast.error('Please provide a blacklist reason');
      return;
    }

    try {
      const token = localStorage.getItem('bearer_token');
      // FIX: Use PATCH method (not POST)
      const response = await fetch(`/api/users/${selectedManager.id}/blacklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason: blacklistReason }),
      });

      if (response.ok) {
        toast.success('Manager blacklisted successfully');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
        setBlacklistReason('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to blacklist manager');
      }
    } catch (error) {
      console.error('Failed to blacklist manager:', error);
      toast.error('Failed to blacklist manager');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedManager || !user) {
      toast.error('Missing user information');
      return;
    }

    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('bearer_token');

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedManager.id,
          content: messageContent.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Message sent successfully to manager\'s email!');
        setSelectedManager(null);
        setActionType(null);
        setMessageContent('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedManager) return;

    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${selectedManager.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success('Manager updated successfully');
        fetchData();
        setSelectedManager(null);
        setActionType(null);
        setEditName('');
        setEditEmail('');
        setEditPhone('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update manager');
      }
    } catch (error) {
      console.error('Failed to update manager:', error);
      toast.error('Failed to update manager');
    } finally {
      setUpdating(false);
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
    setActionType('assign');
  };

  const handleAssignUsers = async () => {
    if (!selectedManager) return;

    try {
      setAssigning(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/admin/managers/${selectedManager.id}/assign-users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          clientIds: selectedClientIds,
          writerIds: selectedWriterIds
        }),
      });

      if (response.ok) {
        toast.success('Clients and writers assigned successfully');
        setSelectedManager(null);
        setActionType(null);
        setSelectedClientIds([]);
        setSelectedWriterIds([]);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to assign users');
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

  const handleFixRoles = async () => {
    try {
      setFixingRoles(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/fix-manager-roles', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('User roles have been restored successfully');
        console.log('Role fix results:', data);
        fetchData(); // Refresh the data
      } else {
        toast.error('Failed to fix user roles');
      }
    } catch (error) {
      console.error('Failed to fix roles:', error);
      toast.error('Failed to fix user roles');
    } finally {
      setFixingRoles(false);
    }
  };

  const handleResendInvite = async (manager: Manager) => {
    if (!manager.email) {
      toast.error('Manager email not found');
      return;
    }

    setResendingInvite(manager.id);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = storedToken || (user?.id ? String(user.id) : null);
      
      if (!authToken) {
        toast.error('You are not authenticated. Please sign in again.');
        setResendingInvite(null);
        return;
      }

      const response = await fetch('/api/admin/resend-manager-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email: manager.email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.emailSent) {
          toast.success(`Invitation resent successfully to ${manager.email}!`);
        } else {
          toast.warning('Invitation link created, but email delivery failed.');
        }
      } else {
        toast.error(data.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('An error occurred while resending the invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  // Filter to only show legitimate managers (those registered via invitation)
  const approvedManagers = managers.filter((m) => {
    const statusStr = String(m.status || '').toLowerCase();
    const isApproved = m.approved || statusStr === 'approved' || statusStr === 'active';
    return isApproved && statusStr !== 'blacklisted';
  });
  
  const approvedCount = approvedManagers.filter((m) => m.status === 'active').length;
  const suspendedCount = approvedManagers.filter((m) => m.status === 'suspended').length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardNav onMenuClick={() => {
        setSidebarOpen(!sidebarOpen);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      }} sidebarOpen={sidebarOpen} />

      {/* Content shell: pin sidebar/header; only main scrolls */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with mobile/desktop support */}
        <div className={`
          fixed left-0 top-[72px] h-[calc(100vh-72px)] z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <LeftNav 
            role="admin" 
            userName={user.name} 
            userRole={user.role} 
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden top-[72px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Floating Back Button */}
        <Link 
          href="/admin/users"
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
        >
          <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          <span className="absolute right-full mr-2 sm:mr-3 px-2 sm:px-3 py-1 bg-primary text-primary-foreground text-xs sm:text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Back to Users
          </span>
        </Link>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto">
          <div className="md:ml-64 container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <UserCog className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Manage Managers</h1>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                View and manage all registered platform managers
              </p>
            </div>

            {/* Summary Stats Card */}
            <Card className="mb-3 sm:mb-4 md:mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  Manager Statistics
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Overview of registered platform managers (via invitation only)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{approvedManagers.length}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Total Managers</div>
                  </div>
                  <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{approvedCount}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Active</div>
                  </div>
                  <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{suspendedCount}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Suspended</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">Registered Managers</h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  Only managers who registered via invitation link
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setInviteManagerOpen(true)} 
                  variant="default" 
                  size="sm" 
                  className="text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Invite New Manager
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center justify-between">
                  <span>Legitimate Managers List</span>
                  <Badge variant="secondary" className="text-[8px] sm:text-xs">
                    {approvedManagers.length} Total
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Managers who registered through the official invitation system
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 md:p-6">
                {loadingManagers ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : approvedManagers.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      No legitimate managers registered yet.
                    </p>
                    <p className="text-xs text-muted-foreground mb-4 font-semibold">
                      To add legitimate managers:
                    </p>
                    <ol className="text-xs text-left max-w-md mx-auto space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Click "Invite New Manager" button above</li>
                      <li>Send invitation email to the person (uses tasklynk.co.ke domain)</li>
                      <li>They register via the invitation link</li>
                      <li>Approve their application in "Pending Applications" page</li>
                      <li>They will appear here once approved</li>
                    </ol>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Name</TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Email</TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Phone</TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Assignments</TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Status</TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedManagers.map((manager) => {
                          const assignedClientsCount = clients.filter(c => c.assignedManagerId === manager.id).length;
                          const assignedWritersCount = writers.filter(w => w.assignedManagerId === manager.id).length;
                          // Normalize and compute status for display
                          const statusLower = String(manager.status || '').toLowerCase();
                          const isActive = (manager.approved || statusLower === 'approved' || statusLower === 'active') && statusLower !== 'suspended' && statusLower !== 'blacklisted';
                          const isSuspended = statusLower === 'suspended';
                          
                          return (
                            <TableRow key={manager.id}>
                              <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                                {manager.name}
                              </TableCell>
                              <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                                {manager.email}
                              </TableCell>
                              <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                                {manager.phone || 'N/A'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <Badge variant={assignedClientsCount > 0 ? "default" : "secondary"} className="text-[8px] sm:text-xs w-fit">
                                    {assignedClientsCount} Clients
                                  </Badge>
                                  <Badge variant={assignedWritersCount > 0 ? "default" : "secondary"} className="text-[8px] sm:text-xs w-fit">
                                    {assignedWritersCount} Writers
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {isActive && (
                                  <Badge variant="default" className="text-[8px] sm:text-xs">Active</Badge>
                                )}
                                {isSuspended && (
                                  <Badge variant="destructive" className="text-[8px] sm:text-xs">Suspended</Badge>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleResendInvite(manager)}
                                    disabled={resendingInvite === manager.id}
                                    className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                    title="Resend invitation link"
                                  >
                                    {resendingInvite === manager.id ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 animate-spin" />
                                        <span className="hidden sm:inline">Sending...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Resend</span>
                                      </>
                                    )}
                                  </Button>
                                  {isActive && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => openAssignDialog(manager)}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Assign</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedManager(manager);
                                          setEditName(manager.name);
                                          setEditEmail(manager.email);
                                          setEditPhone(manager.phone || '');
                                          setActionType('edit');
                                        }}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Edit</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          setSelectedManager(manager);
                                          setActionType('message');
                                        }}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Message</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedManager(manager);
                                          setActionType('suspend');
                                        }}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <Ban className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Suspend</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setSelectedManager(manager);
                                          setActionType('blacklist');
                                        }}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Blacklist</span>
                                      </Button>
                                    </>
                                  )}
                                  {isSuspended && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => {
                                          setSelectedManager(manager);
                                          setActionType('unsuspend');
                                        }}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Unsuspend</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          setSelectedManager(manager);
                                          setActionType('message');
                                        }}
                                        className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                      >
                                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Message</span>
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedManager(manager);
                                      setActionType('remove');
                                    }}
                                    className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Remove</span>
                                  </Button>
                                </div>
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
          </div>
        </main>
      </div>

      {/* Action Dialogs */}
      <AlertDialog open={!!selectedManager && ['approve', 'reject', 'remove', 'unsuspend'].includes(actionType || '')} onOpenChange={() => {
        setSelectedManager(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && 'Approve Manager'}
              {actionType === 'reject' && 'Reject Manager'}
              {actionType === 'remove' && 'Remove Manager'}
              {actionType === 'unsuspend' && 'Unsuspend Manager'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && `Are you sure you want to approve ${selectedManager?.name}? They will gain manager access to the platform.`}
              {actionType === 'reject' && `Are you sure you want to reject ${selectedManager?.name}? They will be blacklisted and cannot access the platform.`}
              {actionType === 'remove' && `Are you sure you want to remove ${selectedManager?.name}? This action cannot be undone.`}
              {actionType === 'unsuspend' && `Are you sure you want to unsuspend ${selectedManager?.name}? They will regain manager access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedManager) {
                  if (actionType === 'approve') handleApprove(selectedManager.id);
                  if (actionType === 'reject') handleReject(selectedManager.id);
                  if (actionType === 'remove') handleRemove(selectedManager.id);
                  if (actionType === 'unsuspend') handleUnsuspend(selectedManager.id);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <Dialog open={actionType === 'suspend'} onOpenChange={(open) => {
        if (!open) {
          setSelectedManager(null);
          setActionType(null);
          setSuspendDuration('7');
          setSuspendReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Manager</DialogTitle>
            <DialogDescription>
              Temporarily suspend {selectedManager?.name} from the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Suspension Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Suspension *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedManager(null);
              setActionType(null);
              setSuspendDuration('7');
              setSuspendReason('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSuspend}>
              Suspend Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={actionType === 'blacklist'} onOpenChange={(open) => {
        if (!open) {
          setSelectedManager(null);
          setActionType(null);
          setBlacklistReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist Manager</DialogTitle>
            <DialogDescription>
              Permanently blacklist {selectedManager?.name} from the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blacklistReason">Reason for Blacklist *</Label>
              <Textarea
                id="blacklistReason"
                placeholder="Enter reason for blacklist..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedManager(null);
              setActionType(null);
              setBlacklistReason('');
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlacklist}>
              Blacklist Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Manager Dialog */}
      <Dialog open={actionType === 'edit'} onOpenChange={(open) => {
        if (!open) {
          setSelectedManager(null);
          setActionType(null);
          setEditName('');
          setEditEmail('');
          setEditPhone('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Manager</DialogTitle>
            <DialogDescription>
              Update manager information for {selectedManager?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter manager name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter manager email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone (Optional)</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedManager(null);
              setActionType(null);
              setEditName('');
              setEditEmail('');
              setEditPhone('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updating}>
              {updating ? 'Updating...' : 'Update Manager'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={actionType === 'message'} onOpenChange={(open) => {
        if (!open) {
          setSelectedManager(null);
          setActionType(null);
          setMessageContent('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {selectedManager?.name}</DialogTitle>
            <DialogDescription>
              This message will be sent directly to the manager&apos;s email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedManager(null);
              setActionType(null);
              setMessageContent('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sendingMessage}>
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={actionType === 'assign'} onOpenChange={(open) => {
        if (!open) {
          setSelectedManager(null);
          setActionType(null);
          setSelectedClientIds([]);
          setSelectedWriterIds([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Clients & Writers to {selectedManager?.name}</DialogTitle>
            <DialogDescription>
              Select clients and writers to assign to this manager. They will only see jobs related to their assigned users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Clients Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clients ({selectedClientIds.length} selected)
              </h3>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No clients available</p>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}`}
                          checked={selectedClientIds.includes(client.id)}
                          onCheckedChange={() => toggleClient(client.id)}
                        />
                        <Label 
                          htmlFor={`client-${client.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {client.name} - {client.email}
                          {client.assignedManagerId && client.assignedManagerId !== selectedManager?.id && (
                            <span className="text-xs text-muted-foreground ml-2">(Assigned to another manager)</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Writers Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Writers ({selectedWriterIds.length} selected)
              </h3>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                {writers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No writers available</p>
                ) : (
                  <div className="space-y-2">
                    {writers.map((writer) => (
                      <div key={writer.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`writer-${writer.id}`}
                          checked={selectedWriterIds.includes(writer.id)}
                          onCheckedChange={() => toggleWriter(writer.id)}
                        />
                        <Label 
                          htmlFor={`writer-${writer.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {writer.name} - {writer.email}
                          {writer.assignedManagerId && writer.assignedManagerId !== selectedManager?.id && (
                            <span className="text-xs text-muted-foreground ml-2">(Assigned to another manager)</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedManager(null);
                setActionType(null);
                setSelectedClientIds([]);
                setSelectedWriterIds([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignUsers} disabled={assigning}>
              {assigning ? 'Assigning...' : 'Assign Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InviteManagerDialog
        open={inviteManagerOpen}
        onOpenChange={setInviteManagerOpen}
        onInviteSuccess={() => {
          toast.success('Manager invite sent successfully to tasklynk.co.ke email!');
          setInviteManagerOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}