"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  adminApproved: boolean;
  createdAt: string;
  senderName?: string;
  receiverName?: string;
  jobId?: number;
  fileUrl?: string;
};

export default function FreelancerMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unread overview and per-order indicators
  const [unreadOverview, setUnreadOverview] = useState<number | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersWithIndicators, setOrdersWithIndicators] = useState<{
    id: number;
    title: string;
    displayId?: string;
    pending: number;
    delivered: number;
    lastAt?: string;
  }[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else {
        fetchMessages();
        fetchUnreadOverview();
        fetchOrdersWithIndicators();
      }
    }
  }, [user, loading, router]);

  const fetchMessages = async () => {
    if (!user?.id) return;
    const controller = new AbortController();
    try {
      setError(null);
      setLoadingMessages(true);
      // API only supports AND conditions; fetch sent and received separately then merge
      const [sentRes, recvRes] = await Promise.all([
        fetch(`/api/messages?senderId=${user.id}&adminApproved=true`, { signal: controller.signal }),
        fetch(`/api/messages?receiverId=${user.id}&adminApproved=true`, { signal: controller.signal }),
      ]);

      const sent = sentRes.ok ? ((await sentRes.json()) as Message[]) : [];
      const recv = recvRes.ok ? ((await recvRes.json()) as Message[]) : [];

      // Merge, dedupe by id, ensure only messages where user is sender or receiver
      const map = new Map<number, Message>();
      [...sent, ...recv]
        .filter((m) => m.adminApproved && (m.senderId === user.id || m.receiverId === user.id))
        .forEach((m) => map.set(m.id, m));

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setMessages(merged);
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Failed to fetch messages:', err);
        setError('Failed to load messages. Please try again.');
      }
    } finally {
      setLoadingMessages(false);
    }
    return () => controller.abort();
  };

  const fetchUnreadOverview = async () => {
    try {
      if (!user) return;
      const res = await fetch(`/api/notifications/message-counts?userId=${user.id}&role=freelancer`, { cache: 'no-store' });
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
      const jobsData: { id: number; title: string; displayId?: string; assignedFreelancerId?: number }[] = await jobsRes.json();
      const myJobs = (jobsData || []).filter((j) => j.assignedFreelancerId === user.id).slice(0, 20);

      const results = await Promise.all(
        myJobs.map(async (job) => {
          const msgsRes = await fetch(`/api/jobs/${job.id}/messages?userRole=freelancer&limit=500`, { cache: 'no-store' });
          if (!msgsRes.ok) {
            return { id: job.id, title: job.title, displayId: job.displayId, pending: 0, delivered: 0 };
          }
          const msgs: { adminApproved: boolean; createdAt: string }[] = await msgsRes.json();
          const pending = msgs.filter((m) => !m.adminApproved).length;
          const delivered = msgs.filter((m) => m.adminApproved).length;
          const lastAt = msgs.at(-1)?.createdAt;
          return { id: job.id, title: job.title, displayId: job.displayId, pending, delivered, lastAt };
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

  const approvedMessages = messages.filter((m) => m.adminApproved);

  return (
    <div className="w-full p-3 md:p-4 lg:p-5">
      {/* Floating Back Button */}
      <Link 
        href="/freelancer/dashboard"
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="absolute right-full mr-3 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Back to Dashboard
        </span>
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with clients and admins
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
                <Link key={o.id} href={`/freelancer/jobs/${o.id}`} className="block border rounded-xl p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{o.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {o.displayId && <Badge variant="outline" className="font-mono rounded-xl">{o.displayId}</Badge>}
                        {o.lastAt && <span>Last: {format(new Date(o.lastAt), 'MMM dd, HH:mm')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={o.pending > 0 ? 'destructive' : 'secondary'} className="rounded-xl">Pending: {o.pending}</Badge>
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
          ) : error ? (
            <div className="text-center py-12 text-red-600 text-sm">{error}</div>
          ) : approvedMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedMessages.map((message) => {
                const isYou = message.senderId === user.id;
                const senderLabel = isYou ? 'You' : message.senderName || `User #${message.senderId}`;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-4 rounded-xl max-w-[70%] ${
                        isYou ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium">
                          {senderLabel}
                        </span>
                        <span className="text-xs opacity-70 ml-3">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {message.fileUrl && (
                        <div className="mt-2">
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                          >
                            View attachment
                          </a>
                        </div>
                      )}
                      {message.jobId && (
                        <div className="mt-2">
                          <Link
                            href={`/freelancer/jobs/${message.jobId}`}
                            className="text-xs underline"
                          >
                            Go to related job
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}