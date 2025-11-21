"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserCheck, 
  Search, 
  RefreshCw, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle,
  UserCog,
  Star,
  TrendingUp,
  Edit,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: number;
  displayId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  balance?: number;
  rating?: number;
  completedJobs?: number;
  assignedManagerId?: number | null;
  tier?: string;
  priority?: string;
};

export default function FreelancersManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit form state
  const [editTier, setEditTier] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editRating, setEditRating] = useState<string>('');

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
      
      const freelancersRes = await fetch('/api/users?role=freelancer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (freelancersRes.ok) {
        const data = await freelancersRes.json();
        setFreelancers(data);
      } else {
        toast.error('Failed to load freelancers');
      }

      const managersRes = await fetch('/api/users/by-role?role=manager&approved=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
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
        toast.success(`Freelancer ${newStatus} successfully`);
        await fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${newStatus} freelancer`);
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const managerIdValue = selectedManagerId === '0' ? null : parseInt(selectedManagerId);
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedManagerId: managerIdValue }),
      });

      if (response.ok) {
        toast.success(managerIdValue ? 'Manager assigned successfully' : 'Manager removed successfully');
        setShowAssignDialog(false);
        setSelectedUser(null);
        setSelectedManagerId('');
        await fetchData();
      } else {
        toast.error('Failed to assign manager');
      }
    } catch (error) {
      console.error('Assign manager error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditFreelancer = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const updates: any = {};
      if (editTier) updates.tier = editTier;
      if (editPriority) updates.priority = editPriority;
      if (editRating) updates.rating = parseFloat(editRating);

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Freelancer updated successfully');
        setShowEditDialog(false);
        setSelectedUser(null);
        setEditTier('');
        setEditPriority('');
        setEditRating('');
        await fetchData();
      } else {
        toast.error('Failed to update freelancer');
      }
    } catch (error) {
      console.error('Edit freelancer error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = 
      freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freelancer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freelancer.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      freelancer.status === statusFilter ||
      (statusFilter === 'approved' && (freelancer.status === 'approved' || freelancer.status === 'active'));
    
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
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Freelancer Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage all freelancers, approve/reject applications, and assign managers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{freelancers.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {freelancers.filter(f => f.status === 'pending').length}
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
                  {freelancers.filter(f => f.status === 'approved' || f.status === 'active').length}
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
                  {freelancers.filter(f => f.status === 'suspended').length}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Freelancers List */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Freelancers ({filteredFreelancers.length})</CardTitle>
          <CardDescription>View and manage all freelancer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading freelancers...</p>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl">
              <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No freelancers found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFreelancers.map((freelancer) => (
                <div
                  key={freelancer.id}
                  className="border-2 rounded-2xl p-5 transition-all hover:bg-muted/50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg">{freelancer.name}</h3>
                        <Badge variant="outline" className="rounded-xl">{freelancer.displayId}</Badge>
                        {getStatusBadge(freelancer.status)}
                        {freelancer.tier && (
                          <Badge className="bg-purple-100 text-purple-800 rounded-xl">
                            <Award className="w-3 h-3 mr-1" />
                            {freelancer.tier}
                          </Badge>
                        )}
                        {freelancer.priority && (
                          <Badge className="bg-orange-100 text-orange-800 rounded-xl">
                            {freelancer.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{freelancer.email}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {freelancer.rating !== undefined && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{freelancer.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        )}
                        {freelancer.completedJobs !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>{freelancer.completedJobs || 0} jobs</span>
                          </div>
                        )}
                        {freelancer.balance !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Balance: KSh {freelancer.balance?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {freelancer.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleStatusChange(freelancer.id, 'approved')}
                            disabled={actionLoading}
                            size="sm"
                            className="rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(freelancer.id, 'rejected')}
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
                      {(freelancer.status === 'approved' || freelancer.status === 'active') && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedUser(freelancer);
                              setEditTier(freelancer.tier || '');
                              setEditPriority(freelancer.priority || '');
                              setEditRating(freelancer.rating?.toString() || '');
                              setShowEditDialog(true);
                            }}
                            disabled={actionLoading}
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedUser(freelancer);
                              setSelectedManagerId(freelancer.assignedManagerId?.toString() || '0');
                              setShowAssignDialog(true);
                            }}
                            disabled={actionLoading}
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                          >
                            <UserCog className="w-4 h-4 mr-2" />
                            Manager
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(freelancer.id, 'suspended')}
                            disabled={actionLoading}
                            variant="destructive"
                            size="sm"
                            className="rounded-xl"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend
                          </Button>
                        </>
                      )}
                      {freelancer.status === 'suspended' && (
                        <Button
                          onClick={() => handleStatusChange(freelancer.id, 'unsuspend')}
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

      {/* Edit Freelancer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Freelancer</DialogTitle>
            <DialogDescription>
              Update tier, priority, and rating for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tier</Label>
              <Select value={editTier} onValueChange={setEditTier}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rating (0-5)</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={editRating}
                onChange={(e) => setEditRating(e.target.value)}
                placeholder="0.0"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleEditFreelancer} disabled={actionLoading} className="rounded-xl">
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Manager Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Select a manager to assign to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0">No Manager</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name} ({manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleAssignManager} disabled={actionLoading} className="rounded-xl">
              {actionLoading ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}