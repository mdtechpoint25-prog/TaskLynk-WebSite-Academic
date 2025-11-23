"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Users, RefreshCw, AlertTriangle, Activity, Clock, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface FreelancerStatus {
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  freelancerPhone: string | null;
  freelancerRating: number | null;
  currentJobsCount: number;
  isOnline: boolean;
  lastSeenAt: string;
}

export default function ManagerLiveWritersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [writers, setWriters] = useState<FreelancerStatus[]>([]);
  const [loadingWriters, setLoadingWriters] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnline, setFilterOnline] = useState(true);
  const hasCheckedAuth = useRef(false);
  const hasFetchedWriters = useRef(false);

  const fetchLiveWriters = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);

    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/v2/freelancers/active?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWriters(data.freelancers || []);
      } else {
        toast.error('Failed to fetch live writers');
      }
    } catch (error) {
      console.error('Failed to fetch live writers:', error);
      toast.error('Network error');
    } finally {
      setLoadingWriters(false);
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;

    hasCheckedAuth.current = true;

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'manager') {
      window.location.href = '/';
      return;
    }

    if (!hasFetchedWriters.current) {
      hasFetchedWriters.current = true;
      fetchLiveWriters();
    }
  }, [user, loading, fetchLiveWriters]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveWriters(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchLiveWriters]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const onlineWriters = writers.filter((w) => w.isOnline);
  const offlineWriters = writers.filter((w) => !w.isOnline);

  const filteredWriters = filterOnline ? onlineWriters : writers;
  const searchedWriters = filteredWriters.filter(
    (writer) =>
      writer.freelancerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      writer.freelancerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (writer.freelancerPhone && writer.freelancerPhone.includes(searchTerm))
  );

  return (
    <div className="w-full h-full -m-6">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
              <Activity className="h-8 w-8 text-purple-600" />
              Freelancers on Duty
            </h1>
            <p className="text-muted-foreground">Monitor your writers' activity and current workload</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-lg px-3 py-1">
              {onlineWriters.length} Online
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveWriters(false)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b bg-slate-50 dark:bg-slate-900/30">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-3xl font-bold text-green-600">{onlineWriters.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Active Jobs</p>
                <p className="text-3xl font-bold text-blue-600">
                  {onlineWriters.reduce((sum, w) => sum + w.currentJobsCount, 0)}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Jobs per Writer</p>
                <p className="text-3xl font-bold text-purple-600">
                  {onlineWriters.length > 0
                    ? (onlineWriters.reduce((sum, w) => sum + w.currentJobsCount, 0) / onlineWriters.length).toFixed(1)
                    : '0'}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="px-6 py-4 border-b space-y-4">
        <div className="flex gap-2">
          <Button
            variant={filterOnline ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOnline(true)}
            className="flex-1 text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            Online Only ({onlineWriters.length})
          </Button>
          <Button
            variant={!filterOnline ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOnline(false)}
            className="flex-1 text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            All Writers ({writers.length})
          </Button>
        </div>
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm h-9"
        />
      </div>

      {/* Writers List */}
      <div className="p-6">
        {loadingWriters ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading writers...</p>
          </div>
        ) : searchedWriters.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {filterOnline
                ? 'No writers are currently online'
                : 'No writers found matching your search'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {searchedWriters.map((writer) => (
              <Card
                key={writer.freelancerId}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  writer.isOnline
                    ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                    : 'border-gray-200 opacity-75 dark:border-gray-700'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{writer.freelancerName}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{writer.freelancerEmail}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {writer.isOnline ? (
                        <Badge className="bg-green-600 text-white text-xs">
                          <Activity className="h-2 w-2 mr-1 animate-pulse" />
                          Online
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Offline
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Information */}
                  {writer.freelancerPhone && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">📞 {writer.freelancerPhone}</p>
                      </div>
                      <a
                        href={`tel:${writer.freelancerPhone}`}
                        className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Call
                      </a>
                    </div>
                  )}

                  {/* Rating */}
                  {writer.freelancerRating && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-yellow-600">★ {writer.freelancerRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">Rating</span>
                    </div>
                  )}

                  {/* Current Jobs */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950/50">
                    <span className="text-xs font-medium text-muted-foreground">Active Jobs:</span>
                    <Badge variant="secondary" className="text-xs">
                      {writer.currentJobsCount}
                    </Badge>
                  </div>

                  {/* Last Seen */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950/50">
                    <span className="text-xs font-medium text-muted-foreground">Last Seen:</span>
                    <span className="text-xs">
                      {new Date(writer.lastSeenAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-2 border-t">
                    {writer.isOnline ? (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                        Currently working
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        Last seen {new Date(writer.lastSeenAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
