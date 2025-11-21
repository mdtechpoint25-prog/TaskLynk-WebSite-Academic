"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, Clock, ArrowLeft, 
  Paperclip, X, Download, FileText, Image as ImageIcon, 
  FileArchive, Video, Music, File, Loader2, Upload, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateWriterEarnings } from '@/lib/payment-calculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  adminApproved: boolean;
  clientApproved: boolean;
  paymentConfirmed: boolean;
  createdAt: string;
  // optional flags that may be added by backend later
  requires_reports?: boolean;
  requiresReports?: boolean;
};

type Message = {
  id: number;
  jobId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  adminApproved: boolean;
  createdAt: string;
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

export default function FreelancerJobDetailPage() {
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
  const [submitting, setSubmitting] = useState(false);
  const [isFinalCopy, setIsFinalCopy] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // NEW: File type selection & notes
  const [selectedFileType, setSelectedFileType] = useState<
    'draft' | 'final_document' | 'plagiarism_report' | 'ai_report' | 'revision' | 'additional' | 'abstract' | 'printable_sources' | 'graphics_tables' | 'completed_paper' | ''
  >('');
  const [uploadNotes, setUploadNotes] = useState('');

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
        if (foundJob && foundJob.assignedFreelancerId === user?.id) {
          setJob(foundJob);
        } else {
          toast.error('Job not found or not assigned to you');
          router.push('/freelancer/dashboard');
        }
      } else {
        toast.error('Failed to load job details');
        router.push('/freelancer/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Error loading job details');
      router.push('/freelancer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages?userRole=freelancer`);
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
      if (!user?.id) return;
      const response = await fetch(`/api/v2/orders/${jobId}/files?role=freelancer&userId=${user.id}&includeDrafts=true`);
      if (response.ok) {
        const data = await response.json();
        const files = (data.files || []).map((f: any) => ({
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
        setAttachments(files);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = selectedFiles.length + files.length;
    
    if (totalFiles > 10) {
      toast.error('Maximum 10 files allowed per upload');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!selectedFileType) {
      toast.error('Please select a file type before uploading');
      return;
    }

    setUploading(true);

    try {
      // 1) Upload all binaries to Cloudinary first
      const uploadedList: { url: string; name: string; size: number; mimeType: string; fileType?: string }[] = [];
      for (const file of selectedFiles) {
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
        uploadedList.push({
          url: uploadData.url,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileType: selectedFileType,
        });
      }

      // 2) Send metadata to the appropriate v2 endpoint
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let endpoint = '';
      if (selectedFileType === 'draft') {
        endpoint = `/api/v2/orders/${jobId}/upload/draft`;
      } else if (
        ['final_document', 'completed_paper', 'plagiarism_report', 'ai_report'].includes(selectedFileType)
      ) {
        endpoint = `/api/v2/orders/${jobId}/upload/final`;
      } else if (selectedFileType === 'revision') {
        endpoint = `/api/v2/orders/${jobId}/upload/revision`;
      } else {
        // additional types
        endpoint = `/api/v2/orders/${jobId}/upload/additional`;
      }

      const saveResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          uploaderId: user?.id,
          notes: uploadNotes || undefined,
          files: uploadedList.map(u => ({
            url: u.url,
            name: u.name,
            size: u.size,
            mimeType: u.mimeType,
            fileType: selectedFileType,
          })),
        }),
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => ({}));
        throw new Error(err.error || `Failed to save metadata for ${selectedFiles.length} file(s)`);
      }

      setSelectedFiles([]);
      setSelectedFileType('');
      setUploadNotes('');
      setIsFinalCopy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success(`Files uploaded successfully as "${selectedFileType.replace('_', ' ')}"!`);
      await fetchJob();
      await fetchAttachments();
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);

    try {
      const msgResponse = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          message: newMessage.trim(),
        }),
      });

      if (!msgResponse.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      toast.success('Message sent successfully!');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit order');
      }

      toast.success('Order submitted successfully! It will be reviewed by admin before delivery to client.');
      setShowSubmitDialog(false);
      
      // Refresh job data
      await fetchJob();
      
    } catch (error) {
      console.error('Failed to submit order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      toast.info(`Downloading ${attachment.fileName}...`);
      const role = 'freelancer';
      const uid = Number(user?.id || 0);
      const url = `/api/files/download/${attachment.id}?role=${role}&userId=${uid}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
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

  const displayStatus = job.status === 'editing' ? 'submitted' : job.status;

  const clientFiles = attachments.filter(a => 
    a.uploaderRole === 'client' || a.uploaderRole === 'account_owner'
  );
  
  const writerFiles = attachments.filter(a => a.uploaderRole === 'freelancer');
  
  const finalDocFiles = writerFiles.filter(a => a.uploadType === 'final_document' || a.uploadType === 'final' || a.uploadType === 'completed_paper');
  const plagReportFiles = writerFiles.filter(a => a.uploadType === 'plagiarism_report');
  const aiReportFiles = writerFiles.filter(a => a.uploadType === 'ai_report');
  const draftFiles = writerFiles.filter(a => a.uploadType === 'draft');

  const freelancerEarnings = calculateWriterEarnings(job.pages, job.slides, job.workType).toFixed(2);

  const requiresReports = (job as any)?.requires_reports ?? (job as any)?.requiresReports ?? true;

  const finalReady = requiresReports
    ? (finalDocFiles.length > 0 && plagReportFiles.length > 0 && aiReportFiles.length > 0)
    : (finalDocFiles.length > 0);

  const draftUploaded = draftFiles.length > 0;

  const canSubmit = ['assigned','in_progress','editing','revision'].includes(job.status) && finalReady && draftUploaded && !['cancelled','closed'].includes(job.status);
  const alreadySubmitted = ['editing', 'delivered', 'completed', 'paid'].includes(job.status);

  return (
    <div className="w-full">
      <div className="p-3 md:p-4 lg:p-5 w-full max-w-7xl mx-auto">
        <Link href="/freelancer/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* ORDER DETAILS - TOP SECTION */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-1">{job.title}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Order ID: <Badge variant="outline" className="font-mono">{job.displayId}</Badge></span>
                  <span>•</span>
                  <span>Assigned {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <Badge 
                variant={displayStatus === 'completed' ? 'default' : 'secondary'}
                className="text-lg px-4 py-2 capitalize"
              >
                {displayStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground">Work Type</Label>
                <p className="font-semibold capitalize">{job.workType}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pages/Slides</Label>
                <p className="font-semibold">
                  {job.pages ? `${job.pages} pages` : ''}{job.pages && job.slides ? ' + ' : ''}{job.slides ? `${job.slides} slides` : ''}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Deadline</Label>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(new Date(job.freelancerDeadline), 'MMM dd, HH:mm')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Earnings</Label>
                <p className="font-bold text-lg text-green-600">KSh {freelancerEarnings}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Instructions</Label>
              <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">
                {job.instructions}
              </div>
            </div>

            {['assigned','in_progress','editing','revision'].includes(job.status) && (
              <div className="mt-4 pt-4 border space-y-3">
                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Working on this order</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Upload your work files below. Select an appropriate file type for each upload. Final submission requires the main document{requiresReports ? ' plus Plagiarism & AI reports.' : '.'}
                    </p>
                  </div>
                </div>
                
                {finalReady ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Final package ready
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Final document{requiresReports ? ', Plagiarism report, and AI report' : ''} uploaded.
                        </p>
                        {!draftUploaded && (
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Please upload at least one draft before submitting the final files.
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowSubmitDialog(true)}
                      disabled={submitting || !canSubmit}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Submission requirements not met</p>
                    </div>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc ml-5">
                      <li className={finalDocFiles.length > 0 ? 'line-through opacity-60' : ''}>Upload Final Document</li>
                      {requiresReports && (
                        <>
                          <li className={plagReportFiles.length > 0 ? 'line-through opacity-60' : ''}>Upload Plagiarism Report</li>
                          <li className={aiReportFiles.length > 0 ? 'line-through opacity-60' : ''}>Upload AI Detection Report</li>
                        </>
                      )}
                      <li className={draftUploaded ? 'line-through opacity-60' : ''}>Upload at least one Draft</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {alreadySubmitted && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {job.status === 'editing' && 'Work submitted - Under review'}
                      {job.status === 'delivered' && 'Work delivered to client!'}
                      {job.status === 'completed' && 'Order completed!'}
                      {job.status === 'paid' && 'Payment processed!'}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {job.status === 'editing' && 'Admin is reviewing your work before delivery to client'}
                      {job.status === 'delivered' && 'Waiting for client approval. Payment will be added to your balance once approved.'}
                      {job.status === 'completed' && 'Payment has been added to your balance. Great work!'}
                      {job.status === 'paid' && 'Payment has been added to your balance. Great work!'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHAT & FILES - BOTTOM SECTION */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* CHAT - LEFT */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chat with Client/Admin</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Send a message below to start communication</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isSent = msg.senderId === user?.id;

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
                                {msg.message}
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

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ℹ️ Use chat for clarifications. Upload work files in the Files section →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FILES - RIGHT */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Files</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* CLIENT FILES */}
              <div>
                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
                  Client Files ({clientFiles.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {clientFiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No files from client yet</p>
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

              {/* YOUR FILES */}
              <div>
                <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">
                  Your Files ({writerFiles.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {writerFiles.length === 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        No files uploaded yet
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Use the upload section below to add your work files
                      </p>
                    </div>
                  ) : (
                    writerFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        {getFileIcon(file.fileType)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium truncate" title={file.fileName}>
                              {shortenFileName(file.fileName, 15)}
                            </p>
                            <Badge 
                              variant={'outline'} 
                              className={`text-xs px-1 py-0 capitalize ${
                                (file.uploadType === 'final_document' || file.uploadType === 'final' || file.uploadType === 'completed_paper')
                                  ? 'border-green-600 text-green-700'
                                  : (file.uploadType === 'plagiarism_report' || file.uploadType === 'ai_report')
                                  ? 'border-blue-600 text-blue-700'
                                  : (file.uploadType === 'revision')
                                  ? 'border-amber-600 text-amber-700'
                                  : ''
                              }`}
                            >
                              {file.uploadType.replace('_', ' ')}
                            </Badge>
                          </div>
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

              {/* UPLOAD SECTION */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-3">
                  Upload Your Work Files
                </h3>

                {/* File Type Selector */}
                <div className="grid gap-3 mb-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Select File Type</Label>
                    <Select value={selectedFileType} onValueChange={(v) => setSelectedFileType(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose file type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="final_document">Final Document</SelectItem>
                        <SelectItem value="completed_paper">Completed Paper</SelectItem>
                        <SelectItem value="plagiarism_report">Plagiarism Report</SelectItem>
                        <SelectItem value="ai_report">AI Report</SelectItem>
                        <SelectItem value="revision">Revision</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="printable_sources">Printable Sources</SelectItem>
                        <SelectItem value="graphics_tables">Graphics/Tables</SelectItem>
                        <SelectItem value="additional">Additional Files</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                    <Textarea
                      rows={2}
                      className="mt-1 resize-none"
                      placeholder="Any notes about this upload (visible to admin/manager)."
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                    />
                  </div>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-2">Selected Files ({selectedFiles.length}/10)</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs bg-background p-2 rounded border">
                          <Paperclip className="w-3 h-3" />
                          <span className="flex-1 truncate">{shortenFileName(file.name, 25)}</span>
                          <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
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
                    disabled={selectedFiles.length >= 10 || uploading}
                    className="flex-1"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Select Files ({selectedFiles.length}/10)
                  </Button>
                  
                  <Button
                    onClick={handleUploadFiles}
                    disabled={selectedFiles.length === 0 || uploading || !selectedFileType}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload</>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ℹ️ Files will appear in "Your Files" section above. Final submission requires Final Document{requiresReports ? ', Plagiarism Report, and AI Report' : ''}. Also ensure you have uploaded at least one Draft.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order Submission</DialogTitle>
            <DialogDescription>
              You are about to submit this order for admin review. Please confirm the files you're submitting:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                Final Package:
              </p>
              <div className="space-y-1">
                {finalDocFiles.map((file) => (
                  <div key={`final-${file.id}`} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="flex-1 truncate">{file.fileName}</span>
                    <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                  </div>
                ))}
                {requiresReports && (
                  <>
                    {plagReportFiles.map((file) => (
                      <div key={`plag-${file.id}`} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="flex-1 truncate">{file.fileName} (Plagiarism Report)</span>
                        <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                      </div>
                    ))}
                    {aiReportFiles.map((file) => (
                      <div key={`ai-${file.id}`} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="flex-1 truncate">{file.fileName} (AI Report)</span>
                        <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Once submitted, your work will be reviewed by admin before delivery to the client.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Confirm & Submit</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}