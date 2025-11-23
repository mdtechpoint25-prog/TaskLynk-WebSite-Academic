'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActiveWritersCountProps {
  showNames?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ActiveWritersCount({
  showNames = false,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: ActiveWritersCountProps) {
  const [activeCount, setActiveCount] = useState(0);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchActiveWriters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v2/freelancers/active');
      if (response.ok) {
        const data = await response.json();
        setActiveCount(data.activeCount || 0);
        setFreelancers(data.freelancers || []);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch active writers');
      }
    } catch (err) {
      console.error('Error fetching active writers:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActiveWriters();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActiveWriters();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Active Writers</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchActiveWriters}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-xs text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-bold text-green-600">{activeCount}</div>
              <div className="text-sm text-muted-foreground mb-1">
                writer{activeCount !== 1 ? 's' : ''} online now
              </div>
            </div>

            {showNames && freelancers.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Currently Online
                </div>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                  {freelancers.map((freelancer) => (
                    <div
                      key={freelancer.freelancerId}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-green-100 dark:border-green-900"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {freelancer.freelancerName}
                        </p>
                        {freelancer.currentJobsCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {freelancer.currentJobsCount} active job{freelancer.currentJobsCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      {freelancer.freelancerRating && (
                        <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                          ★ {freelancer.freelancerRating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
