"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function FreelancerSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
        }));
      }
    }
  }, [user, loading, router]);

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="shadow-lg border-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Display ID</Label>
              <Input
                value={user.displayId || 'Not assigned'}
                disabled
                className="bg-muted rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={user.role}
                disabled
                className="bg-muted capitalize rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Current Balance</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <Input
                  value={`KSh ${(Number(user.balance) || 0).toFixed(2)}`}
                  disabled
                  className="bg-muted font-semibold text-green-600 rounded-xl"
                />
              </div>
            </div>

            {user.rating !== null && (
              <div className="space-y-2">
                <Label>Rating</Label>
                <Input
                  value={`${Number(user.rating).toFixed(1)} / 5.0`}
                  disabled
                  className="bg-muted rounded-xl"
                />
              </div>
            )}

            <Button
              onClick={handleProfileUpdate}
              disabled={saving}
              className="w-full sm:w-auto rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="shadow-lg border-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="rounded-xl"
              />
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={saving || !formData.currentPassword || !formData.newPassword}
              className="w-full sm:w-auto rounded-xl"
            >
              <Lock className="w-4 h-4 mr-2" />
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}