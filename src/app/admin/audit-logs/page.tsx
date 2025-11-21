"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { toast } from 'sonner';

type AuditLog = {
  id: number;
  adminId: number;
  adminName: string;
  adminEmail: string;
  action: string;
  targetId: number | null;
  targetType: string;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
};

type PaginationInfo = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export default function AdminAuditLogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch audit logs
  const fetchLogs = useCallback(async (page: number = 1) => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (actionFilter) params.append('action', actionFilter);
      if (targetTypeFilter) params.append('targetType', targetTypeFilter);
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('[Audit Logs] Fetch error:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoadingLogs(false);
    }
  }, [actionFilter, targetTypeFilter, startDate, endDate]);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchLogs(1);
      }
    }
  }, [user, loading, router, fetchLogs]);

  const handleApplyFilters = useCallback(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleClearFilters = useCallback(() => {
    setActionFilter('');
    setTargetTypeFilter('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchLogs(1), 100);
  }, [fetchLogs]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  }, [pagination.totalPages, fetchLogs]);

  const getActionBadgeVariant = useCallback((action: string) => {
    if (action.includes('approve') || action.includes('accept')) return 'default';
    if (action.includes('reject') || action.includes('suspend') || action.includes('blacklist')) return 'destructive';
    if (action.includes('assign') || action.includes('process')) return 'secondary';
    return 'outline';
  }, []);

  const formatTimestamp = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const formatDetails = useCallback((details: string | null) => {
    if (!details) return '-';
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return details;
    }
  }, []);

  const logRows = useMemo(() => logs.map((log) => (
    <TableRow key={log.id}>
      <TableCell className="text-sm">
        {formatTimestamp(log.timestamp)}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{log.adminName}</div>
          <div className="text-xs text-muted-foreground">
            {log.adminEmail}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getActionBadgeVariant(log.action)}>
          {log.action.replace(/_/g, ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="font-medium capitalize">{log.targetType}</div>
          {log.targetId && (
            <div className="text-xs text-muted-foreground">
              ID: {log.targetId}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-xs truncate text-sm">
        {formatDetails(log.details)}
      </TableCell>
      <TableCell className="text-sm">
        {log.ipAddress || '-'}
      </TableCell>
    </TableRow>
  )), [logs, formatTimestamp, getActionBadgeVariant, formatDetails]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Audit Log</h1>
        </div>
        <p className="text-muted-foreground">
          Track all administrative actions across the platform
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="action-filter">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="approve_user">Approve User</SelectItem>
                  <SelectItem value="reject_user">Reject User</SelectItem>
                  <SelectItem value="suspend_user">Suspend User</SelectItem>
                  <SelectItem value="unsuspend_user">Unsuspend User</SelectItem>
                  <SelectItem value="blacklist_user">Blacklist User</SelectItem>
                  <SelectItem value="remove_user">Remove User</SelectItem>
                  <SelectItem value="confirm_payment">Confirm Payment</SelectItem>
                  <SelectItem value="approve_payout">Approve Payout</SelectItem>
                  <SelectItem value="process_payout">Process Payout</SelectItem>
                  <SelectItem value="reject_payout">Reject Payout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target-type-filter">Target Type</Label>
              <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                <SelectTrigger id="target-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} className="gap-2">
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs ({pagination.totalCount} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found matching your filters
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logRows}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}