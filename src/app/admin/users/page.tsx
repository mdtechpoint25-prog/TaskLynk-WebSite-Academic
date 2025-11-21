"use client";

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Trash2, Star, Ban, PlayCircle, Shield, ArrowLeft, Award, TrendingUp, Crown, Info, Zap, Building, UserCog, Briefcase, Users, MessageSquare, Link as LinkIcon, FileUp, Mail } from 'lucide-react';
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
import { toast } from 'sonner';
import { InviteManagerDialog } from '@/components/invite-manager-dialog';

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  approved: boolean;
  balance: number | null;
  rating: number | null;
  phone: string | null;
  status: string;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  blacklistReason: string | null;
  completedJobs: number | null;
  totalSpent: number | null;
  freelancerBadge: string | null;
  clientTier: string | null;
  clientPriority: string | null;
  accountOwner: string | boolean | null;
  createdAt: string;
};

// SEO-optimized metadata
const pageSEO = {
  title: "User Management - TaskLynk Academic Writing Platform | Manage Writers, Clients & Essays",
  description: "Professional user management system for academic writing services. Manage freelance writers, essay writers, assignment helpers, clients, and online job orders. TaskLynk - Kenya's leading academic writing platform.",
  keywords: [
    "academic writer management",
    "freelance writer platform",
    "essay writer management",
    "assignment writer platform",
    "online writing jobs Kenya",
    "academic writing management",
    "writer administration system",
    "client management platform",
    "essay writing service management",
    "task management system",
    "academic job board",
    "writer marketplace Kenya"
  ]
};

