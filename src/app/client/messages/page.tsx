"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  adminApproved: boolean;
  createdAt: string;
  senderName?: string;
  receiverName?: string;
};

export default function ClientMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Unread overview and per-order indicators
  const [unreadOverview, setUnreadOverview] = useState<number | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersWithIndicators, setOrdersWithIndicators] = useState<{
    id: number;
    title: string;
    displayId?: string;
    delivered: number;
    lastAt?: string;
  }[]>([]);

  useEffect(() => {
    if (!loading) {
      // Allow both clients and account owners
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else {
        fetchMessages();
        fetchUnreadOverview();
        fetchOrdersWithIndicators();
      }
    }
  }, [user, loading, router]);

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchUnreadOverview = async () => {
    try {
      if (!user) return;
      const res = await fetch(`/api/notifications/message-counts?userId=${user.id}&role=client`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUnreadOverview(typeof data.unreadMessages === 'number' ? data.unreadMessages : 0);
      }
    } catch (e) {
      console.error('Failed to fetch unread overview', e);
    }
  };

  const fetchOrdersWithIndicators = async () => {
    try {
      setOrdersLoading(true);
      if (!user) return;
      const jobsRes = await fetch('/api/jobs', { cache: 'no-store' });
      if (!jobsRes.ok) {
        setOrdersWithIndicators([]);
        return;
      }
      const jobsData: { id: number; title: string; displayId?: string; clientId?: number }[] = await jobsRes.json();
      const myJobs = (jobsData || []).filter((j) => j.clientId === user.id).slice(0, 20);

      const results = await Promise.all(
        myJobs.map(async (job) => {
          const msgsRes = await fetch(`/api/jobs/${job.id}/messages?userRole=client&limit=500`, { cache: 'no-store' });
          if (!msgsRes.ok) {
            return { id: job.id, title: job.title, displayId: job.displayId, delivered: 0 };
          }
          const msgs: { adminApproved: boolean; createdAt: string }[] = await msgsRes.json();
          const delivered = msgs.filter((m) => m.adminApproved).length;
          const lastAt = msgs.at(-1)?.createdAt;
          return { id: job.id, title: job.title, displayId: job.displayId, delivered, lastAt };
        })
      );

      setOrdersWithIndicators(results);
    } catch (e) {
      console.error('Failed to fetch orders indicators', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const approvedMessages = messages.filter(m => m.adminApproved);

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with freelancers and admins
        </p>
      </div>

      {/* Unread overview */}
      <Card className="mb-6 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Unread Messages Overview
          </CardTitle>
          <CardDescription>Only approved messages count as unread</CardDescription>
        </CardHeader>
        <CardContent>
          {unreadOverview === null ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant={unreadOverview > 0 ? 'destructive' : 'secondary'} className="rounded-xl">
                Unread: {unreadOverview}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders with message indicators */}
      <Card className="mb-6 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Your Orders with Messages
          </CardTitle>
          <CardDescription>Quick links to order chats</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : ordersWithIndicators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders found</p>
          ) : (
            <div className="space-y-2">
              {ordersWithIndicators.map((o) => (
                <Link key={o.id} href={`/client/jobs/${o.id}`} className="block border rounded-xl p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{o.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {o.displayId && <Badge variant="outline" className="font-mono rounded-xl">{o.displayId}</Badge>}
                        {o.lastAt && <span>Last: {format(new Date(o.lastAt), 'MMM dd, HH:mm')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="rounded-xl">Delivered: {o.delivered}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Your Messages</CardTitle>
          <CardDescription>
            All messages are moderated by admin before delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMessages ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : approvedMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-xl max-w-[70%] ${
                      message.senderId === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium">
                        {message.senderId === user.id ? 'You' : message.senderName}
                      </span>
                      <span className="text-xs opacity-70 ml-3">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
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