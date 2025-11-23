'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ManagerContact {
  managerId: number;
  managerName: string;
  managerEmail: string;
  managerPhone: string | null;
  lastSeenAt: string;
}

export default function OnlineManagersWidget() {
  const [managers, setManagers] = useState<ManagerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v2/managers/active', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch online managers');
        }

        const data = await response.json();
        setManagers(data.managers || []);
      } catch (error) {
        console.error('Error fetching managers:', error);
        setError(error instanceof Error ? error.message : 'Failed to load managers');
        toast.error('Could not load online managers');
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchManagers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Available Managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4" />
            Managers Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (managers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            Available Managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No managers currently online</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Available Managers
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {managers.length} Online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {managers.map((manager) => (
          <div
            key={manager.managerId}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{manager.managerName}</p>
                <p className="text-xs text-muted-foreground truncate">{manager.managerEmail}</p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex gap-2">
              {manager.managerPhone && (
                <a
                  href={`tel:${manager.managerPhone}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  title={`Call ${manager.managerName}`}
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
              )}
              <a
                href={`mailto:${manager.managerEmail}`}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={`Email ${manager.managerName}`}
              >
                <Mail className="h-3 w-3" />
                Email
              </a>
            </div>

            {/* Phone Display if available */}
            {manager.managerPhone && (
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-medium">
                📞 {manager.managerPhone}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
