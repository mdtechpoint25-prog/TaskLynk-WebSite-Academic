'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemSettings {
  [key: string]: string | number | boolean;
}

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [changes, setChanges] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const hasCheckedAuth = useRef(false);

  // Auth check - runs once
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchSettings();
    }
  }, [loading, user, router]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSettings(data || {});
    } catch (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const handleChange = useCallback((key: string, value: string | number | boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value,
    }));
    setChanges((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        setChanges({});
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }, [changes]);

  const hasChanges = Object.keys(changes).length > 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (loadingSettings) {
    return (
      <div className="w-full p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 md:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure platform settings, pricing, and features
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="general" className="rounded-xl">General</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl">Pricing</TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl">Features</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-xl">Payment</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">General Settings</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name || 'TaskLynk'}
                    onChange={(e) => handleChange('platform_name', e.target.value)}
                    placeholder="TaskLynk"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="platform_email">Support Email</Label>
                  <Input
                    id="platform_email"
                    type="email"
                    value={settings.platform_email || ''}
                    onChange={(e) => handleChange('platform_email', e.target.value)}
                    placeholder="support@tasklynk.com"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="platform_description">Platform Description</Label>
                <Textarea
                  id="platform_description"
                  value={settings.platform_description || ''}
                  onChange={(e) => handleChange('platform_description', e.target.value)}
                  placeholder="Brief description of the platform"
                  rows={4}
                  className="rounded-xl"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="min_order_amount">Minimum Order Amount (KES)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    value={settings.min_order_amount || 1000}
                    onChange={(e) =>
                      handleChange('min_order_amount', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="max_order_amount">Maximum Order Amount (KES)</Label>
                  <Input
                    id="max_order_amount"
                    type="number"
                    value={settings.max_order_amount || 1000000}
                    onChange={(e) =>
                      handleChange('max_order_amount', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="order_timeout_days">Order Timeout (days)</Label>
                  <Input
                    id="order_timeout_days"
                    type="number"
                    value={settings.order_timeout_days || 30}
                    onChange={(e) =>
                      handleChange('order_timeout_days', parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing" className="space-y-6">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Pricing & Fees</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platform_fee_percent">Platform Fee (%)</Label>
                  <Input
                    id="platform_fee_percent"
                    type="number"
                    step="0.1"
                    value={settings.platform_fee_percent || 10}
                    onChange={(e) =>
                      handleChange('platform_fee_percent', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentage charged on each completed order
                  </p>
                </div>
                <div>
                  <Label htmlFor="transaction_fee_percent">Transaction Fee (%)</Label>
                  <Input
                    id="transaction_fee_percent"
                    type="number"
                    step="0.1"
                    value={settings.transaction_fee_percent || 2}
                    onChange={(e) =>
                      handleChange('transaction_fee_percent', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Fee charged for payment processing
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="minimum_payout">Minimum Payout (KES)</Label>
                  <Input
                    id="minimum_payout"
                    type="number"
                    value={settings.minimum_payout || 500}
                    onChange={(e) =>
                      handleChange('minimum_payout', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum balance before freelancer can request payout
                  </p>
                </div>
                <div>
                  <Label htmlFor="maximum_payout">Maximum Payout (KES)</Label>
                  <Input
                    id="maximum_payout"
                    type="number"
                    value={settings.maximum_payout || 500000}
                    onChange={(e) =>
                      handleChange('maximum_payout', parseFloat(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-6">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Feature Toggles</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable User Registration</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow new users to create accounts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.registration_enabled as boolean}
                  onChange={(e) =>
                    handleChange('registration_enabled', e.target.checked)
                  }
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Revisions</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow clients to request order revisions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.revisions_enabled as boolean}
                  onChange={(e) => handleChange('revisions_enabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Messaging</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow users to communicate through the platform
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.messaging_enabled as boolean}
                  onChange={(e) => handleChange('messaging_enabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Ratings</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow clients to rate completed orders
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ratings_enabled as boolean}
                  onChange={(e) => handleChange('ratings_enabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Require users to verify email before account activation
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_email_verification as boolean}
                  onChange={(e) =>
                    handleChange('require_email_verification', e.target.checked)
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Payment Settings</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="default_payment_method">Default Payment Method</Label>
                <Select
                  value={settings.default_payment_method as string}
                  onValueChange={(value) =>
                    handleChange('default_payment_method', value)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="wallet">Platform Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="mpesa_enabled">Enable M-Pesa</Label>
                  <input
                    id="mpesa_enabled"
                    type="checkbox"
                    checked={settings.mpesa_enabled as boolean}
                    onChange={(e) => handleChange('mpesa_enabled', e.target.checked)}
                    className="w-5 h-5 mt-2 rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="paystack_enabled">Enable Paystack</Label>
                  <input
                    id="paystack_enabled"
                    type="checkbox"
                    checked={settings.paystack_enabled as boolean}
                    onChange={(e) =>
                      handleChange('paystack_enabled', e.target.checked)
                    }
                    className="w-5 h-5 mt-2 rounded"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="payout_processing_days">Payout Processing Time (days)</Label>
                  <Input
                    id="payout_processing_days"
                    type="number"
                    value={settings.payout_processing_days || 1}
                    onChange={(e) =>
                      handleChange('payout_processing_days', parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_hold_period">Payment Hold Period (days)</Label>
                  <Input
                    id="payment_hold_period"
                    type="number"
                    value={settings.payment_hold_period || 7}
                    onChange={(e) =>
                      handleChange('payment_hold_period', parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => {
            setChanges({});
            fetchSettings();
          }}
          disabled={!hasChanges || saving}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}