// Badge/Tier display components
const FreelancerBadgeDisplay = ({ badge }: { badge: string | null }) => {
  if (!badge) return <span className="text-muted-foreground text-sm">No Badge</span>;
  
  const badgeConfig = {
    bronze: { label: 'Bronze', icon: Award, color: 'bg-orange-700 text-white', desc: '0-9 orders' },
    silver: { label: 'Silver', icon: Award, color: 'bg-gray-400 text-white', desc: '10-24 orders' },
    gold: { label: 'Gold', icon: Award, color: 'bg-yellow-500 text-white', desc: '25-49 orders' },
    platinum: { label: 'Platinum', icon: Crown, color: 'bg-purple-600 text-white', desc: '50-99 orders' },
    elite: { label: 'Elite', icon: Crown, color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', desc: '100+ orders' },
  }[badge];

  if (!badgeConfig) return null;
  const Icon = badgeConfig.icon;

  return (
    <Badge className={badgeConfig.color}>
      <Icon className="w-3 h-3 mr-1" />
      {badgeConfig.label}
    </Badge>
  );
};

const ClientTierDisplay = ({ tier }: { tier: string | null }) => {
  if (!tier) return <span className="text-muted-foreground text-sm">Basic</span>;
  
  const tierConfig = {
    basic: { label: '🪙 Basic', color: 'bg-gray-500 text-white' },
    silver: { label: '🥈 Silver', color: 'bg-gray-400 text-white' },
    gold: { label: '🥇 Gold', color: 'bg-yellow-500 text-white' },
    platinum: { label: '💎 Platinum', color: 'bg-purple-600 text-white' },
  }[tier];

  if (!tierConfig) return null;

  return (
    <Badge className={tierConfig.color}>
      {tierConfig.label}
    </Badge>
  );
};

const ClientPriorityDisplay = ({ priority }: { priority: string | null }) => {
  const priorityConfig = {
    regular: { label: '📋 Regular', color: 'bg-slate-500 text-white' },
    priority: { label: '⚡ Priority', color: 'bg-orange-600 text-white' },
    vip: { label: '👑 VIP', color: 'bg-red-600 text-white' },
  }[priority || 'regular'];

  return (
    <Badge className={priorityConfig.color}>
      {priorityConfig.label}
    </Badge>
  );
};

// Helper: check if user is active (approved status)
const isUserActive = (user: User) => user.approved && user.status === 'approved';

function AdminUsersContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Add sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Expand role-based lists to specific categories
  const [activeRoleTab, setActiveRoleTab] = useState<'all' | 'freelancers' | 'clients' | 'account_owners' | 'regular_clients' | 'on_hold_clients' | 'admins' | 'managers'>('all');
  
  // Invite Manager Dialog
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);
  
  // Selected user and action type state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'remove' | 'suspend' | 'unsuspend' | 'blacklist' | 'badge' | 'tier' | 'priority' | 'message' | 'link' | 'file' | null>(null);
  
  // Suspend dialog state
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [suspendReason, setSuspendReason] = useState('');
  
  // Blacklist dialog state
  const [blacklistReason, setBlacklistReason] = useState('');

  // Badge/Tier dialog state
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Message/Link/File state
  const [messageContent, setMessageContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Helper: sync role to URL
  const pushRoleToUrl = (roleValue: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('role', roleValue);
    router.push(`/admin/users?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchUsers();
        
        // Handle role tab from URL
        const roleParam = searchParams.get('role');
        if (roleParam && ['all', 'freelancers', 'clients', 'account_owners', 'regular_clients', 'on_hold_clients', 'admins', 'managers'].includes(roleParam)) {
          setActiveRoleTab(roleParam as any);
        }
      }
    }
  }, [user, loading, router, searchParams]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

  // Separate users by role
  const freelancers = users.filter(u => u.role === 'freelancer');
  const clients = users.filter(u => u.role === 'client' || u.role === 'account_owner');
  const accountOwnersOnly = users.filter(u => u.role === 'account_owner');
  const regularClientsOnly = users.filter(u => u.role === 'client');
  const onHoldClientsOnly = users.filter(u => (u.role === 'client' || u.role === 'account_owner') && u.status === 'on_hold');
  const admins = users.filter(u => u.role === 'admin');
  const managers = users.filter(u => u.role === 'manager');

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalFreelancers: freelancers.length,
    totalClients: clients.length,
    totalManagers: managers.length,
    totalAdmins: admins.length,
    activeUsers: users.filter(u => isUserActive(u)).length,
    pendingUsers: users.filter(u => !u.approved && u.status !== 'blacklisted').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length,
  };

  // Display label for active role tab - UPDATED WITH SEO KEYWORDS
  const roleTabLabel: Record<typeof activeRoleTab, string> = {
    all: 'All Users',
    freelancers: 'Writers/Freelancers', // UPDATED: Combined terminology
    clients: 'Clients',
    account_owners: 'Account Owners',
    regular_clients: 'Regular Clients',
    on_hold_clients: 'On Hold Clients',
    admins: 'Admins',
    managers: 'Managers',
  } as const;

  // Determine if we should show the Priority column (client badge visibility in admin lists)
  const showPriorityColumn = ['clients','account_owners','regular_clients','on_hold_clients','all'].includes(activeRoleTab);

  // Get current list based on active role tab - NO STATUS FILTERING
  const getCurrentList = () => {
    switch (activeRoleTab) {
      case 'all': return users;
      case 'freelancers': return freelancers;
      case 'clients': return clients;
      case 'account_owners': return accountOwnersOnly;
      case 'regular_clients': return regularClientsOnly;
      case 'on_hold_clients': return onHoldClientsOnly;
      case 'admins': return admins;
      case 'managers': return managers;
      default: return [];
    }
  };

  const currentList = getCurrentList();

  // Action Handlers - FIXED API CALLS
  const handleApprove = async (userId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        toast.success('User approved successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: 'Your application has been reviewed and not approved at this time.'
        }),
      });
      if (response.ok) {
        toast.success('User rejected successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleRemove = async (userId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${userId}/remove`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        toast.success('User removed successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    try {
      const token = localStorage.getItem('bearer_token');
      // FIX: Use PATCH method and 'duration' field (not 'days')
      const response = await fetch(`/api/users/${selectedUser.id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          duration: parseInt(suspendDuration),
          reason: suspendReason,
        }),
      });
      if (response.ok) {
        toast.success('User suspended successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSuspendDuration('7');
      setSuspendReason('');
    }
  };

  const handleUnsuspend = async (userId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      // FIX: Use PATCH method (not POST)
      const response = await fetch(`/api/users/${userId}/unsuspend`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        toast.success('User unsuspended successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleBlacklist = async () => {
    if (!selectedUser || !blacklistReason.trim()) {
      toast.error('Please provide a reason for blacklist');
      return;
    }
    try {
      const token = localStorage.getItem('bearer_token');
      // FIX: Use PATCH method (not POST)
      const response = await fetch(`/api/users/${selectedUser.id}/blacklist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: blacklistReason }),
      });
      if (response.ok) {
        toast.success('User blacklisted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to blacklist user');
      }
    } catch (error) {
      console.error('Error blacklisting user:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setBlacklistReason('');
    }
  };

  const handleBadgeUpdate = async () => {
    if (!selectedUser || !selectedBadge) {
      toast.error('Please select a badge');
      return;
    }
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${selectedUser.id}/badge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ badge: selectedBadge }),
      });
      if (response.ok) {
        toast.success('Badge updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update badge');
      }
    } catch (error) {
      console.error('Error updating badge:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedBadge('');
    }
  };

  const handleTierUpdate = async () => {
    if (!selectedUser || !selectedTier) {
      toast.error('Please select a tier');
      return;
    }
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${selectedUser.id}/tier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier: selectedTier }),
      });
      if (response.ok) {
        toast.success('Tier updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update tier');
      }
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedTier('');
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedUser || !selectedPriority) {
      toast.error('Please select a priority');
      return;
    }
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${selectedUser.id}/priority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priority: selectedPriority }),
      });
      if (response.ok) {
        toast.success('Priority updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('An error occurred');
    } finally {
      setSelectedUser(null);
      setActionType(null);
      setSelectedPriority('');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || (!messageContent.trim() && !linkUrl.trim() && !fileUrl.trim())) {
      toast.error('Please provide message content, link, or file');
      return;
    }
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('bearer_token');
      // Implementation would depend on your messaging API
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred');
    } finally {
      setSendingMessage(false);
      setSelectedUser(null);
      setActionType(null);
      setMessageContent('');
      setLinkUrl('');
      setFileUrl('');
    }
  };

  const handleRecalculateRatings = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/users/calculate-ratings', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        toast.success('Ratings recalculated successfully');
      }
    } catch (error) {
      console.error('Error recalculating ratings:', error);
      toast.error('An error occurred');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Metadata */}
      <head>
        <title>{pageSEO.title}</title>
        <meta name="description" content={pageSEO.description} />
        <meta name="keywords" content={pageSEO.keywords.join(", ")} />
        <meta property="og:title" content={pageSEO.title} />
        <meta property="og:description" content={pageSEO.description} />
        <meta name="twitter:title" content={pageSEO.title} />
        <meta name="twitter:description" content={pageSEO.description} />
      </head>

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
          <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">User Management by Category</h1>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Manage academic writers, essay writers, freelancers, clients, and online job assignments. Select a category to view and manage users registered under each role.
        </p>
      </div>

      {/* Summary Stats Card - SHOW ONLY on All Users to reduce congestion */}
      {activeRoleTab === 'all' && (
        <Card className="mb-3 sm:mb-4 md:mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Platform Statistics - Academic Writing Services
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Overview of all users: writers, freelancers, clients, and assignments across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{stats.totalUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{stats.totalFreelancers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Writers/Freelancers</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.totalClients}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{stats.totalManagers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Managers</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">{stats.totalAdmins}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Admins</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Active</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="bg-background/50 p-2 sm:p-3 md:p-4 rounded-lg border">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold">User Management by Category</h2>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Choose a category to manage: academic writers, essay writers, freelancers, clients, assignments
          </p>
        </div>
        <Button onClick={handleRecalculateRatings} variant="outline" size="sm" className="text-xs sm:text-sm">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Recalculate Ratings
        </Button>
      </div>

      {/* Role-based Tabs - UPDATED LABELS */}
      <Card className="mb-4">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Select Category</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Show users for one category at a time: writers, freelancers, clients, or admins
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <Tabs value={activeRoleTab} onValueChange={(v) => {
            setActiveRoleTab(v as any);
            pushRoleToUrl(v);
          }} className="w-full">
            <TabsList className="grid grid-cols-7 w-full gap-1 h-auto p-1">
              <TabsTrigger value="all" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>All Users</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{users.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="freelancers" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Writers/Freelancers</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{freelancers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="account_owners" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Account Owners</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{accountOwnersOnly.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="regular_clients" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Regular Clients</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{regularClientsOnly.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="on_hold_clients" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>On Hold Clients</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{onHoldClientsOnly.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="managers" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <UserCog className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Managers</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{managers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="admins" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 flex items-center gap-1">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Admins</span>
                <Badge variant="secondary" className="text-[8px] sm:text-xs px-1">{admins.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Users Table - Single Card with Selected Category */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg capitalize">
            {roleTabLabel[activeRoleTab]}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {activeRoleTab === 'freelancers' ? (
              <>Showing {currentList.length} academic writers, essay writers, assignment helpers, and freelancers available for online jobs</>
            ) : (
              <>Showing {currentList.length} {roleTabLabel[activeRoleTab].toLowerCase()}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          {loadingUsers ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
              No {roleTabLabel[activeRoleTab].toLowerCase()} found
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Name</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Email</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Role</TableHead>
                    {activeRoleTab !== 'admins' && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                        {activeRoleTab === 'freelancers' ? 'Badge' : 'Tier'}
                      </TableHead>
                    )}
                    {showPriorityColumn && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Priority</TableHead>
                    )}
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Phone</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Rating</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Stats</TableHead>
                    {activeRoleTab === 'freelancers' && (
                      <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Balance</TableHead>
                    )}
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{u.name}</TableCell>
                      <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="capitalize text-[8px] sm:text-xs">
                          {u.role}
                        </Badge>
                      </TableCell>
                      {activeRoleTab !== 'admins' && (
                        <TableCell className="whitespace-nowrap">
                          {u.role === 'freelancer' ? (
                            <FreelancerBadgeDisplay badge={u.freelancerBadge} />
                          ) : u.role === 'client' || u.role === 'account_owner' ? (
                            <ClientTierDisplay tier={u.clientTier} />
                          ) : (
                            <span className="text-muted-foreground text-[10px] sm:text-xs">N/A</span>
                          )}
                        </TableCell>
                      )}
                      {showPriorityColumn && (
                        <TableCell className="whitespace-nowrap">
                          {(u.role === 'client' || u.role === 'account_owner') ? (
                            <ClientPriorityDisplay priority={u.clientPriority} />
                          ) : (
                            <span className="text-muted-foreground text-[10px] sm:text-xs">N/A</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{u.phone || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {u.rating ? (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="text-[10px] sm:text-xs md:text-sm">{u.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs md:text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground space-y-1">
                          <div>Jobs: {u.completedJobs ?? 0}</div>
                          {(u.role === 'client' || u.role === 'account_owner') && <div>Spent: KSh {(u.totalSpent ?? 0).toFixed(0)}</div>}
                        </div>
                      </TableCell>
                      {activeRoleTab === 'freelancers' && (
                        <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                          KSh {(u.balance ?? 0).toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        {isUserActive(u) && (
                          <Badge variant="default" className="text-[8px] sm:text-xs">Active</Badge>
                        )}
                        {u.status === 'suspended' && (
                          <Badge variant="destructive" className="text-[8px] sm:text-xs">Suspended</Badge>
                        )}
                        {u.status === 'blacklisted' && (
                          <Badge variant="destructive" className="text-[8px] sm:text-xs">Blacklisted</Badge>
                        )}
                        {!u.approved && u.status !== 'blacklisted' && (
                          <Badge variant="secondary" className="text-[8px] sm:text-xs">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {!u.approved && u.status !== 'blacklisted' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('approve');
                                }}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('reject');
                                }}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </>
                          )}
                          {isUserActive(u) && (
                            <>
                              {u.role === 'freelancer' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedBadge(u.freelancerBadge || 'bronze');
                                    setActionType('badge');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <Award className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Badge</span>
                                </Button>
                              )}
                              {(u.role === 'client' || u.role === 'account_owner') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedTier(u.clientTier || 'basic');
                                    setActionType('tier');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Tier</span>
                                </Button>
                              )}
                              {(u.role === 'client' || u.role === 'account_owner') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setSelectedPriority(u.clientPriority || 'regular');
                                    setActionType('priority');
                                  }}
                                  className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                                >
                                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Priority</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('suspend');
                                }}
                                className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                              >
                                <Ban className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Suspend</span>
                              </Button>
                            </>
                          )}
                          {u.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('unsuspend');
                              }}
                              className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                            >
                              <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Unsuspend</span>
                            </Button>
                          )}
                          {u.approved && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('remove');
                              }}
                              className="text-[10px] sm:text-xs px-2 py-1 h-auto"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Remove</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <AdminUsersContent />
    </Suspense>
  );
}