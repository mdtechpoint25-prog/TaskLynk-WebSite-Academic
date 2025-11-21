"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { FreelancerSidebar } from '@/components/freelancer-sidebar';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, ArrowLeft, Send, AlertCircle, Clock, TrendingDown, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { calculateWriterEarnings } from '@/lib/payment-calculations';
import { FileUploadSection } from '@/components/file-upload-section';
import { CountdownTimer } from '@/components/countdown-timer';

type Job = {
  id: number;
  displayId: string;
  clientId: number;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  freelancerDeadline?: string; // Made optional
  status: string;
  assignedFreelancerId: number | null;
  adminApproved: boolean;
  createdAt: string;
  isRealOrder?: boolean;
};

type Attachment = {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadType: string;
  uploadedBy?: number;
  createdAt: string;
};

type Message = {
  id: number;
  senderId: number;
  message: string;
  createdAt: string;
};

export default function FreelancerOrderDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else if (!user.approved) {
        router.push('/freelancer/dashboard');
      } else {
        fetchOrderDetails();
      }
    }
  }, [user, loading, router, jobId]);

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoadingData(true);
      const timestamp = Date.now();

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        // Check if job is approved and not assigned - allow freelancer to view
        if (jobData && jobData.adminApproved) {
          setJob(jobData);
          if (!jobData.assignedFreelancerId) {
            // Do not prefill bid to any maximum; show empty by default
            setBidAmount('');
          }
        } else {
          toast.error('This order is not available');
          router.push('/freelancer/orders');
          return;
        }
      } else {
        toast.error('Order not found');
        router.push('/freelancer/orders');
        return;
      }

      // Fetch attachments
      const attachmentResponse = await fetch(`/api/jobs/${jobId}/attachments?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (attachmentResponse.ok) {
        const data = await attachmentResponse.json();
        setAttachments(data);
      }

      // Fetch messages
      fetchMessages();
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast.error('Failed to load order details');
      router.push('/freelancer/orders');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/jobs/${jobId}/messages?userRole=freelancer&_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          message: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        toast.success('Message sent! Waiting for admin approval before delivery.');
        fetchMessages();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setProcessing(false);
    }
  };

  const handlePlaceBidClick = () => {
    if (!job || !bidAmount) {
      toast.error('Please enter a bid amount');
      return;
    }
    
    const bidAmountNum = parseFloat(bidAmount);

    // Validate bid amount
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    // Show confirmation
    setShowBidConfirm(true);
  };

  const handlePlaceBid = async () => {
    if (!job) return;
    
    setShowBidConfirm(false);
    setProcessing(true);

    try {
      const bidAmountNum = parseFloat(bidAmount);
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          jobId: job.id,
          freelancerId: user?.id,
          bidAmount: bidAmountNum,
          message: '', // Message is optional now
        }),
      });

      if (response.ok) {
        setBidDialogOpen(false);
        toast.success('Bid placed successfully! The admin will review and assign the job.');
        router.push('/freelancer/orders');
      } else if (response.status === 409) {
        // Duplicate bid
        toast.info("You've already placed a bid for this job");
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Failed to place bid:', error);
      toast.error('Failed to place bid. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadFile = (attachment: Attachment) => {
    toast.info(`Downloading ${attachment.fileName}...`);
    window.open(attachment.fileUrl, '_blank');
  };

  // Calculate remaining time from freelancer deadline or regular deadline
  const getCountdownTime = () => {
    if (!job) return { text: '-', expired: false };
    const deadlineToUse = job.freelancerDeadline || job.deadline;
    const due = new Date(deadlineToUse);
    const diffMs = due.getTime() - currentTime.getTime();
    if (diffMs <= 0) {
      return { text: 'Expired', expired: true };
    }
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    if (diffDays > 0) {
      return { text: `${diffDays}d ${diffHours}h ${diffMins}m ${diffSecs}s`, expired: false };
    }
    if (diffHours > 0) {
      return { text: `${diffHours}h ${diffMins}m ${diffSecs}s`, expired: false };
    }
    return { text: `${diffMins}m ${diffSecs}s`, expired: false };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const countdown = getCountdownTime();
  const freelancerEarnings = job ? calculateWriterEarnings(job.pages, job.slides, job.workType) : 0;
  const deadlineToDisplay = job?.freelancerDeadline || job?.deadline;

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <FreelancerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 pt-[72px] ml-0 md:ml-64 bg-background transition-all duration-300 overflow-y-auto">
        <div className="p-3 md:p-4 lg:p-5 w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/freelancer/orders">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Available Orders
              </Button>
            </Link>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{job?.title}</h1>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span>Posted on {job ? format(new Date(job.createdAt), 'MMM dd, yyyy') : '-'}</span>
                  {job?.displayId && (
                    <Badge variant="outline" className="font-mono">
                      {job.displayId}
                    </Badge>
                  )}
                  {/* Visible countdown badge for freelancer deadline */}
                  <span className="inline-flex">
                    <CountdownTimer
                      deadline={deadlineToDisplay as string}
                      label="Deadline"
                      colorScheme="purple"
                      className="!px-2 !py-0.5"
                    />
                  </span>
                </div>
              </div>
              <Badge variant="default" className="capitalize text-sm sm:text-base px-3 py-1.5">
                Available
              </Badge>
            </div>
          </div>

          {/* Competitive Bidding Alert */}
          <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <TrendingDown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Estimated Earnings (CPP):</strong> KSh {freelancerEarnings.toFixed(2)}. Pages and slides based payout. Most competitive bids win!
            </AlertDescription>
          </Alert>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>
                    Complete job information and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Work Type</Label>
                      <p className="font-medium capitalize">{job?.workType}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estimated Earnings (CPP)</Label>
                      <p className="font-semibold text-lg text-green-600">
                        KSh {freelancerEarnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Based on pages/slides</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Pages / Slides</Label>
                      <p className="font-medium">
                        {job?.pages ? `${job.pages} pages` : ''} 
                        {job?.pages && job?.slides ? ' + ' : ''}
                        {job?.slides ? `${job.slides} slides` : ''}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-base font-semibold">Instructions</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{job?.instructions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload/Download Section */}
              <FileUploadSection
                jobId={parseInt(jobId)}
                currentUserId={user?.id || 0}
                currentUserRole="freelancer"
                files={attachments.map(att => ({
                  id: att.id,
                  fileName: att.fileName,
                  fileUrl: att.fileUrl,
                  fileSize: att.fileSize,
                  fileType: 'application/octet-stream',
                  uploadType: att.uploadType,
                  uploadedBy: att.uploadedBy || 0,
                  createdAt: att.createdAt,
                }))}
                canUpload={false}
                canDownload={true}
                uploadType="initial"
                onFileUploaded={fetchOrderDetails}
                currentJobType={job.workType}
              />

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Work on This Order?</CardTitle>
                  <CardDescription>
                    Place your competitive bid to get assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button size="lg" onClick={() => setBidDialogOpen(true)} disabled={countdown.expired}>
                      <Send className="w-4 h-4 mr-2" />
                      {countdown.expired ? 'Order Expired' : 'Place Bid'}
                    </Button>
                    <Link href="/freelancer/orders">
                      <Button variant="outline" size="lg">
                        Browse Other Orders
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Messages */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Messages
                  </CardTitle>
                  <CardDescription>Ask questions about this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2 bg-muted/30">
                      {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
                      ) : (
                        messages.map((msg) => {
                          const isSent = msg.senderId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}
                            >
                              <div className={`max-w-[70%] ${isSent ? 'text-right' : 'text-left'}`}>
                                {!isSent && (
                                  <p className="text-xs font-semibold mb-1 text-muted-foreground">
                                    Admin
                                  </p>
                                )}
                                <div className={`inline-block px-4 py-2 rounded-2xl ${
                                  isSent 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-green-600 text-white'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button size="icon" onClick={handleSendMessage} disabled={processing || !newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Place Your Competitive Bid</DialogTitle>
            <DialogDescription>
              Enter your bid amount to compete for this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Order:</strong> {job?.title}
                <br />
                <strong>Estimated Earnings (CPP):</strong> KSh {freelancerEarnings.toFixed(2)}
                <br />
                <strong>Deadline:</strong> {deadlineToDisplay ? format(new Date(deadlineToDisplay), 'MMM dd, yyyy HH:mm') : '-'}
                <br />
                <strong>Tip:</strong> Lower bids are more competitive and have higher chances of winning!
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="bidAmount">Your Bid Amount (KSh) *</Label>
              <Input
                id="bidAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder={`Estimate: ${freelancerEarnings.toFixed(2)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your bid should reflect your effort and experience.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePlaceBidClick} 
              disabled={processing || !bidAmount || parseFloat(bidAmount) <= 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bid Confirmation Dialog */}
      <ConfirmationDialog
        open={showBidConfirm}
        onOpenChange={setShowBidConfirm}
        title="Place This Bid?"
        description={`Are you sure you want to place a bid of KSh ${parseFloat(bidAmount || '0').toFixed(2)} for this order? Once submitted, you'll be competing with other freelancers for assignment.`}
        confirmText="Yes, Place Bid"
        cancelText="Cancel"
        onConfirm={handlePlaceBid}
      />
    </div>
  );
}