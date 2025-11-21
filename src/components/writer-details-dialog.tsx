"use client";

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  FileText,
  DollarSign,
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type WriterDetails = {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    status: string;
    approved: boolean;
    balance: number;
    rating: number | null;
    phone: string;
    totalEarned: number | null;
    completedJobs: number;
    completionRate: number | null;
    createdAt: string;
  };
  stats: {
    totalJobsPosted: number;
    totalJobsCompleted: number;
    totalJobsCancelled: number;
    totalAmountEarned: number;
    averageRating: number | null;
    totalRatings: number;
    onTimeDelivery: number;
    lateDelivery: number;
    revisionsRequested: number;
  } | null;
};

type WriterDetailsDialogProps = {
  writerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WriterDetailsDialog({ writerId, open, onOpenChange }: WriterDetailsDialogProps) {
  const [details, setDetails] = useState<WriterDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && writerId) {
      fetchWriterDetails();
    }
  }, [open, writerId]);

  const fetchWriterDetails = async () => {
    if (!writerId) return;

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch(`/api/users/${writerId}/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      } else {
        toast.error('Failed to load writer details');
      }
    } catch (error) {
      console.error('Failed to fetch writer details:', error);
      toast.error('Failed to load writer details');
    } finally {
      setLoading(false);
    }
  };

  if (!writerId) return null;

  const calculateSuccessRate = () => {
    if (!details?.stats) return 0;
    const total = details.stats.totalJobsCompleted + details.stats.totalJobsCancelled;
    if (total === 0) return 0;
    return Math.round((details.stats.totalJobsCompleted / total) * 100);
  };

  const calculateOnTimeRate = () => {
    if (!details?.stats) return 0;
    const total = details.stats.onTimeDelivery + details.stats.lateDelivery;
    if (total === 0) return 0;
    return Math.round((details.stats.onTimeDelivery / total) * 100);
  };

  const getLatenessStatus = () => {
    const onTimeRate = calculateOnTimeRate();
    if (onTimeRate >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
    if (onTimeRate >= 75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' };
    if (onTimeRate >= 60) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Writer Performance Summary
          </DialogTitle>
          <DialogDescription>
            Detailed performance metrics and statistics
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading writer details...</p>
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Writer Basic Info */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{details.user.name}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {details.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {details.user.phone}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Member since {format(new Date(details.user.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={details.user.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {details.user.status}
                    </Badge>
                    {details.user.rating && (
                      <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="font-bold text-amber-900 dark:text-amber-100">
                          {details.user.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {details.stats?.totalJobsCompleted || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed Orders</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {calculateSuccessRate()}%
                    </p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                    <p className="text-2xl font-bold text-amber-600">
                      KSh {(details.user.totalEarned || 0).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Star className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {details.stats?.averageRating?.toFixed(1) || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg Rating ({details.stats?.totalRatings || 0} reviews)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Performance Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Performance Metrics
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Delivery Performance */}
                <Card className={getLatenessStatus().bg}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Delivery Performance</p>
                        <p className={`text-3xl font-bold ${getLatenessStatus().color}`}>
                          {calculateOnTimeRate()}%
                        </p>
                      </div>
                      <Clock className={`w-8 h-8 ${getLatenessStatus().color}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">On-Time Deliveries:</span>
                        <span className="font-semibold text-green-600">
                          {details.stats?.onTimeDelivery || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Late Deliveries:</span>
                        <span className="font-semibold text-red-600">
                          {details.stats?.lateDelivery || 0}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <Badge variant="outline" className={getLatenessStatus().color}>
                          {getLatenessStatus().label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Statistics */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Order Statistics</p>
                        <p className="text-3xl font-bold text-primary">
                          {details.stats?.totalJobsCompleted || 0}
                        </p>
                      </div>
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Orders:</span>
                        <span className="font-semibold">
                          {(details.stats?.totalJobsCompleted || 0) + (details.stats?.totalJobsCancelled || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-semibold text-green-600">
                          {details.stats?.totalJobsCompleted || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cancelled:</span>
                        <span className="font-semibold text-red-600">
                          {details.stats?.totalJobsCancelled || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Metrics */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Quality Score</p>
                        <p className="text-3xl font-bold text-amber-600">
                          {details.stats?.averageRating?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                      <Star className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Ratings:</span>
                        <span className="font-semibold">
                          {details.stats?.totalRatings || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revisions Requested:</span>
                        <span className="font-semibold text-orange-600">
                          {details.stats?.revisionsRequested || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revision Rate:</span>
                        <span className="font-semibold">
                          {details.stats?.totalJobsCompleted > 0
                            ? Math.round(((details.stats?.revisionsRequested || 0) / details.stats.totalJobsCompleted) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Financial Summary</p>
                        <p className="text-2xl font-bold text-green-600">
                          KSh {(details.stats?.totalAmountEarned || 0).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Balance:</span>
                        <span className="font-semibold text-green-600">
                          KSh {details.user.balance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg per Order:</span>
                        <span className="font-semibold">
                          KSh {details.stats?.totalJobsCompleted > 0
                            ? ((details.stats?.totalAmountEarned || 0) / details.stats.totalJobsCompleted).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Additional Insights */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Additional Insights
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Completion Rate */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <Badge variant="secondary">
                      {details.user.completionRate ? `${details.user.completionRate}%` : 'N/A'}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${details.user.completionRate || 0}%` }}
                    />
                  </div>
                </div>

                {/* Success Rate */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge variant="secondary">
                      {calculateSuccessRate()}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${calculateSuccessRate()}%` }}
                    />
                  </div>
                </div>

                {/* On-Time Delivery Rate */}
                <div className="p-4 border rounded-lg md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">On-Time Delivery Rate</span>
                    <Badge variant="outline" className={getLatenessStatus().color}>
                      {calculateOnTimeRate()}% - {getLatenessStatus().label}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        calculateOnTimeRate() >= 90 ? 'bg-green-600' :
                        calculateOnTimeRate() >= 75 ? 'bg-blue-600' :
                        calculateOnTimeRate() >= 60 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${calculateOnTimeRate()}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            {details.stats && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">On-Time</p>
                      <p className="text-xl font-bold text-green-600">{details.stats.onTimeDelivery}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Late</p>
                      <p className="text-xl font-bold text-red-600">{details.stats.lateDelivery}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Revisions</p>
                      <p className="text-xl font-bold text-orange-600">{details.stats.revisionsRequested}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
                      <p className="text-xl font-bold text-gray-600">{details.stats.totalJobsCancelled}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Reviews</p>
                      <p className="text-xl font-bold text-purple-600">{details.stats.totalRatings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Earnings/Order</p>
                      <p className="text-xl font-bold text-green-600">
                        KSh {details.stats.totalJobsCompleted > 0
                          ? (details.stats.totalAmountEarned / details.stats.totalJobsCompleted).toFixed(0)
                          : '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Alerts */}
            {details.stats && (
              <div className="space-y-2">
                {calculateOnTimeRate() < 75 && (
                  <div className="flex items-start gap-2 p-3 border border-orange-500 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                        Low On-Time Delivery Rate
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        This writer has {details.stats.lateDelivery} late deliveries out of {details.stats.onTimeDelivery + details.stats.lateDelivery} total deliveries.
                      </p>
                    </div>
                  </div>
                )}

                {(details.stats.revisionsRequested / (details.stats.totalJobsCompleted || 1)) > 0.3 && (
                  <div className="flex items-start gap-2 p-3 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                        High Revision Rate
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        {Math.round((details.stats.revisionsRequested / (details.stats.totalJobsCompleted || 1)) * 100)}% of completed orders required revisions.
                      </p>
                    </div>
                  </div>
                )}

                {details.stats.totalJobsCompleted >= 10 && calculateOnTimeRate() >= 90 && (
                  <div className="flex items-start gap-2 p-3 border border-green-500 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <Award className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        Excellent Performance
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        This writer consistently delivers quality work on time with minimal revisions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Failed to load writer details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
