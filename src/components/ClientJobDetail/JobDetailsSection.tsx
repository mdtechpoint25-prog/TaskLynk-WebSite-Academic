import React, { memo } from 'react';
import { Download, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

export interface JobDetailsProps {
  job: any;
  canEdit: boolean;
  displayStatus: string;
  onEdit: () => void;
  onPaymentInitiate: () => void;
  onApprove: () => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  paymentProcessing: boolean;
}

// Helper functions
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('csv')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
  return '📎';
};

const shortenFileName = (name: string, maxLength: number = 50) => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return shortened + '.' + ext;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const JobDetailsSection = memo(({
  job,
  canEdit,
  displayStatus,
  onEdit,
  onPaymentInitiate,
  onApprove,
  phoneNumber,
  onPhoneChange,
  paymentProcessing,
}: JobDetailsProps) => {
  if (!job) return null;

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl mb-1 truncate">{job.title}</CardTitle>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span>Order ID: <Badge variant="outline" className="font-mono">{job.displayId}</Badge></span>
              <span>•</span>
              <span>Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={displayStatus === 'completed' ? 'default' : 'secondary'}
              className="text-sm sm:text-base px-3 py-1.5 capitalize"
            >
              {displayStatus}
            </Badge>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label className="text-xs text-muted-foreground">Work Type</Label>
            <p className="font-semibold text-sm sm:text-base">{job.workType}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Pages/Slides</Label>
            <p className="font-semibold text-sm sm:text-base">
              {job.pages ? `${job.pages} pages` : ''}{job.pages && job.slides ? ' + ' : ''}{job.slides ? `${job.slides} slides` : ''}
            </p>
          </div>
          <div className="flex flex-col">
            <Label className="text-xs text-muted-foreground">Deadline</Label>
            <p className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <Clock className="w-4 h-4" />
              {format(new Date(job.actualDeadline), 'MMM dd, HH:mm')}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <p className="font-bold text-lg text-green-600">KSh {job.amount.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <Label className="text-xs text-muted-foreground">Instructions</Label>
          <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">
            {job.instructions}
          </div>
        </div>

        {displayStatus === 'delivered' && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {!job.paymentConfirmed && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="phoneNumber" className="text-sm">M-Pesa Phone Number</Label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="e.g., 0712345678"
                    value={phoneNumber}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    disabled={paymentProcessing}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <Button
                  onClick={onPaymentInitiate}
                  disabled={paymentProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {paymentProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <>💵 Pay KSh {Math.round(job.amount)}</>
                  )}
                </Button>
              </div>
            )}
            
            {job.paymentConfirmed && !job.clientApproved && (
              <Button onClick={onApprove} className="w-full">
                ✅ Approve Work
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

JobDetailsSection.displayName = 'JobDetailsSection';
