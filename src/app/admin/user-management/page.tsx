"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Tag, RefreshCw, Database } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminUserManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [restoringRoles, setRestoringRoles] = useState(false);
  const [seedingCategories, setSeedingCategories] = useState(false);
  const [categoriesSummary, setCategoriesSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleRestoreRoles = async () => {
    if (!confirm('Are you sure you want to restore all users to their original roles? This will revert any manual role changes.')) {
      return;
    }

    setRestoringRoles(true);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = storedToken || (user?.id ? String(user.id) : null);

      const response = await fetch('/api/admin/restore-original-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully restored ${data.updates.length} users to their original roles`);
        if (data.updates.length > 0) {
          console.log('Role updates:', data.updates);
        }
      } else {
        toast.error(data.error || 'Failed to restore user roles');
      }
    } catch (error) {
      console.error('Error restoring roles:', error);
      toast.error('Failed to restore user roles');
    } finally {
      setRestoringRoles(false);
    }
  };

  const handleSeedCategories = async () => {
    if (!confirm('This will categorize all users based on their current roles. Continue?')) {
      return;
    }

    setSeedingCategories(true);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = storedToken || (user?.id ? String(user.id) : null);

      const response = await fetch('/api/admin/user-categories/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully categorized ${data.categorizations.length} users`);
        fetchCategoriesSummary(); // Refresh summary
      } else {
        toast.error(data.error || 'Failed to seed user categories');
      }
    } catch (error) {
      console.error('Error seeding categories:', error);
      toast.error('Failed to seed user categories');
    } finally {
      setSeedingCategories(false);
    }
  };

  const fetchCategoriesSummary = async () => {
    setLoadingSummary(true);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const authToken = storedToken || (user?.id ? String(user.id) : null);

      const response = await fetch('/api/admin/user-categories', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCategoriesSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching categories summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    router.push('/');
    return null;
  }

  return (
    <div className="w-full">
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
          <Database className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">User Management Tools</h1>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Restore original roles and manage user categorization
        </p>
      </div>

      {/* Restore Original Roles Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Restore Original User Roles
          </CardTitle>
          <CardDescription>
            Reset all users to their original intended roles (freelancer, client, admin). 
            This removes any unintended role changes like managers who shouldn't be managers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                ⚠️ Important Information
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Freelancers will remain freelancers</li>
                <li>• Clients will remain clients</li>
                <li>• Admins will remain admins</li>
                <li>• Account owners will remain account owners</li>
                <li>• Valid managers (with invitations) will remain managers</li>
                <li>• Any incorrectly assigned roles will be corrected</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleRestoreRoles} 
              disabled={restoringRoles}
              variant="default"
              size="lg"
              className="w-full sm:w-auto"
            >
              {restoringRoles ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Restoring Roles...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restore Original Roles
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Categories Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            User Categories System
          </CardTitle>
          <CardDescription>
            Categorize users into groups for better reporting and organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                📊 Category Types
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• <strong>Clients with Account</strong> - Clients belonging to a company account</li>
                <li>• <strong>Clients without Account</strong> - Individual clients not linked to any account</li>
                <li>• <strong>Admin</strong> - Platform administrators</li>
                <li>• <strong>Freelancers</strong> - Registered writers</li>
                <li>• <strong>Managers</strong> - Team managers with assigned users</li>
              </ul>
            </div>

            {categoriesSummary && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-background border rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary">{categoriesSummary.admin}</div>
                  <div className="text-xs text-muted-foreground">Admins</div>
                </div>
                <div className="bg-background border rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{categoriesSummary.manager}</div>
                  <div className="text-xs text-muted-foreground">Managers</div>
                </div>
                <div className="bg-background border rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{categoriesSummary.freelancer}</div>
                  <div className="text-xs text-muted-foreground">Freelancers</div>
                </div>
                <div className="bg-background border rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{categoriesSummary.client_with_account}</div>
                  <div className="text-xs text-muted-foreground">Clients (Account)</div>
                </div>
                <div className="bg-background border rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{categoriesSummary.client_without_account}</div>
                  <div className="text-xs text-muted-foreground">Clients (No Account)</div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSeedCategories} 
                disabled={seedingCategories}
                variant="default"
                size="lg"
                className="flex-1"
              >
                {seedingCategories ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Categorizing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed Categories
                  </>
                )}
              </Button>
              <Button 
                onClick={fetchCategoriesSummary} 
                disabled={loadingSummary}
                variant="outline"
                size="lg"
              >
                {loadingSummary ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}