"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Mail, 
  Send, 
  FileText, 
  Trash2, 
  Inbox, 
  Search, 
  Paperclip, 
  Download, 
  Reply, 
  ReplyAll, 
  Forward, 
  X, 
  Menu, 
  ChevronLeft,
  User,
  Settings,
  LogOut,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
  }>;
  folder: "inbox" | "sent" | "drafts" | "trash";
}

interface ComposeData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  attachments: File[];
}

const ALLOWED_FROM = [
  "support@tasklynk.co.ke",
  "admin@tasklynk.co.ke",
  "admn@tasklynk.co.ke"
];

export default function WebmailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromEmail, setFromEmail] = useState<string>(ALLOWED_FROM[0]);
  const { user } = useAuth();
  const [composeData, setComposeData] = useState<ComposeData>({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    attachments: []
  });

  // Mock emails data
  const [emails, setEmails] = useState<Email[]>([
    {
      id: "1",
      from: "client@example.com",
      to: "support@tasklynk.co.ke",
      subject: "Project Inquiry - Research Paper",
      body: "Hello TaskLynk Team,\n\nI need assistance with a research paper on data analysis. The deadline is next week. Can you help?\n\nBest regards,\nJohn Doe",
      date: "2025-01-10T09:30:00",
      read: false,
      folder: "inbox",
      attachments: [
        {
          id: "att1",
          name: "requirements.pdf",
          size: "245 KB",
          type: "application/pdf",
          url: "#"
        }
      ]
    },
    {
      id: "2",
      from: "writer@example.com",
      to: "support@tasklynk.co.ke",
      subject: "Application for Writer Position",
      body: "Dear TaskLynk Team,\n\nI would like to apply for the academic writer position. I have 5 years of experience in academic writing.\n\nThank you,\nJane Smith",
      date: "2025-01-09T14:20:00",
      read: false,
      folder: "inbox"
    },
    {
      id: "3",
      from: "support@tasklynk.co.ke",
      to: "client@example.com",
      subject: "Re: Order Confirmation",
      body: "Dear Client,\n\nYour order has been confirmed and assigned to one of our professional writers.\n\nBest regards,\nTaskLynk Support",
      date: "2025-01-08T11:15:00",
      read: true,
      folder: "sent"
    }
  ]);

  const filteredEmails = emails
    .filter(email => email.folder === currentFolder)
    .filter(email => 
      searchQuery === "" || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails(prev => 
        prev.map(e => e.id === email.id ? { ...e, read: true } : e)
      );
    }
  };

  const handleCompose = () => {
    setComposeOpen(true);
    setComposeData({
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
      attachments: []
    });
    setFromEmail(ALLOWED_FROM[0]);
  };

  // Upload attachments to Cloudinary and return URLs
  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("jobId", "0");
      form.append("folder", "tasklynk/webmail");
      const res = await fetch("/api/cloudinary/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  };

  const parseRecipients = (value: string) => value
    .split(/[,;\s]+/)
    .map(v => v.trim())
    .filter(Boolean);

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error("Please fill in recipient and subject fields");
      return;
    }
    if (!user || user.role !== 'admin') {
      toast.error("Only admin users can send emails");
      return;
    }

    try {
      setLoading(true);
      // 1) Upload attachments
      const attachmentUrls = composeData.attachments.length > 0
        ? await uploadAttachments(composeData.attachments)
        : [];

      // 2) Prepare recipients and HTML body
      const toRecipients = parseRecipients(composeData.to);
      const ccRecipients = parseRecipients(composeData.cc);
      const bccRecipients = parseRecipients(composeData.bcc);
      const allRecipients = Array.from(new Set([...toRecipients, ...ccRecipients, ...bccRecipients]));

      const htmlBody = `<div style="white-space:pre-wrap;line-height:1.6">${composeData.body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
      }</div>`;

      // 3) Send via backend
      const res = await fetch("/api/admin/emails/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentBy: user.id,
          fromEmail,
          recipientType: "direct",
          recipientEmails: allRecipients,
          subject: composeData.subject,
          body: htmlBody,
          attachmentUrls
        })
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error || "Failed to send email");
        setLoading(false);
        return;
      }

      // 4) Update local Sent folder
      const nowISO = new Date().toISOString();
      setEmails(prev => ([
        ...prev,
        {
          id: String(Date.now()),
          from: fromEmail,
          to: toRecipients.join(", "),
          subject: composeData.subject,
          body: composeData.body,
          date: nowISO,
          read: true,
          folder: "sent",
          attachments: composeData.attachments.map((f, i) => ({
            id: `u-${i}`,
            name: f.name,
            size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
            type: f.type,
            url: attachmentUrls[i] || "#"
          }))
        }
      ]));

      toast.success(`Email sent (${result.sent}/${result.total})`);
      setComposeOpen(false);
      setCurrentFolder("sent");
    } catch (e: any) {
      toast.error(e?.message || "Sending failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setComposeData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(e.target.files!)]
      }));
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setComposeData({
        to: selectedEmail.from,
        cc: "",
        bcc: "",
        subject: `Re: ${selectedEmail.subject}`,
        body: `\n\n---\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`,
        attachments: []
      });
      setFromEmail(ALLOWED_FROM[0]);
      setComposeOpen(true);
    }
  };

  const handleDelete = (emailId: string) => {
    setEmails(prev => 
      prev.map(e => e.id === emailId ? { ...e, folder: "trash" as const } : e)
    );
    setSelectedEmail(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const unreadCount = emails.filter(e => e.folder === currentFolder && !e.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground border-b border-primary/20 shadow-md">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logo-1762897197877.png?width=8000&height=8000&resize=contain"
                  alt="TaskLynk"
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button
                onClick={() => setCurrentFolder("inbox")}
                className={cn(
                  "hover:text-secondary transition-colors",
                  currentFolder === "inbox" && "text-secondary"
                )}
              >
                Inbox
              </button>
              <button
                onClick={() => setCurrentFolder("sent")}
                className={cn(
                  "hover:text-secondary transition-colors",
                  currentFolder === "sent" && "text-secondary"
                )}
              >
                Sent
              </button>
              <button
                onClick={() => setCurrentFolder("drafts")}
                className={cn(
                  "hover:text-secondary transition-colors",
                  currentFolder === "drafts" && "text-secondary"
                )}
              >
                Drafts
              </button>
              <button
                onClick={() => setCurrentFolder("trash")}
                className={cn(
                  "hover:text-secondary transition-colors",
                  currentFolder === "trash" && "text-secondary"
                )}
              >
                Trash
              </button>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-64 bg-card border-r border-border flex flex-col transition-all duration-300",
            "lg:relative absolute inset-y-0 left-0 z-40",
            !sidebarOpen && "lg:w-0 -translate-x-full lg:translate-x-0"
          )}
        >
          {sidebarOpen && (
            <>
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button
                  onClick={() => setCurrentFolder("inbox")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    currentFolder === "inbox" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <Inbox className="w-5 h-5" />
                  <span className="flex-1 font-medium">Inbox</span>
                  {unreadCount > 0 && currentFolder === "inbox" && (
                    <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentFolder("sent")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    currentFolder === "sent" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <Send className="w-5 h-5" />
                  <span className="flex-1 font-medium">Sent</span>
                </button>

                <button
                  onClick={() => setCurrentFolder("drafts")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    currentFolder === "drafts" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <FileText className="w-5 h-5" />
                  <span className="flex-1 font-medium">Drafts</span>
                </button>

                <button
                  onClick={() => setCurrentFolder("trash")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    currentFolder === "trash" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="flex-1 font-medium">Trash</span>
                </button>
              </nav>

              <div className="p-4 border-t border-border">
                <Button 
                  onClick={handleCompose}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Compose
                </Button>
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className={cn(
            "w-full lg:w-96 bg-background border-r border-border flex flex-col",
            selectedEmail && "hidden lg:flex"
          )}>
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold capitalize">{currentFolder}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredEmails.length} message{filteredEmails.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Mail className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No messages in {currentFolder}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredEmails.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-muted transition-colors",
                        selectedEmail?.id === email.id && "bg-muted",
                        !email.read && "bg-blue-50 dark:bg-blue-950/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={cn(
                          "font-medium truncate flex-1",
                          !email.read && "font-bold"
                        )}>
                          {currentFolder === "sent" ? email.to : email.from}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm mb-1 truncate",
                        !email.read ? "font-semibold" : "text-muted-foreground"
                      )}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email.body}
                      </p>
                      {email.attachments && email.attachments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email View */}
          <div className={cn(
            "flex-1 bg-background overflow-hidden",
            !selectedEmail && "hidden lg:flex lg:items-center lg:justify-center"
          )}>
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                {/* Email Header */}
                <div className="p-6 border-b border-border bg-card">
                  <div className="flex items-start gap-4 mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedEmail(null)}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-4">{selectedEmail.subject}</h1>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">From:</span>
                          <span>{selectedEmail.from}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">To:</span>
                          <span>{selectedEmail.to}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Date:</span>
                          <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReply}
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(selectedEmail.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                  </div>

                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachments ({selectedEmail.attachments.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedEmail.attachments.map((attachment) => (
                          <Card key={attachment.id} className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{attachment.name}</p>
                                <p className="text-xs text-muted-foreground">{attachment.size}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                asChild
                              >
                                <a href={attachment.url} download>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                      <Button variant="outline" className="mt-4">
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                <Mail className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a message to read</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>New Message</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setComposeOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From</label>
                <Select value={fromEmail} onValueChange={setFromEmail}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sender" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOWED_FROM.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To</label>
                <Input
                  placeholder="recipient@example.com, second@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>

              {showCcBcc && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">CC</label>
                    <Input
                      placeholder="cc@example.com"
                      value={composeData.cc}
                      onChange={(e) => setComposeData(prev => ({ ...prev, cc: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">BCC</label>
                    <Input
                      placeholder="bcc@example.com"
                      value={composeData.bcc}
                      onChange={(e) => setComposeData(prev => ({ ...prev, bcc: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {!showCcBcc && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowCcBcc(true)}
                  className="p-0 h-auto"
                >
                  Add CC/BCC
                </Button>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={10}
                  value={composeData.body}
                  onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                  className="resize-none"
                />
              </div>

              {composeData.attachments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <div className="space-y-2">
                    {composeData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm flex-1">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setComposeData(prev => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileAttachment}
                  />
                  <Button variant="outline" type="button" asChild>
                    <span>
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach Files
                    </span>
                  </Button>
                </label>
                <Button
                  variant="ghost"
                  onClick={() => setComposeOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-8">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            © 2025 TaskLynk. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <span className="text-muted-foreground">|</span>
            <a href="mailto:tasklynk01@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
              tasklynk01@gmail.com
            </a>
            <span className="text-muted-foreground">|</span>
            <a href="mailto:support@tasklynk.co.ke" className="text-primary hover:text-secondary transition-colors font-medium">
              support@tasklynk.co.ke
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}