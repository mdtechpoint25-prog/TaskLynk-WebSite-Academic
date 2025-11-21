"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  jobId: number | null;
  content: string;
  fileUrl: string | null;
  adminApproved: boolean;
  createdAt: string;
};

type Conversation = Message;

export default function AdminMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const hasCheckedAuth = useRef(false);

  // Auth check - runs once
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchConversations();
    }
  }, [loading, user, router]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch('/api/messages?adminApproved=false');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleApprove = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        toast.success('Message approved successfully');
        fetchConversations();
      } else {
        toast.error('Failed to approve message');
      }
    } catch (error) {
      console.error('Failed to approve message:', error);
      toast.error('Failed to approve message');
    }
  };

  const handleReject = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });

      if (response.ok) {
        toast.success('Message rejected');
        fetchConversations();
      } else {
        toast.error('Failed to reject message');
      }
    } catch (error) {
      console.error('Failed to reject message:', error);
      toast.error('Failed to reject message');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Global overview and moderation
        </p>
      </div>

      {/* Global overview */}
      <Card className="mb-6 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Orders Messages Overview
          </CardTitle>
          <CardDescription>Pending vs delivered across all orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConversations ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending messages right now</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Badge variant="destructive" className="rounded-xl">Pending from Clients: {conversations.length}</Badge>
              <Badge variant="outline" className="rounded-xl">Total Pending: {conversations.length}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Pending Messages</CardTitle>
          <CardDescription>
            Messages awaiting admin approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConversations ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No pending messages
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((message) => (
                <div key={message.id} className="border rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        From User #{message.senderId} to User #{message.receiverId}
                      </p>
                      {message.jobId && (
                        <Badge variant="outline" className="rounded-xl">Job #{message.jobId}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <p className="mb-4 text-sm">{message.content}</p>
                  {message.fileUrl && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="rounded-xl">Attachment: {message.fileUrl}</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(message.id)}
                      className="rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(message.id)}
                      className="rounded-xl"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}