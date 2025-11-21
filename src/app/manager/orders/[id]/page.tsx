"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Download, 
  AlertCircle,
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Wallet, 
  FileUp, 
  Loader2, 
  UserX, 
  Mail, 
  PauseCircle,
  Paperclip,
  X,
  Ban,
  Eye,
  FileCheck
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { CountdownTimer } from '@/components/countdown-timer';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { calculateWriterEarnings } from '@/lib/payment-calculations';

type Job = {
  id: number;
  displayId?: string;
  orderNumber: string;
  clientId: number;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  adminApproved: boolean;
  clientApproved: boolean;
  revisionRequested: boolean;
  revisionNotes: string | null;
  paymentConfirmed: boolean;
  createdAt: string;
  client?: { id: number; displayId?: string; name: string };
  writer?: { id: number; displayId?: string; name: string };
};

type Freelancer = {
  id: number;
  name: string;
  email: string;
  rating: number | null;
  balance: number;
};

type Attachment = {
  id: number;
  jobId: number;
  uploadedBy: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadType: string;
  uploaderRole?: string;
  createdAt: string;
};

type Client = {
  id: number;
  name: string;
  email: string;
};

type Payment = {
  id: number;
  jobId: number;
  clientId: number;
  freelancerId: number;
  amount: number;
  mpesaCode: string | null;
  status: string;
  confirmedByAdmin: boolean;
  confirmedAt: string | null;
  createdAt: string;
};

type JobMessage = {
  id: number;
  jobId: number;
  senderId: number;
  message: string;
  adminApproved: boolean;
  createdAt: string;
};

