"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle, XCircle, Send, Clock, ArrowLeft, 
  Paperclip, X, Download, FileText, Image as ImageIcon, 
  FileArchive, Video, Music, File, Phone, Loader2, DollarSign, Upload, Edit, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { CountdownTimer } from '@/components/countdown-timer';

type Job = {
  id: number;
  displayId: string;
  clientId: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  actualDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  assignedFreelancerName?: string;
  assignedFreelancerEmail?: string;
  assignedFreelancerRating?: number | null;
  adminApproved: boolean;
  clientApproved: boolean;
  paymentConfirmed: boolean;
  createdAt: string;
};

type Message = {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  isApproved: boolean;
  isDelivered: boolean;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: number | null;
};

type Attachment = {
  id: number;
  jobId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploaderName: string;
  uploaderRole: string;
  uploadType: string;
  createdAt: string;
};

// Service Catalog for edit validation
const SERVICE_CATALOG: Record<string, { rate: number; type: string; name: string }> = {
  'essay': { name: 'Essay', rate: 240, type: 'page' },
  'assignment': { name: 'Assignment', rate: 240, type: 'page' },
  'research-proposal': { name: 'Research Proposal', rate: 240, type: 'page' },
  'presentation': { name: 'Presentation', rate: 150, type: 'slide' },
  'data-analysis': { name: 'Data Analysis', rate: 270, type: 'dataset' },
  'other': { name: 'Other', rate: 240, type: 'page' },
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
  if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return <FileText className="w-4 h-4" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return <FileArchive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const shortenFileName = (name: string, maxLength: number = 25): string => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return shortened + '.' + ext;
};

