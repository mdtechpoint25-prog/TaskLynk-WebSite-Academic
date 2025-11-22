"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DashboardNav } from '@/components/dashboard-nav';
import { ManagerSidebar } from '@/components/manager-sidebar';

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

export default function ManagerMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

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
      if (!user || user.role !== 'manager') {
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
      const res = await fetch(`/api/notifications/message-counts?userId=${user.id}&role=manager`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const total = (data.clientMessages || 0) + (data.freelancerMessages || 0);
        setUnreadOverview(total);
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
      const jobsData: { id: number; title: string; displayId?: string }[] = await jobsRes.json();
      const allJobs = (jobsData || []).slice(0, 20);

      const results = await Promise.all(
        allJobs.map(async (job) => {
          const msgsRes = await fetch(`/api/jobs/${job.id}/messages?userRole=manager&limit=500`, { cache: 'no-store' });
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const approvedMessages = messages.filter(m => m.adminApproved);

  return (
    <div className="dashboard-container">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 pt-[72px] ml-0 md:ml-64 bg-background transition-all duration-300">
        <div className="p-3 md:p-4 lg:p-5 w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Messages</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage messages across the platform
            </p>
          </div>

          {/* Unread overview */}
          <Card className="mb-6 shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Pending Messages Overview
              </CardTitle>
              <CardDescription>Messages awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {unreadOverview === null ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Badge variant={unreadOverview > 0 ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
                    Pending: {unreadOverview}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders with message indicators */}
          <Card className="mb-6 shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Orders with Messages
              </CardTitle>
              <CardDescription>Quick links to order conversations</CardDescription>
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
                    <Link key={o.id} href={`/manager/jobs/${o.id}`} className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{o.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {o.displayId && <Badge variant="outline" className="font-mono">{o.displayId}</Badge>}
                            {o.lastAt && <span>Last: {format(new Date(o.lastAt), 'MMM dd, HH:mm')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={o.pending > 0 ? 'destructive' : 'secondary'}>Pending: {o.pending}</Badge>
                          <Badge variant="outline">Delivered: {o.delivered}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>All Messages</CardTitle>
              <CardDescription>
                Messages across the platform
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
                      className="border rounded-lg p-4 bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium">
                          {message.senderName || `User #${message.senderId}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {message.jobId && (
                        <div className="mt-2">
                          <Link
                            href={`/manager/jobs/${message.jobId}`}
                            className="text-xs text-primary underline"
                          >
                            View related order
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}