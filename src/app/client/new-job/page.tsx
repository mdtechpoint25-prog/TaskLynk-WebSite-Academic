"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator, ExternalLink, Link as LinkIcon, CheckCircle, X, Send, Phone, Upload, File as FileIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Service Catalog with Updated Pricing
const SERVICE_CATALOG = {
  // Academic & Writing Services - Updated to 240 minimum
  'essay': { name: 'Essay', rate: 240, unit: 'per page', type: 'page', workType: 'Essay' },
  'assignment': { name: 'Assignment', rate: 240, unit: 'per page', type: 'page', workType: 'Assignment' },
  'research-proposal': { name: 'Research Proposal', rate: 240, unit: 'per page', type: 'page', workType: 'Research Proposal' },
  'thesis-writing': { name: 'Thesis Writing', rate: 240, unit: 'per page', type: 'page', workType: 'Thesis Writing' },
  'research-paper': { name: 'Research Paper', rate: 240, unit: 'per page', type: 'page', workType: 'Research Paper' },
  'dissertation': { name: 'Dissertation', rate: 240, unit: 'per page', type: 'page', workType: 'Dissertation' },
  'case-study': { name: 'Case Study', rate: 240, unit: 'per page', type: 'page', workType: 'Case Study' },
  'lab-report': { name: 'Lab Report', rate: 240, unit: 'per page', type: 'page', workType: 'Lab Report' },
  'article-writing': { name: 'Article Writing', rate: 240, unit: 'per page', type: 'page', workType: 'Article Writing' },
  'blog-writing': { name: 'Blog Writing', rate: 240, unit: 'per page', type: 'page', workType: 'Blog Writing' },
  
  // Presentation & Design Services - 150 per slide
  'presentation': { name: 'Presentation', rate: 150, unit: 'per slide', type: 'slide', workType: 'Presentation' },
  'powerpoint-design': { name: 'PowerPoint Design', rate: 150, unit: 'per slide', type: 'slide', workType: 'PowerPoint Design' },
  'slide-design': { name: 'Slide Design', rate: 150, unit: 'per slide', type: 'slide', workType: 'Slide Design' },
  
  // Editing & Quality Improvement
  'grammar-proofreading': { name: 'Grammar & Proofreading', rate: 30, unit: 'per page', type: 'page', category: 'editing', workType: 'Grammar & Proofreading' },
  'ai-content-removal': { name: 'AI Content Removal', rate: 50, unit: 'per page', type: 'page', category: 'editing', workType: 'AI Content Removal' },
  'humanization': { name: 'Humanization', rate: 50, unit: 'per page', type: 'page', category: 'editing', workType: 'Humanization' },
  'plagiarism-ai-detection': { name: 'Plagiarism + AI Detection Report', rate: 30, unit: 'per document', type: 'document', category: 'editing', workType: 'Plagiarism + AI Detection Report' },
  'formatting-referencing': { name: 'Formatting & Referencing', rate: 25, unit: 'per page', type: 'page', category: 'editing', workType: 'Formatting & Referencing' },
  
  // Document Management
  'pdf-editing': { name: 'PDF Editing', rate: 50, unit: 'per page', type: 'page', workType: 'PDF Editing' },
  'document-conversion': { name: 'Document Conversion', rate: 10, unit: 'per file', type: 'file', workType: 'Document Conversion' },
  
  // Data Analysis Services - Technical
  'data-analysis': { name: 'Data Analysis', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'Data Analysis', technical: true },
  'spss': { name: 'SPSS', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'SPSS', technical: true },
  'excel': { name: 'Excel', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'Excel', technical: true },
  'r-programming': { name: 'R Programming', rate: 300, unit: 'per dataset', type: 'dataset', workType: 'R Programming', technical: true },
  'python': { name: 'Python', rate: 300, unit: 'per dataset', type: 'dataset', workType: 'Python', technical: true },
  'stata': { name: 'STATA', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'STATA', technical: true },
  'jasp': { name: 'JASP', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'JASP', technical: true },
  'jamovi': { name: 'JAMOVI', rate: 270, unit: 'per dataset', type: 'dataset', workType: 'JAMOVI', technical: true },
  
  // Design Services
  'infographics': { name: 'Infographics', rate: 150, unit: 'per graphic', type: 'graphic', workType: 'Infographics' },
  'data-visualization': { name: 'Data Visualization', rate: 150, unit: 'per graphic', type: 'graphic', workType: 'Data Visualization' },
  'poster-design': { name: 'Poster Design', rate: 200, unit: 'per design', type: 'design', workType: 'Poster Design' },
  'resume-design': { name: 'Resume Design', rate: 200, unit: 'per design', type: 'design', workType: 'Resume Design' },
  'brochure-design': { name: 'Brochure Design', rate: 200, unit: 'per design', type: 'design', workType: 'Brochure Design' },
  
  // Additional Services
  'revision-support': { name: 'Revision Support', rate: 100, unit: 'per revision', type: 'revision', workType: 'Revision Support' },
  'expert-consultation': { name: 'Expert Consultation', rate: 500, unit: 'per hour', type: 'hour', workType: 'Expert Consultation' },
  'tutoring': { name: 'Tutoring', rate: 500, unit: 'per hour', type: 'hour', workType: 'Tutoring' },
  
  // Other Services
  'other': { name: 'Other', rate: 240, unit: 'per page', type: 'page', workType: 'Other' },
};

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestDraft, setRequestDraft] = useState(false);
  const [requestPrintableSources, setRequestPrintableSources] = useState(false);
  const [singleSpaced, setSingleSpaced] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  
  // Files.fm link upload state
  const [stagedLinks, setStagedLinks] = useState<Array<{fileName: string, fileUrl: string}>>([]);
  const [linkInput, setLinkInput] = useState('');
  
  // Direct file upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const [customAmountMode, setCustomAmountMode] = useState(false);
  
  const [formData, setFormData] = useState({
    accountOrderNumber: '',
    title: '',
    instructions: '',
    serviceType: '',
    quantity: '',
    amount: '',
    deadline: '',
  });

  // Determine if this is an account client
  const isAccountClient = Boolean(user?.accountId) || user?.role === 'account_owner';
  const [belongsToAccount, setBelongsToAccount] = useState<boolean>(isAccountClient);

  useEffect(() => {
    // Setup broadcast channel for real-time dashboard updates
    const bc = new BroadcastChannel('client_dashboard');
    channelRef.current = bc;
    return () => {
      bc.close();
    };
  }, []);

  // 🔧 FIX: Improved order number auto-generation
  const generateOrderNumberFromName = (name: string) => {
    const base = (name || 'USER').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
    try {
      const key = user?.id ? `order_seq_${user.id}` : 'order_seq_guest';
      const current = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, String(current));
      const seq = String(current).padStart(4, '0');
      return `${base}${seq}`;
    } catch {
      return `${base}${String(Date.now()).slice(-4)}`;
    }
  };

  // Auto-fill order number for regular clients
  useEffect(() => {
    if (!belongsToAccount && user?.name) {
      const generated = generateOrderNumberFromName(user.name);
      setFormData(prev => ({ ...prev, accountOrderNumber: generated }));
    } else if (belongsToAccount) {
      setFormData(prev => ({ ...prev, accountOrderNumber: '' }));
    }
  }, [belongsToAccount, user?.name]);

  // Calculate amount based on service type, quantity, deadline, and single spacing
  const calculateAmount = (serviceType: string, quantity: string, deadline: string, isSingleSpaced: boolean = false) => {
    const service = SERVICE_CATALOG[serviceType as keyof typeof SERVICE_CATALOG];
    if (!service || !quantity) return 0;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 0;

    let baseAmount = service.rate * qty;

    if (isSingleSpaced && service.type === 'page') {
      baseAmount *= 2;
    }

    if (deadline) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 8 && service.category !== 'editing') {
        baseAmount *= 1.3;
      }
    }

    return Math.round(baseAmount);
  };

  const handleServiceTypeChange = (value: string) => {
    setFormData({ ...formData, serviceType: value, quantity: '', amount: '' });
    setCustomAmountMode(false);
  };

  const handleQuantityChange = (value: string) => {
    const newFormData = { ...formData, quantity: value };
    if (!customAmountMode) {
      const calculatedAmount = calculateAmount(newFormData.serviceType, value, newFormData.deadline, singleSpaced);
      setFormData({ ...newFormData, amount: calculatedAmount.toString() });
    } else {
      setFormData(newFormData);
    }
  };

  const handleDeadlineChange = (value: string) => {
    const newFormData = { ...formData, deadline: value };
    if (!customAmountMode) {
      const calculatedAmount = calculateAmount(newFormData.serviceType, newFormData.quantity, value, singleSpaced);
      setFormData({ ...newFormData, amount: calculatedAmount.toString() });
    } else {
      setFormData(newFormData);
    }
  };

  const handleSingleSpacedChange = (checked: boolean) => {
    setSingleSpaced(checked);
    if (!customAmountMode) {
      const calculatedAmount = calculateAmount(formData.serviceType, formData.quantity, formData.deadline, checked);
      setFormData({ ...formData, amount: calculatedAmount.toString() });
    }
  };

  const handleCustomAmountChange = (value: string) => {
    const enteredAmount = parseFloat(value);
    const minAmount = calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced);
    if (value && !isNaN(enteredAmount) && enteredAmount < minAmount) {
      toast.error(`Amount cannot be less than computed price: KSh ${minAmount.toFixed(2)}`);
    }
    setFormData({ ...formData, amount: value });
  };

  const toggleCustomAmount = () => {
    if (!customAmountMode) {
      setCustomAmountMode(true);
      toast.info('You can now set a custom amount (must not be less than computed price)');
    } else {
      setCustomAmountMode(false);
      const calculatedAmount = calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced);
      setFormData({ ...formData, amount: calculatedAmount.toString() });
      toast.info('Switched back to automatic price calculation');
    }
  };

  const isValidFilesFmLink = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('files.fm');
    } catch {
      return false;
    }
  };

  const handleAddLinkToStaging = () => {
    if (!linkInput.trim()) {
      toast.error('Please enter a files.fm link');
      return;
    }
    if (!isValidFilesFmLink(linkInput)) {
      toast.error('Please enter a valid files.fm link (e.g., https://files.fm/...)');
      return;
    }
    if (stagedLinks.some(link => link.fileUrl === linkInput.trim())) {
      toast.error('This link has already been added');
      return;
    }
    let fileName = 'Shared File';
    try {
      const urlObj = new URL(linkInput);
      const pathParts = urlObj.pathname.split('/');
      fileName = pathParts[pathParts.length - 1] || 'Shared File';
    } catch {}
    setStagedLinks([...stagedLinks, { fileName, fileUrl: linkInput.trim() }]);
    setLinkInput('');
    toast.success('Link added to list');
  };

  const removeStagedLink = (index: number) => {
    setStagedLinks(stagedLinks.filter((_, i) => i !== index));
    toast.info('Link removed from list');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) selected`);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const amount = parseFloat(formData.amount);
      const minAmount = calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced);

      if (!quantity || quantity <= 0) {
        setError('Please enter a valid quantity');
        setLoading(false);
        return;
      }

      if (!amount || amount <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      if (customAmountMode && amount < minAmount) {
        setError(`Amount cannot be less than the computed price: KSh ${minAmount.toFixed(2)}`);
        setLoading(false);
        return;
      }

      if (belongsToAccount && !formData.accountOrderNumber.trim()) {
        setError('Order Number is required for account clients');
        setLoading(false);
        return;
      }

      const actualDeadline = new Date(formData.deadline);
      const now = new Date();
      const totalTime = actualDeadline.getTime() - now.getTime();
      const freelancerTime = totalTime * 0.6;
      const freelancerDeadline = new Date(now.getTime() + freelancerTime);

      const service = SERVICE_CATALOG[formData.serviceType as keyof typeof SERVICE_CATALOG];
      const backendWorkType = service ? service.workType : formData.serviceType;

      const baseCpp = service ? service.rate : 0;
      const effectiveCpp = singleSpaced && service?.type === 'page' ? baseCpp * 2 : baseCpp;

      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;

      // Step 1: Create the job
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: user?.id,
          title: formData.title,
          instructions: formData.instructions,
          workType: backendWorkType,
          pages: service && service.type === 'page' ? parseFloat(formData.quantity) : null,
          slides: service && service.type === 'slide' ? parseFloat(formData.quantity) : null,
          amount: parseFloat(formData.amount),
          deadline: actualDeadline.toISOString(),
          actualDeadline: actualDeadline.toISOString(),
          freelancerDeadline: freelancerDeadline.toISOString(),
          requestDraft,
          requestPrintableSources,
          singleSpaced,
          baseCpp,
          effectiveCpp,
          accountOrderNumber: formData.accountOrderNumber || undefined,
          accountLinked: belongsToAccount,
        }),
      });

      if (!jobResponse.ok) {
        const data = await jobResponse.json().catch(() => ({}));
        setError(data.error || 'Failed to create job');
        setLoading(false);
        return;
      }

      const createdJob = await jobResponse.json();

      try {
        channelRef.current?.postMessage({ type: 'jobCreated', jobId: createdJob.id });
      } catch {}

      // Step 2: Upload files (if any)
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        toast.info(`Uploading ${selectedFiles.length} file(s)...`);
        
        for (const file of selectedFiles) {
          try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('jobId', createdJob.id.toString());
            fd.append('folder', 'tasklynk/uploads');

            const uploadResponse = await fetch('/api/cloudinary/upload', {
              method: 'POST',
              body: fd,
            });

            if (!uploadResponse.ok) {
              console.error('Failed to upload file:', file.name);
              toast.error(`Failed to upload: ${file.name}`);
              continue;
            }

            const uploadData = await uploadResponse.json();

            const attachmentResponse = await fetch(`/api/jobs/${createdJob.id}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                fileName: file.name,
                fileUrl: uploadData.url,
                fileSize: file.size,
                fileType: file.type,
                uploadType: 'initial',
                uploadedBy: user?.id,
              }),
            });

            if (!attachmentResponse.ok) {
              console.error('Failed to save file metadata:', file.name);
              toast.error(`Failed to save: ${file.name}`);
            }
          } catch (err) {
            console.error('File upload error:', err);
            toast.error(`Error uploading: ${file.name}`);
          }
        }
        
        toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
        setUploadingFiles(false);
      }

      // Step 3: Send files.fm links as messages (if any)
      if (stagedLinks.length > 0) {
        toast.info('Submitting links as messages...');
        for (const link of stagedLinks) {
          try {
            await fetch(`/api/jobs/${createdJob.id}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                senderId: user?.id,
                message: link.fileUrl,
                messageType: 'link',
              }),
            });
          } catch (err) {
            console.error('Failed to send link:', err);
          }
        }
      }

      // Success message
      const fileCount = selectedFiles.length;
      const linkCount = stagedLinks.length;
      if (fileCount > 0 || linkCount > 0) {
        toast.success(`Job posted successfully! ${fileCount > 0 ? `${fileCount} file(s) uploaded, ` : ''}${linkCount > 0 ? `${linkCount} link(s) submitted and ` : ''}awaiting admin approval.`);
      } else {
        toast.success('Job posted successfully! Awaiting admin approval.');
      }

      router.push('/client/dashboard');
    } catch (err) {
      console.error('Submit error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = formData.serviceType ? SERVICE_CATALOG[formData.serviceType as keyof typeof SERVICE_CATALOG] : null;
  const showSingleSpacingOption = selectedService?.type === 'page';

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post a New Job</h1>
        <p className="text-muted-foreground">
          Fill out the details below to post your writing job
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide clear instructions to get the best results. Title and instructions are required; file attachments are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account ownership toggle */}
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="belongsToAccount"
                checked={belongsToAccount}
                onCheckedChange={(c) => setBelongsToAccount(Boolean(c))}
                disabled={loading || isAccountClient}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="belongsToAccount" className="cursor-pointer font-semibold">
                  {isAccountClient ? '✓ Account Client (Automatic)' : 'Account Order? (Check if you have an external order number)'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isAccountClient
                    ? 'Your profile is linked to an account. Order number entry is enabled.'
                    : 'Check Yes if you have an external platform order number (e.g., from EssayPro). Otherwise leave unchecked for auto-generated order numbers.'}
                </p>
              </div>
            </div>

            {/* Order Number Field */}
            <div className="space-y-2">
              <Label htmlFor="accountOrderNumber">
                Order Number {belongsToAccount && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id="accountOrderNumber"
                placeholder={belongsToAccount ? 'Enter your account order number (e.g., EP2025001)' : 'Auto-generated from your name'}
                value={formData.accountOrderNumber}
                onChange={(e) => setFormData({ ...formData, accountOrderNumber: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                required={belongsToAccount}
                disabled={loading || !belongsToAccount}
                className={!belongsToAccount ? 'bg-muted' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {belongsToAccount
                  ? 'Enter the order number from your external account (e.g., EssayPro order number)'
                  : `This is your auto-generated order number. It cannot be changed.`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Research Paper on Climate Change"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Work Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={handleServiceTypeChange}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="research-proposal">Research Proposal</SelectItem>
                  <SelectItem value="thesis-writing">Thesis Writing</SelectItem>
                  <SelectItem value="research-paper">Research Paper</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="powerpoint-design">PowerPoint Design</SelectItem>
                  <SelectItem value="slide-design">Slide Design</SelectItem>
                  <SelectItem value="dissertation">Dissertation</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="lab-report">Lab Report</SelectItem>
                  <SelectItem value="article-writing">Article Writing</SelectItem>
                  <SelectItem value="blog-writing">Blog Writing</SelectItem>
                  <SelectItem value="grammar-proofreading">Grammar & Proofreading</SelectItem>
                  <SelectItem value="ai-content-removal">AI Content Removal</SelectItem>
                  <SelectItem value="humanization">Humanization</SelectItem>
                  <SelectItem value="plagiarism-ai-detection">Plagiarism + AI Detection Report</SelectItem>
                  <SelectItem value="formatting-referencing">Formatting & Referencing</SelectItem>
                  <SelectItem value="pdf-editing">PDF Editing</SelectItem>
                  <SelectItem value="document-conversion">Document Conversion</SelectItem>
                  <SelectItem value="file-compression">File Compression</SelectItem>
                  <SelectItem value="data-analysis">Data Analysis</SelectItem>
                  <SelectItem value="spss">SPSS</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="r-programming">R Programming</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="stata">STATA</SelectItem>
                  <SelectItem value="jasp">JASP</SelectItem>
                  <SelectItem value="jamovi">JAMOVI</SelectItem>
                  <SelectItem value="infographics">Infographics</SelectItem>
                  <SelectItem value="data-visualization">Data Visualization</SelectItem>
                  <SelectItem value="poster-design">Poster Design</SelectItem>
                  <SelectItem value="resume-design">Resume Design</SelectItem>
                  <SelectItem value="brochure-design">Brochure Design</SelectItem>
                  <SelectItem value="revision-support">Revision Support</SelectItem>
                  <SelectItem value="expert-consultation">Expert Consultation</SelectItem>
                  <SelectItem value="tutoring">Tutoring</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  Rate: KSh {selectedService.rate} {selectedService.unit}
                </p>
              )}
            </div>

            {selectedService && (
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {selectedService.type === 'page' && 'Number of Pages'}
                  {selectedService.type === 'slide' && 'Number of Slides'}
                  {selectedService.type === 'dataset' && 'Number of Datasets'}
                  {selectedService.type === 'document' && 'Number of Documents'}
                  {selectedService.type === 'graphic' && 'Number of Graphics'}
                  {selectedService.type === 'design' && 'Number of Designs'}
                  {selectedService.type === 'file' && 'Number of Files'}
                  {selectedService.type === 'hour' && 'Number of Hours'}
                  {selectedService.type === 'revision' && 'Number of Revisions'}
                  *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={selectedService.type === 'page' ? '0.1' : '1'}
                  step={selectedService.type === 'page' ? '0.1' : selectedService.type === 'hour' ? '0.5' : '1'}
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* NEW: Single Spacing Checkbox - Only for page-based services */}
            {showSingleSpacingOption && (
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                <Checkbox
                  id="singleSpaced"
                  checked={singleSpaced}
                  onCheckedChange={(c) => handleSingleSpacedChange(Boolean(c))}
                  disabled={loading}
                  className="mt-0.5"
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="singleSpaced" className="cursor-pointer font-semibold">Single Spaced (Doubles CPP)</Label>
                  <p className="text-xs text-muted-foreground">
                    Check this if your document should be single-spaced instead of double-spaced. 
                    This will double the cost per page (CPP). For example, 2 pages at KSh 250/page becomes KSh 500/page when single-spaced.
                  </p>
                  {singleSpaced && selectedService && (
                    <Alert className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>Single spacing applied:</strong> Base CPP of KSh {selectedService.rate} is now KSh {selectedService.rate * 2} per page
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                required
                disabled={loading}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                The final deadline for your completed work
              </p>
            </div>

            {/* Automated Price Calculation Display - Updated to show single spacing effect */}
            {formData.amount && selectedService && formData.quantity && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-primary">Price Calculation</h3>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Base Rate:</span>
                    <span className="font-medium">KSh {selectedService.rate} {selectedService.unit}</span>
                  </div>
                  {singleSpaced && selectedService.type === 'page' && (
                    <div className="flex justify-between text-sm">
                      <span>Single Spacing Multiplier:</span>
                      <span className="font-medium text-yellow-600">×2 (KSh {selectedService.rate * 2}/page)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20">
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                      <span>Computed Amount:</span>
                      <span className="font-medium">KSh {calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Amount Toggle and Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Payment Amount</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleCustomAmount}
                      disabled={loading}
                    >
                      {customAmountMode ? 'Use Auto Amount' : 'Set Custom Amount'}
                    </Button>
                  </div>

                  {customAmountMode ? (
                    <div className="space-y-2">
                      <Label htmlFor="customAmount">
                        Custom Amount (KSh) *
                      </Label>
                      <Input
                        id="customAmount"
                        type="number"
                        min={calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced)}
                        step="0.01"
                        placeholder={`Minimum: ${calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced)}`}
                        value={formData.amount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        required
                        disabled={loading}
                        className="text-lg font-semibold"
                      />
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Minimum: KSh {calculateAmount(formData.serviceType, formData.quantity, formData.deadline, singleSpaced).toFixed(2)}</strong>
                          <br />
                          You can set a higher amount to incentivize quality work. The amount must not be less than the computed price.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Final Payment Amount:</span>
                        <span className="text-2xl font-bold text-primary">
                          KSh {parseFloat(formData.amount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click "Set Custom Amount" to modify this amount
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions *</Label>
              <Textarea
                id="instructions"
                placeholder="Provide detailed instructions for the writer..."
                rows={8}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Include topic, formatting requirements, citation style, and any other important details
              </p>
            </div>

            {/* Draft Request Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requestDraft" 
                checked={requestDraft}
                onCheckedChange={(checked) => setRequestDraft(checked as boolean)}
                disabled={loading}
              />
              <Label 
                htmlFor="requestDraft" 
                className="text-sm font-normal cursor-pointer"
              >
                Request a draft before final submission
              </Label>
            </div>

            {/* NEW: Request Printable Sources Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requestPrintableSources" 
                checked={requestPrintableSources}
                onCheckedChange={(checked) => setRequestPrintableSources(checked as boolean)}
                disabled={loading}
              />
              <Label 
                htmlFor="requestPrintableSources" 
                className="text-sm font-normal cursor-pointer"
              >
                Request printable sources with the final submission
              </Label>
            </div>

            {/* ENHANCED FILE UPLOAD SECTION - Now clearly marked as optional */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Attach Files (Optional)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can submit the job without files and add them later if needed
                  </p>
                </div>
              </div>

              {/* DIRECT FILE UPLOAD - NOW ENABLED */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/30">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Upload className="w-10 h-10 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Upload Files Directly</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 40MB per file. Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, PNG, JPG
                    </p>
                  </div>

                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept="*/*"
                    disabled={loading || uploadingFiles}
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={loading || uploadingFiles}
                    className="w-full"
                    variant="outline"
                  >
                    <FileIcon className="w-4 h-4 mr-2" />
                    Select Files to Upload
                  </Button>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Selected files ({selectedFiles.length}):</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-background p-2 rounded border">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileIcon className="w-4 h-4 flex-shrink-0 text-primary" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedFile(index)}
                              disabled={loading || uploadingFiles}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FILES.FM LINK UPLOAD - ALTERNATIVE METHOD */}
              <div className="border-2 border-green-500 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium mb-1">📤 Alternative: Share files via Files.fm</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Upload your files to <a href="https://files.fm" target="_blank" rel="noopener noreferrer" className="underline">Files.fm</a></li>
                      <li>Copy the Files.fm link</li>
                      <li>Paste the link below and click "Add to List"</li>
                      <li>Links will be submitted with your job and sent to admin for approval</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="link-input" className="text-green-800 dark:text-green-200">
                      Files.fm Link
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="link-input"
                        type="url"
                        placeholder="https://files.fm/..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLinkToStaging();
                          }
                        }}
                        disabled={loading}
                        className="flex-1 bg-white dark:bg-gray-900"
                      />
                      <Button
                        type="button"
                        onClick={handleAddLinkToStaging}
                        disabled={loading || !linkInput.trim()}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Add to List
                      </Button>
                    </div>
                  </div>

                  {/* Staged Links Display */}
                  {stagedLinks.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-green-300 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          📎 Links Ready to Submit ({stagedLinks.length})
                        </p>
                        <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300">
                          <Send className="w-3 h-3 mr-1" />
                          Will be submitted with job
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stagedLinks.map((link, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <LinkIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {link.fileName}
                              </p>
                              <a
                                href={link.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-700 hover:underline break-all inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {link.fileUrl}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStagedLink(index)}
                              disabled={loading}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Summary */}
              {(selectedFiles.length > 0 || stagedLinks.length > 0) && (
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Ready to submit:</strong> {selectedFiles.length} file(s) + {stagedLinks.length} link(s)
                    {stagedLinks.length > 0 && ' (links require admin approval)'}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploadingFiles} className="flex-1">
                {uploadingFiles ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Files...
                  </>
                ) : loading ? (
                  'Submitting...'
                ) : (
                  `Submit Job${selectedFiles.length + stagedLinks.length > 0 ? ` with ${selectedFiles.length + stagedLinks.length} attachment(s)` : ''}`
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading || uploadingFiles}
              >
                Cancel
              </Button>
            </div>

            {/* Call Us Button */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
                <span className="text-sm">Need help? Call us directly:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="tel:0701066845"
                  className="flex-1"
                >
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full gap-2 hover:bg-green-50 dark:hover:bg-green-950 border-green-500 text-green-700 dark:text-green-400"
                  >
                    <Phone className="w-4 h-4" />
                    0701066845
                  </Button>
                </a>
                <a 
                  href="tel:0702794172"
                  className="flex-1"
                >
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full gap-2 hover:bg-green-50 dark:hover:bg-green-950 border-green-500 text-green-700 dark:text-green-400"
                  >
                    <Phone className="w-4 h-4" />
                    0702794172
                  </Button>
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}