export default function ManagerOrderDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [directMessageDialogOpen, setDirectMessageDialogOpen] = useState(false);
  const [directMessageRecipient, setDirectMessageRecipient] = useState<'client' | 'freelancer'>('client');
  const [directMessageContent, setDirectMessageContent] = useState('');
  const [sendingDirectMessage, setSendingDirectMessage] = useState(false);
  const [managerSelectedFiles, setManagerSelectedFiles] = useState<File[]>([]);
  const [managerUploading, setManagerUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const managerFileInputRef = useRef<HTMLInputElement>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [pendingMessagesForApproval, setPendingMessagesForApproval] = useState<JobMessage[]>([]);
  const [pendingUploadsForApproval, setPendingUploadsForApproval] = useState<Attachment[]>([]);

  // Download function with comprehensive error handling
  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await fetch(attachment.fileUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  // Bulk download function for multiple files
  const handleDownloadAll = async (attachmentsList: Attachment[]) => {
    if (attachmentsList.length === 0) {
      toast.error('No files to download');
      return;
    }

    toast.info(`Downloading ${attachmentsList.length} file(s)...`);
    
    for (const att of attachmentsList) {
      await handleDownloadAttachment(att);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoadingData(true);
      const timestamp = Date.now();
      const token = localStorage.getItem('bearer_token');
      
      const headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Authorization': `Bearer ${token}`
      };

      // Fetch from manager orders API with embedded client/writer info
      const jobResponse = await fetch(`/api/manager/orders?managerId=${user?.id}&_=${timestamp}`, {
        cache: 'no-store',
        headers
      });

      if (jobResponse.ok) {
        const jobsData = await jobResponse.json();
        const foundJob = jobsData.find((j: Job) => j.id === parseInt(jobId));
        
        if (foundJob) {
          setJob(foundJob);
          
          if (foundJob.client) {
            setClient(foundJob.client);
          }
        } else {
          toast.error('Order not found or not accessible');
          router.push('/manager/orders/all');
          return;
        }
      } else {
        const errorData = await jobResponse.json();
        toast.error(errorData.error || 'Failed to fetch order details');
        router.push('/manager/orders/all');
        return;
      }

      // Fetch messages
      const messagesResponse = await fetch(`/api/jobs/${jobId}/messages?userRole=manager&_=${timestamp}`, {
        cache: 'no-store',
        headers
      });
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
        
        // Filter pending messages for approval
        const pending = messagesData.filter((m: JobMessage) => !m.adminApproved);
        setPendingMessagesForApproval(pending);
      }

      // Fetch attachments
      const attachmentsResponse = await fetch(`/api/jobs/${jobId}/attachments?_=${timestamp}`, {
        cache: 'no-store',
        headers
      });
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json();
        setAttachments(attachmentsData);
        
        // For now, show all uploads (can add approval logic later if needed)
        setPendingUploadsForApproval([]);
      }

      // Fetch payment
      const paymentsResponse = await fetch(`/api/payments?jobId=${jobId}&_=${timestamp}`, {
        cache: 'no-store',
        headers
      });
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.length > 0) {
          setPayment(paymentsData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Error loading order details');
    } finally {
      setLoadingData(false);
    }
  }, [jobId, router, user?.id]);

  const fetchFreelancers = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(`/api/manager/writers?managerId=${user?.id}&_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFreelancers(data);
      }
    } catch (error) {
      console.error('Failed to fetch freelancers:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading && user && user.role === 'manager') {
      fetchJobDetails();
      fetchFreelancers();
    } else if (!loading && (!user || user.role !== 'manager')) {
      router.push('/');
    }
  }, [user, loading, router, fetchJobDetails, fetchFreelancers]);

  const handleManagerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = managerSelectedFiles.length + files.length;
    
    if (totalFiles > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    
    setManagerSelectedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleManagerRemoveFile = (index: number) => {
    setManagerSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleManagerDirectUpload = async () => {
    if (managerSelectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setManagerUploading(true);

    try {
      for (const file of managerSelectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadData = await uploadResponse.json();

        const attachmentResponse = await fetch(`/api/jobs/${jobId}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: parseInt(jobId),
            uploadedBy: user?.id,
            fileName: file.name,
            fileUrl: uploadData.url,
            fileSize: file.size,
            fileType: file.type,
            uploaderRole: user?.role,
            uploadType: 'final',
          }),
        });

        if (!attachmentResponse.ok) {
          throw new Error(`Failed to save ${file.name} metadata`);
        }
      }

      setManagerSelectedFiles([]);
      if (managerFileInputRef.current) {
        managerFileInputRef.current.value = '';
      }

      toast.success('Files uploaded successfully!');
      await fetchJobDetails();
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setManagerUploading(false);
    }
  };

  const handleAssign = async () => {
    if (!job || !selectedFreelancer) return;
    setProcessing(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/assign`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ freelancerId: parseInt(selectedFreelancer) }),
      });

      if (response.ok) {
        setAssignDialogOpen(false);
        setSelectedFreelancer('');
        toast.success('Freelancer assigned successfully!');
        await fetchJobDetails();
      } else {
        toast.error('Failed to assign freelancer');
      }
    } catch (error) {
      console.error('Failed to assign job:', error);
      toast.error('Failed to assign freelancer');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnassign = async () => {
    if (!job) return;
    setProcessing(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/assign`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ freelancerId: null }),
      });

      if (response.ok) {
        toast.success('Freelancer unassigned successfully!');
        await fetchJobDetails();
      } else {
        toast.error('Failed to unassign freelancer');
      }
    } catch (error) {
      console.error('Failed to unassign job:', error);
      toast.error('Failed to unassign freelancer');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliverToClient = async () => {
    if (!job) return;
    setProcessing(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (response.ok) {
        toast.success('Work delivered to client!');
        await fetchJobDetails();
      } else {
        toast.error('Failed to deliver work');
      }
    } catch (error) {
      console.error('Failed to deliver work:', error);
      toast.error('Failed to deliver work');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!payment || !job) return;
    setProcessing(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/payments/${payment.id}/confirm`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmed: true }),
      });

      if (response.ok) {
        toast.success('Payment approved!');
        await fetchJobDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!job) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'accepted', changedBy: user?.id }),
      });
      if (response.ok) {
        toast.success('Order accepted');
        await fetchJobDetails();
      } else {
        toast.error('Failed to accept order');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to accept order');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!job) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled', changedBy: user?.id }),
      });
      if (response.ok) {
        toast.success('Order rejected');
        await fetchJobDetails();
      } else {
        toast.error('Failed to reject order');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject order');
    } finally {
      setProcessing(false);
    }
  };

  const handlePutOnHold = async () => {
    if (!job) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'on_hold' }),
      });
      if (response.ok) {
        toast.success('Order put on hold');
        await fetchJobDetails();
      } else {
        toast.error('Failed to put order on hold');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to put order on hold');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeOrder = async () => {
    if (!job) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      let resumeStatus = 'approved';
      if (job.assignedFreelancerId) resumeStatus = 'assigned';
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: resumeStatus }),
      });
      if (response.ok) {
        toast.success('Order resumed');
        await fetchJobDetails();
      } else {
        toast.error('Failed to resume order');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to resume order');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!job || !revisionFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', revisionFile);
      formData.append('jobId', job.id.toString());
      formData.append('folder', 'tasklynk/uploads');
      
      const cloudinaryResponse = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        toast.error(errorData.error || 'Failed to upload file');
        setProcessing(false);
        return;
      }

      const cloudinaryData = await cloudinaryResponse.json();

      const response = await fetch(`/api/jobs/${job.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: revisionFile.name,
          fileUrl: cloudinaryData.url,
          fileSize: revisionFile.size,
          fileType: revisionFile.type,
          uploadType: 'revision',
          uploadedBy: user?.id || 0,
          uploaderRole: 'manager',
        }),
      });

      if (response.ok) {
        setRevisionDialogOpen(false);
        setRevisionFile(null);
        setRevisionNotes('');
        toast.success('Revision submitted successfully!');
        await fetchJobDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save revision metadata');
      }
    } catch (error) {
      console.error('Failed to submit revision:', error);
      toast.error('Failed to submit revision');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    setProcessing(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled', changedBy: user?.id }),
      });

      if (response.ok) {
        toast.success('Order cancelled successfully');
        await fetchJobDetails();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast.error('Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        toast.success('Message sent!');
        await fetchJobDetails();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliverMessage = async (messageId: number) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages/${messageId}/deliver`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Message delivered successfully!');
        await fetchJobDetails();
      } else {
        toast.error('Failed to deliver message');
      }
    } catch (error) {
      console.error('Failed to deliver message:', error);
      toast.error('Failed to deliver message');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!directMessageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!job) return;

    const recipientId = directMessageRecipient === 'client' ? job.clientId : job.assignedFreelancerId;
    
    if (!recipientId) {
      toast.error(`No ${directMessageRecipient} assigned to this order`);
      return;
    }

    setSendingDirectMessage(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          message: directMessageContent,
          recipientId: recipientId,
          autoApprove: true,
        }),
      });

      if (response.ok) {
        toast.success(`Message sent to ${directMessageRecipient} successfully!`);
        setDirectMessageContent('');
        setDirectMessageDialogOpen(false);
        await fetchJobDetails();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send direct message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingDirectMessage(false);
    }
  };

  // ADD: Message approval handler
  const handleApproveMessage = async (messageId: number) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/v2/messages/${messageId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        toast.success('Message approved and delivered!');
        await fetchJobDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to approve message');
      }
    } catch (error) {
      console.error('Failed to approve message:', error);
      toast.error('Failed to approve message');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const assignedFreelancer = job.writer ? {
    id: job.writer.id,
    name: job.writer.name,
    email: '',
    rating: null,
    balance: 0
  } : freelancers.find(f => f.id === job.assignedFreelancerId);

  const freelancerAmount = calculateWriterEarnings(job.pages, job.slides, job.workType);
  const pendingMessages = messages.filter(m => !m.adminApproved);
  const deliveredMessages = messages.filter(m => m.adminApproved);

  const writerUploads = attachments.filter(att => att.uploaderRole === 'freelancer');
  const managerFinalUploads = attachments.filter(att => att.uploadType === 'final' && att.uploaderRole === 'manager');
  const clientUploads = attachments.filter(att => att.uploadType === 'initial' || att.uploaderRole === 'client' || att.uploaderRole === 'account_owner');

  return (
    <>
      <div className="w-full">
        <div className="mb-4">
          <Link 
            href="/manager/orders/all"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Posted on {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                  {job.displayId && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {job.displayId}
                    </Badge>
                  )}
                  {client && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                      Client: {client.name}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="capitalize px-3 py-1.5 bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-700"
              >
                {job.status === 'editing' ? 'Under Review' : 
                 job.status === 'revision_pending' ? 'Revision Pending' :
                 job.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {(job.actualDeadline || job.freelancerDeadline) && (
            <div className="mb-4 grid md:grid-cols-2 gap-3">
              {job.actualDeadline && (
                <Card className="border">
                  <CardContent className="pt-3 pb-3">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Client's Deadline</Label>
                        <p className="font-medium text-sm">{format(new Date(job.actualDeadline), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                      <CountdownTimer 
                        deadline={job.actualDeadline} 
                        colorScheme="purple" 
                        label="Client" 
                        status={job.status}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              {job.freelancerDeadline && (
                <Card className="border">
                  <CardContent className="pt-3 pb-3">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Freelancer's Deadline</Label>
                        <p className="font-medium text-sm">{format(new Date(job.freelancerDeadline), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                      <CountdownTimer 
                        deadline={job.freelancerDeadline} 
                        colorScheme="green" 
                        label="Writer" 
                        status={job.status}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {job.status === 'approved' && payment && !payment.confirmedByAdmin && payment.status === 'pending' && (
            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/10">
              <Wallet className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                <strong>Payment Pending:</strong> Client has submitted payment. Review and approve to complete the order.
              </AlertDescription>
            </Alert>
          )}

          {payment && job.status === 'approved' && (
            <Card className="mb-4 border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Payment Information
                </CardTitle>
                <CardDescription className="text-sm">
                  Review payment details before approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Payment Amount</Label>
                    <p className="font-semibold text-base text-green-600">KSh {payment.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">M-Pesa Code</Label>
                    <p className="font-medium text-sm font-mono">{payment.mpesaCode || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Writer Payout</Label>
                    <p className="font-semibold text-base text-blue-600">KSh {freelancerAmount.toFixed(2)}</p>
                  </div>
                </div>

                {!payment.confirmedByAdmin && payment.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleApprovePayment} disabled={processing} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Approve Payment
                    </Button>
                  </div>
                )}

                {payment.confirmedByAdmin && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm text-green-900 dark:text-green-100">Payment Confirmed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ADD: Pending Messages Alert */}
          {pendingMessagesForApproval.length > 0 && (
            <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                <strong>{pendingMessagesForApproval.length} message(s)</strong> pending your approval.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Work Type</Label>
                  <p className="font-medium text-sm capitalize">{job.workType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Client Amount</Label>
                  <p className="font-semibold text-base text-green-600">KSh {job.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Writer Payout</Label>
                  <p className="font-semibold text-base text-blue-600">KSh {freelancerAmount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pages</Label>
                  <p className="font-medium text-sm">{job.pages || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Slides</Label>
                  <p className="font-medium text-sm">{job.slides || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground font-semibold">Instructions</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{job.instructions}</p>
                </div>
              </div>

              {assignedFreelancer && (
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned Freelancer</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      {assignedFreelancer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{assignedFreelancer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignedFreelancer.rating ? `★ ${assignedFreelancer.rating.toFixed(1)} rating` : 'No rating yet'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ADD: Pending Messages Card */}
          {pendingMessagesForApproval.length > 0 && (
            <Card className="mb-4 border-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages Pending Approval ({pendingMessagesForApproval.length})
                </CardTitle>
                <CardDescription className="text-sm">
                  Review and approve messages before they're delivered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingMessagesForApproval.map((msg) => (
                  <div key={msg.id} className="p-3 bg-muted rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            From: {msg.senderId === job.clientId ? 'Client' : msg.senderId === job.assignedFreelancerId ? 'Writer' : 'Manager'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApproveMessage(msg.id)}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 shrink-0"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ADD: All Attachments Card with better organization */}
          {attachments.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Files & Attachments ({attachments.length})
                    </CardTitle>
                    <CardDescription className="text-sm">
                      All files uploaded for this order
                    </CardDescription>
                  </div>
                  {attachments.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAll(attachments)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Uploads */}
                {clientUploads.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">Client Instructions ({clientUploads.length})</h4>
                    <div className="space-y-2">
                      {clientUploads.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(att.fileSize)} • {format(new Date(att.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachment(att)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Writer Uploads */}
                {writerUploads.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-green-600">Writer Submissions ({writerUploads.length})</h4>
                    <div className="space-y-2">
                      {writerUploads.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(att.fileSize)} • {format(new Date(att.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachment(att)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manager Uploads */}
                {managerFinalUploads.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-purple-600">Manager Uploads ({managerFinalUploads.length})</h4>
                    <div className="space-y-2">
                      {managerFinalUploads.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/10 rounded border border-purple-200 dark:border-purple-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(att.fileSize)} • {format(new Date(att.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachment(att)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ADD: Manager File Upload Card */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Upload Files
              </CardTitle>
              <CardDescription className="text-sm">
                Upload files for this order (Max 10 files, 40MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Input
                  type="file"
                  ref={managerFileInputRef}
                  onChange={handleManagerFileSelect}
                  multiple
                  accept="*/*"
                  className="mb-2"
                />
                {managerSelectedFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-sm font-medium">Selected Files ({managerSelectedFiles.length}/10)</Label>
                    {managerSelectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleManagerRemoveFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={handleManagerDirectUpload}
                      disabled={managerUploading || managerSelectedFiles.length === 0}
                      className="w-full"
                    >
                      {managerUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileUp className="w-4 h-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ADD: Messages Card - Show approved messages */}
          {deliveredMessages.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages ({deliveredMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deliveredMessages.map((msg) => (
                    <div key={msg.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          From: {msg.senderId === job.clientId ? 'Client' : msg.senderId === job.assignedFreelancerId ? 'Writer' : 'Manager'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manager Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {job.status !== 'approved' ? (
                <div className="flex flex-wrap gap-2">
                  {job.status === 'pending' && (
                    <>
                      <Button onClick={handleAccept} disabled={processing} size="sm">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Accept
                      </Button>
                      <Button variant="destructive" onClick={handleReject} disabled={processing} size="sm">
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject
                      </Button>
                    </>
                  )}

                  {(job.status === 'accepted' || (job.status === 'assigned' && !job.assignedFreelancerId)) && (
                    <Button onClick={() => setAssignDialogOpen(true)} disabled={processing} size="sm">
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      {job.assignedFreelancerId ? 'Reassign Freelancer' : 'Assign Freelancer'}
                    </Button>
                  )}

                  {job.assignedFreelancerId && job.status !== 'completed' && job.status !== 'cancelled' && (
                    <Button 
                      variant="outline" 
                      onClick={handleUnassign} 
                      disabled={processing} 
                      size="sm"
                      className="border-orange-500 text-orange-700 hover:bg-orange-50"
                    >
                      <UserX className="w-4 h-4 mr-1.5" />
                      Unassign Freelancer
                    </Button>
                  )}

                  {job.status === 'editing' && (
                    <Button onClick={handleDeliverToClient} disabled={processing} size="sm">
                      <Send className="w-4 h-4 mr-1.5" />
                      Deliver to Client
                    </Button>
                  )}

                  <Button 
                    variant="outline"
                    onClick={() => setRevisionDialogOpen(true)} 
                    disabled={processing}
                    size="sm"
                  >
                    <FileUp className="w-4 h-4 mr-1.5" />
                    Submit Revision
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setDirectMessageDialogOpen(true)}
                    disabled={processing}
                    size="sm"
                    className="border-blue-500 text-blue-700 hover:bg-blue-50"
                  >
                    <Mail className="w-4 h-4 mr-1.5" />
                    Send Message
                  </Button>

                  {job.status !== 'completed' && job.status !== 'cancelled' && (
                    job.status === 'on_hold' ? (
                      <Button 
                        size="sm" 
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={handleResumeOrder}
                        disabled={processing}
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        onClick={handlePutOnHold}
                        disabled={processing}
                      >
                        <PauseCircle className="w-4 h-4 mr-1.5" />
                        Put On Hold
                      </Button>
                    )
                  )}

                  {job.status !== 'completed' && job.status !== 'cancelled' && (
                    <Button variant="destructive" onClick={handleCancel} disabled={processing} size="sm">
                      <Ban className="w-4 h-4 mr-1.5" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Client approved. Awaiting payment confirmation.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs remain the same */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Freelancer</DialogTitle>
            <DialogDescription>
              Select a freelancer to assign to this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="freelancer">Select Freelancer</Label>
              <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a freelancer" />
                </SelectTrigger>
                <SelectContent>
                  {freelancers.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name} {f.rating ? `(★ ${f.rating.toFixed(1)})` : '(No rating)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedFreelancer || processing}>
              Assign Freelancer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={directMessageDialogOpen} onOpenChange={setDirectMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Direct Message
            </DialogTitle>
            <DialogDescription>
              Send a message directly to the {directMessageRecipient}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={directMessageRecipient === 'client' ? 'default' : 'secondary'}>
                  {directMessageRecipient === 'client' ? 'To: Client' : 'To: Freelancer'}
                </Badge>
                <span className="text-sm font-medium">
                  {directMessageRecipient === 'client' ? client?.name : assignedFreelancer?.name}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="directMessage">Message</Label>
              <Textarea
                id="directMessage"
                placeholder={`Type your message to the ${directMessageRecipient} here...`}
                value={directMessageContent}
                onChange={(e) => setDirectMessageContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDirectMessageDialogOpen(false);
                setDirectMessageContent('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendDirectMessage} 
              disabled={sendingDirectMessage || !directMessageContent.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingDirectMessage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD: Submit Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Revision</DialogTitle>
            <DialogDescription>
              Upload a revision file for this order that will be sent to the freelancer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This revision will be saved and sent to the freelancer.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="revisionFile">Upload File *</Label>
              <Input
                id="revisionFile"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 40 * 1024 * 1024) {
                      toast.error('File size must be less than 40MB');
                      e.target.value = '';
                      return;
                    }
                    setRevisionFile(file);
                  }
                }}
                accept="*/*"
                className="mt-2"
              />
              {revisionFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {revisionFile.name} ({(revisionFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="revisionNotes">Notes (Optional)</Label>
              <Textarea
                id="revisionNotes"
                placeholder="Add any notes about this revision for the freelancer..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRevision} disabled={processing || !revisionFile}>
              <FileUp className="w-4 h-4 mr-2" />
              Submit Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}