export default function ClientJobDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Payment states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // New state for client direct upload
  const [clientSelectedFiles, setClientSelectedFiles] = useState<File[]>([]);
  const [clientUploading, setClientUploading] = useState(false);

  // New state for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    instructions: '',
    workType: '',
    pages: '',
    slides: '',
    amount: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchJob();
      fetchMessages();
      fetchAttachments();
    }
  }, [user, jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      fetchAttachments();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const foundJob = await response.json();
        if (foundJob && foundJob.clientId === user?.id) {
          setJob(foundJob);
        } else {
          toast.error('Job not found or access denied');
          router.push('/client/dashboard');
        }
      } else {
        toast.error('Failed to load job details');
        router.push('/client/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Error loading job details');
      router.push('/client/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages?userRole=client`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      // Role-aware writer files (hidden until delivered) + client's own legacy uploads (always visible to client)
      const [v2Res, legacyRes] = await Promise.all([
        fetch(`/api/v2/orders/${jobId}/files?role=client&userId=${user?.id}&includeDrafts=false`),
        fetch(`/api/jobs/${jobId}/attachments`),
      ]);

      let writerAndSystemFiles: Attachment[] = [];
      if (v2Res.ok) {
        const data = await v2Res.json();
        writerAndSystemFiles = (data.files || []).map((f: any) => ({
          id: f.id,
          jobId: Number(jobId),
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.fileType || 'application/octet-stream',
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName || '',
          uploaderRole: f.uploaderRole || '',
          uploadType: f.uploadType || 'additional',
          createdAt: f.uploadedAt,
        })) as Attachment[];
      } else if (v2Res.status !== 403) {
        // Only log unexpected errors; 403 is expected before delivery
        console.warn('v2 files fetch failed with status', v2Res.status);
      }

      let clientOwnFiles: Attachment[] = [];
      if (legacyRes.ok) {
        const legacy = await legacyRes.json();
        const mapped = (legacy || []).map((f: any) => ({
          id: f.id,
          jobId: Number(jobId),
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.fileType || 'application/octet-stream',
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName || '',
          uploaderRole: f.uploaderRole || '',
          uploadType: f.uploadType || 'initial',
          createdAt: f.createdAt,
        })) as Attachment[];
        // Only keep files the client (or account owner) uploaded to avoid exposing writer files pre-delivery
        clientOwnFiles = mapped.filter(a => a.uploaderRole === 'client' || a.uploaderRole === 'account_owner');
      }

      setAttachments([...
        clientOwnFiles,
        ...writerAndSystemFiles,
      ]);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = selectedFiles.length + files.length;
    
    if (totalFiles > 10) {
      toast.error('Maximum 10 files allowed per message');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // New handler for client direct file selection
  const handleClientFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = clientSelectedFiles.length + files.length;
    
    if (totalFiles > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    
    setClientSelectedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleClientRemoveFile = (index: number) => {
    setClientSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // New handler for client direct upload
  const handleClientDirectUpload = async () => {
    if (clientSelectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setClientUploading(true);

    try {
      for (const file of clientSelectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        // Upload to cloudinary
        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadData = await uploadResponse.json();

        // Save file metadata to database (uploadType: initial)
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
            uploadType: 'initial',
          }),
        });

        if (!attachmentResponse.ok) {
          throw new Error(`Failed to save ${file.name} metadata`);
        }
      }

      setClientSelectedFiles([]);
      if (clientFileInputRef.current) {
        clientFileInputRef.current.value = '';
      }

      toast.success('Files uploaded successfully to Your Files section!');
      await fetchAttachments();
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setClientUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) {
      toast.error('Please enter a message or attach files');
      return;
    }

    setSending(true);

    try {
      let fileLinks = '';

      // Upload files first if any
      if (selectedFiles.length > 0) {
        setUploading(true);
        
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);

          // Upload to cloudinary
          const uploadResponse = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const uploadData = await uploadResponse.json();

          // Save file metadata to database (uploadType: initial)
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
              uploadType: 'initial',
            }),
          });

          if (!attachmentResponse.ok) {
            throw new Error(`Failed to save ${file.name} metadata`);
          }

          const attachmentData = await attachmentResponse.json();
          
          // Build clickable file link
          fileLinks += `\n📎 [${file.name}](/api/files/download/${attachmentData.id})`;
        }
        
        setUploading(false);
      }

      // Send message with file links appended
      if (newMessage.trim() || fileLinks) {
        const fullMessage = newMessage.trim() + fileLinks;
        
        const msgResponse = await fetch(`/api/jobs/${jobId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user?.id,
            message: fullMessage,
          }),
        });

        if (!msgResponse.ok) {
          throw new Error('Failed to send message');
        }
      }

      setNewMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Message sent successfully!');
      fetchMessages();
      fetchAttachments();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      toast.info(`Downloading ${attachment.fileName}...`);
      const role = 'client';
      const uid = Number(user?.id || 0);
      const url = `/api/files/download/${attachment.id}?role=${role}&userId=${uid}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handlePaymentInitiate = async () => {
    if (!user?.id || !job?.id) {
      toast.error('Please sign in again and retry payment');
      return;
    }

    const inputPhone = phoneNumber?.trim();
    if (!inputPhone) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    setPaymentProcessing(true);

    try {
      const raw = inputPhone.replace(/[\s-]/g, '').replace(/^\+/, '');
      let formattedPhone = raw;
      
      if (/^0[17]\d{8}$/.test(raw)) {
        formattedPhone = '254' + raw.slice(1);
      } else if (/^[17]\d{8}$/.test(raw)) {
        formattedPhone = '254' + raw;
      } else if (/^254[17]\d{8}$/.test(raw)) {
        formattedPhone = raw;
      } else {
        setPaymentProcessing(false);
        toast.error('Please enter a valid Kenyan phone number');
        return;
      }

      const amountToPay = Math.round(job.amount);

      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: amountToPay,
          jobId: job.id,
          userId: Number(user.id),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Payment request sent! Check your phone to complete payment.', {
          duration: 10000,
        });
        
        setTimeout(() => {
          fetchJob();
          setPaymentProcessing(false);
        }, 30000);
      } else {
        toast.error('Failed to initiate payment. Please try again.');
        setPaymentProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!job) return;
    
    if (!job.paymentConfirmed) {
      toast.error('Please complete payment before approving the work');
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          clientApproved: true,
        }),
      });

      if (response.ok) {
        toast.success('Work approved! Order completed.');
        fetchJob();
      } else {
        toast.error('Failed to approve work');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve work');
    }
  };

  // ✅ NEW: Open edit dialog with current job data
  const handleOpenEditDialog = () => {
    if (!job) return;
    
    setEditFormData({
      title: job.title,
      instructions: job.instructions,
      workType: job.workType,
      pages: job.pages?.toString() || '',
      slides: job.slides?.toString() || '',
      amount: job.amount.toString(),
      deadline: job.actualDeadline ? new Date(job.actualDeadline).toISOString().slice(0, 16) : '',
    });
    setEditDialogOpen(true);
  };

  // ✅ NEW: Save edited job
  const handleSaveEdit = async () => {
    if (!job) return;

    // Validation
    if (!editFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editFormData.instructions.trim()) {
      toast.error('Instructions are required');
      return;
    }

    const amount = parseFloat(editFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!editFormData.deadline) {
      toast.error('Deadline is required');
      return;
    }

    setSaving(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const updatePayload: any = {
        title: editFormData.title.trim(),
        instructions: editFormData.instructions.trim(),
        workType: editFormData.workType,
        amount: parseFloat(editFormData.amount),
        deadline: new Date(editFormData.deadline).toISOString(),
      };

      // Add pages or slides based on work type
      const service = SERVICE_CATALOG[editFormData.workType.toLowerCase().replace(/\s+/g, '-')];
      if (service?.type === 'page') {
        updatePayload.pages = editFormData.pages ? parseFloat(editFormData.pages) : null;
        updatePayload.slides = null;
      } else if (service?.type === 'slide') {
        updatePayload.slides = editFormData.slides ? parseInt(editFormData.slides) : null;
        updatePayload.pages = null;
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        toast.success('Order updated successfully!');
        setEditDialogOpen(false);
        await fetchJob(); // Refresh job data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) return null;

  const displayStatus = job.status === 'editing' ? 'assigned' : job.status;

  // Check if client can edit (only pending orders)
  const canEdit = displayStatus === 'pending';

  const clientFiles = attachments.filter(a => 
    a.uploaderRole === 'client' || a.uploaderRole === 'account_owner'
  );
  
  const writerFiles = attachments.filter(a => 
    a.uploaderRole === 'freelancer' || 
    a.uploaderRole === 'admin' || 
    a.uploaderRole === 'manager'
  );

  return (
    <div className="w-full">
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-7xl">
        <Link href="/client/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* ORDER DETAILS - TOP SECTION */}
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
                    onClick={handleOpenEditDialog}
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
                <div className="mt-1">
                  <CountdownTimer deadline={job.actualDeadline || job.deadline} className="!px-2 !py-0.5" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <p className="font-bold text-lg text-green-600">KSh {job.amount.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Freelancer Details - Show who is working on this */}
            {job.assignedFreelancerId && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <Label className="text-xs text-muted-foreground">Assigned Freelancer</Label>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{job.assignedFreelancerName || 'Freelancer'}</p>
                    {job.assignedFreelancerEmail && (
                      <p className="text-xs text-muted-foreground truncate">{job.assignedFreelancerEmail}</p>
                    )}
                  </div>
                  {job.assignedFreelancerRating && (
                    <Badge className="bg-yellow-500 text-white flex-shrink-0">
                      ★ {job.assignedFreelancerRating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Client Details - Show for admin/manager only */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                <Label className="text-xs text-muted-foreground">Client Information</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{job.clientName || 'Client'}</p>
                      {job.clientEmail && (
                        <p className="text-xs text-muted-foreground truncate">{job.clientEmail}</p>
                      )}
                    </div>
                  </div>
                  {job.clientPhone && (
                    <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900/50 border border-purple-100 dark:border-purple-900/50">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300">📞 {job.clientPhone}</p>
                      <a
                        href={`tel:${job.clientPhone}`}
                        className="px-2 py-1 rounded text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors whitespace-nowrap"
                      >
                        Call
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="e.g., 0712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={paymentProcessing}
                      />
                    </div>
                    <Button
                      onClick={handlePaymentInitiate}
                      disabled={paymentProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {paymentProcessing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><DollarSign className="w-4 h-4 mr-2" />Pay KSh {Math.round(job.amount)}</>
                      )}
                    </Button>
                  </div>
                )}
                
                {job.paymentConfirmed && !job.clientApproved && (
                  <Button onClick={handleApprove} className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Work
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHAT & FILES - BOTTOM SECTION */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* CHAT - LEFT */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Start a conversation below</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isSent = msg.senderId === user?.id;
                      
                      // Parse message for file links
                      const messageParts = msg.message.split(/(\[.*?\]\(\/api\/files\/download\/\d+\))/g);

                      return (
                        <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
                          <div className={`max-w-[70%] ${isSent ? 'text-right' : 'text-left'}`}>
                            {!isSent && (
                              <p className="text-xs font-semibold mb-1 text-muted-foreground">
                                {msg.senderName}
                              </p>
                            )}
                            <div className={`inline-block px-4 py-2 rounded-2xl ${
                              isSent 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-green-600 text-white'
                            }`}>
                              <div className="text-sm whitespace-pre-wrap break-words">
                                {messageParts.map((part, idx) => {
                                  const linkMatch = part.match(/\[(.*?)\]\((\/api\/files\/download\/\d+)\)/);
                                  if (linkMatch) {
                                    const [, fileName, downloadUrl] = linkMatch;
                                    return (
                                      <div key={idx} className="mt-1">
                                        <a
                                          href={downloadUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-white underline hover:text-blue-200 flex items-center gap-1"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const role = 'client';
                                            const uid = Number(user?.id || 0);
                                            const urlWithParams = downloadUrl.includes('?')
                                              ? `${downloadUrl}&role=${role}&userId=${uid}`
                                              : `${downloadUrl}?role=${role}&userId=${uid}`;
                                            window.open(urlWithParams, '_blank');
                                          }}
                                        >
                                          📎 {fileName}
                                        </a>
                                      </div>
                                    );
                                  }
                                  return <span key={idx}>{part}</span>;
                                })}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="px-4 py-2 border-t bg-muted/50">
                  <p className="text-xs font-semibold mb-2">Attachments ({selectedFiles.length}/10)</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs bg-background p-1 rounded">
                        <Paperclip className="w-3 h-3" />
                        <span className="flex-1 truncate">{shortenFileName(file.name, 30)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                          className="h-5 w-5 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t">
                <div className="flex gap-2 mb-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && selectedFiles.length === 0) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 10}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files ({selectedFiles.length}/10)
                  </Button>
                  
                  {selectedFiles.length > 0 ? (
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || uploading}
                      className="ml-auto"
                    >
                      {sending || uploading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" />Upload & Send</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="ml-auto"
                    >
                      <Send className="w-4 h-4 mr-2" />Send
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FILES - RIGHT */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Files</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-primary mb-2">Your Files ({clientFiles.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {clientFiles.length === 0 ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        No files uploaded yet
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Use the upload section below to add your files
                      </p>
                    </div>
                  ) : (
                    clientFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        {getFileIcon(file.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" title={file.fileName}>
                            {shortenFileName(file.fileName, 20)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)} • {format(new Date(file.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(file)}
                          className="h-7 w-7 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CLIENT UPLOAD SPACE */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-primary mb-3">
                  Upload Your Files
                </h3>
                
                {clientSelectedFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-2">Selected Files ({clientSelectedFiles.length}/10)</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {clientSelectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs bg-background p-2 rounded border">
                          <Paperclip className="w-3 h-3" />
                          <span className="flex-1 truncate">{shortenFileName(file.name, 25)}</span>
                          <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleClientRemoveFile(index)}
                            className="h-5 w-5 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={clientFileInputRef}
                    type="file"
                    multiple
                    onChange={handleClientFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clientFileInputRef.current?.click()}
                    disabled={clientSelectedFiles.length >= 10 || clientUploading}
                    className="flex-1"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Select Files ({clientSelectedFiles.length}/10)
                  </Button>
                  
                  <Button
                    onClick={handleClientDirectUpload}
                    disabled={clientSelectedFiles.length === 0 || clientUploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {clientUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload</>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ℹ️ Files will appear in "Your Files" section above
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">
                  Writer Files ({writerFiles.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {writerFiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No files from writer yet</p>
                  ) : (
                    writerFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        {getFileIcon(file.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" title={file.fileName}>
                            {shortenFileName(file.fileName, 20)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>•</span>
                            <span>{format(new Date(file.createdAt), 'MMM dd, HH:mm')}</span>
                            {file.uploadType && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {file.uploadType}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(file)}
                          className="h-7 w-7 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ NEW: Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update your order details. All fields are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Order title"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-workType">Work Type *</Label>
              <Select
                value={editFormData.workType}
                onValueChange={(value) => setEditFormData({ ...editFormData, workType: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essay">Essay</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Research Proposal">Research Proposal</SelectItem>
                  <SelectItem value="Presentation">Presentation</SelectItem>
                  <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pages">Pages</Label>
                <Input
                  id="edit-pages"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editFormData.pages}
                  onChange={(e) => setEditFormData({ ...editFormData, pages: e.target.value })}
                  placeholder="Number of pages"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slides">Slides</Label>
                <Input
                  id="edit-slides"
                  type="number"
                  min="0"
                  value={editFormData.slides}
                  onChange={(e) => setEditFormData({ ...editFormData, slides: e.target.value })}
                  placeholder="Number of slides"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (KSh) *</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                placeholder="Amount in KSh"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline *</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={editFormData.deadline}
                onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Instructions *</Label>
              <Textarea
                id="edit-instructions"
                rows={6}
                value={editFormData.instructions}
                onChange={(e) => setEditFormData({ ...editFormData, instructions: e.target.value })}
                placeholder="Detailed instructions for the writer..."
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}