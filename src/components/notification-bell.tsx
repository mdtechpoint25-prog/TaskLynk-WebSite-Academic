"use client";

import { Bell, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Notification {
  id: number;
  userId: number;
  jobId?: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface MessageCounts {
  clientMessages?: number;
  freelancerMessages?: number;
  unreadMessages?: number;
  totalMessages?: number;
}

interface JobMessage {
  id: number;
  jobId: number;
  senderId: number;
  senderName: string;
  senderRole?: string;
  content: string;
  adminApproved: boolean;
  createdAt: string;
  jobTitle?: string;
  jobDisplayId?: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCounts, setMessageCounts] = useState<MessageCounts>({});
  const [jobMessages, setJobMessages] = useState<JobMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const authHeaders = () => {
    if (typeof window === 'undefined') return {} as HeadersInit;
    const token = localStorage.getItem('bearer_token');
    return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=20`, {
        headers: { ...authHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.filter((n: Notification) => !n.read));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${user.id}`, {
        headers: { ...authHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch message counts
  const fetchMessageCounts = async () => {
    if (!user?.id || !user?.role) return;

    try {
      const response = await fetch(`/api/notifications/message-counts?userId=${user.id}&role=${user.role}`, {
        headers: { ...authHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        setMessageCounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch message counts:', error);
    }
  };

  // Fetch recent job messages for this user
  const fetchJobMessages = async () => {
    if (!user?.id || !user?.role) return;

    try {
      // For admin/manager: fetch unapproved messages
      if (user.role === 'admin' || user.role === 'manager') {
        const jobsRes = await fetch('/api/jobs', { 
          headers: { ...authHeaders() },
          cache: 'no-store' 
        });
        
        if (!jobsRes.ok) return;
        
        const jobs = await jobsRes.json();
        const recentJobs = jobs.slice(0, 10); // Limit to 10 most recent jobs
        
        const messagesPromises = recentJobs.map(async (job: any) => {
          const msgRes = await fetch(`/api/jobs/${job.id}/messages?userRole=${user.role}`, {
            headers: { ...authHeaders() },
            cache: 'no-store'
          });
          
          if (!msgRes.ok) return [];
          
          const messages = await msgRes.json();
          return messages
            .filter((m: any) => !m.adminApproved)
            .map((m: any) => ({
              ...m,
              jobTitle: job.title,
              jobDisplayId: job.displayId
            }));
        });
        
        const allMessages = await Promise.all(messagesPromises);
        const flatMessages = allMessages.flat().slice(0, 20); // Limit to 20 total messages
        setJobMessages(flatMessages);
      }
      // For client/freelancer: fetch approved messages from others
      else if (user.role === 'client' || user.role === 'account_owner' || user.role === 'freelancer') {
        const jobsRes = await fetch('/api/jobs', { 
          headers: { ...authHeaders() },
          cache: 'no-store' 
        });
        
        if (!jobsRes.ok) return;
        
        const jobs = await jobsRes.json();
        
        // Filter jobs where user is involved
        const relevantJobs = jobs.filter((job: any) => {
          if (user.role === 'client' || user.role === 'account_owner') {
            return job.clientId === user.id;
          } else {
            return job.assignedFreelancerId === user.id;
          }
        }).slice(0, 10);
        
        const messagesPromises = relevantJobs.map(async (job: any) => {
          const msgRes = await fetch(`/api/jobs/${job.id}/messages?userRole=${user.role}`, {
            headers: { ...authHeaders() },
            cache: 'no-store'
          });
          
          if (!msgRes.ok) return [];
          
          const messages = await msgRes.json();
          return messages
            .filter((m: any) => m.adminApproved && m.senderId !== user.id)
            .map((m: any) => ({
              ...m,
              jobTitle: job.title,
              jobDisplayId: job.displayId
            }));
        });
        
        const allMessages = await Promise.all(messagesPromises);
        const flatMessages = allMessages.flat().slice(0, 20);
        setJobMessages(flatMessages);
      }
    } catch (error) {
      console.error('Failed to fetch job messages:', error);
    }
  };

  // Mark notification as read and remove from list
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { ...authHeaders() },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle notification click with navigation
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.jobId) {
      if (user?.role === 'admin') {
        router.push(`/admin/jobs/${notification.jobId}`);
      } else if (user?.role === 'client' || user?.role === 'account_owner') {
        router.push(`/client/jobs/${notification.jobId}`);
      } else if (user?.role === 'freelancer') {
        router.push(`/freelancer/jobs/${notification.jobId}`);
      } else if (user?.role === 'manager') {
        router.push(`/manager/jobs/${notification.jobId}`);
      }
    }
  };

  // Handle message click - navigate to order page
  const handleMessageClick = (message: JobMessage) => {
    if (user?.role === 'admin') {
      router.push(`/admin/jobs/${message.jobId}`);
    } else if (user?.role === 'client' || user?.role === 'account_owner') {
      router.push(`/client/jobs/${message.jobId}`);
    } else if (user?.role === 'freelancer') {
      router.push(`/freelancer/jobs/${message.jobId}`);
    } else if (user?.role === 'manager') {
      router.push(`/manager/jobs/${message.jobId}`);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders() },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time polling
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();
    fetchUnreadCount();
    fetchMessageCounts();
    fetchJobMessages();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
      fetchMessageCounts();
      fetchJobMessages();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  // Get notification icon color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'account_approved':
        return 'text-green-600 dark:text-green-400';
      case 'account_rejected':
        return 'text-red-600 dark:text-red-400';
      case 'job_assigned':
      case 'order_delivered':
        return 'text-blue-600 dark:text-blue-400';
      case 'payment_received':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'revision_requested':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Calculate total badge count (notifications + messages)
  const getTotalBadgeCount = () => {
    let total = unreadCount;
    
    if (user?.role === 'admin' || user?.role === 'manager') {
      total += (messageCounts.clientMessages || 0) + (messageCounts.freelancerMessages || 0);
    } else {
      total += (messageCounts.unreadMessages || 0);
    }
    
    return total;
  };

  // Filter messages by sender role for admin/manager
  const getFilteredMessages = (filter: string) => {
    if (filter === 'all') return jobMessages;
    if (filter === 'client') return jobMessages.filter(m => m.senderRole === 'client' || m.senderRole === 'account_owner');
    if (filter === 'freelancer') return jobMessages.filter(m => m.senderRole === 'freelancer');
    return jobMessages;
  };

  const totalBadgeCount = getTotalBadgeCount();
  const clientMessagesCount = messageCounts.clientMessages || 0;
  const freelancerMessagesCount = messageCounts.freelancerMessages || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalBadgeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-semibold">
              {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-lg">Notifications & Messages</h3>
          {totalBadgeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="h-8"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Tabs for Admin/Manager to filter by sender role */}
        {(user?.role === 'admin' || user?.role === 'manager') && jobMessages.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mx-4 mb-2">
                <TabsTrigger value="all" className="text-xs">
                  All
                  {(clientMessagesCount + freelancerMessagesCount) > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                      {clientMessagesCount + freelancerMessagesCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="client" className="text-xs">
                  Client
                  {clientMessagesCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                      {clientMessagesCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="freelancer" className="text-xs">
                  Freelancer
                  {freelancerMessagesCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                      {freelancerMessagesCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        )}

        {/* Message counts for client/freelancer */}
        {(user?.role === 'client' || user?.role === 'account_owner' || user?.role === 'freelancer') && messageCounts.unreadMessages! > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                  {messageCounts.unreadMessages}
                </span>
                <span className="text-xs font-semibold">New Messages</span>
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {/* Show job messages first */}
          {jobMessages.length > 0 && (
            <>
              <div className="px-4 py-2 bg-primary/5">
                <p className="text-xs font-semibold text-primary flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {(user?.role === 'admin' || user?.role === 'manager') 
                    ? `${activeTab === 'all' ? 'All' : activeTab === 'client' ? 'Client' : 'Freelancer'} Messages` 
                    : 'Recent Messages'}
                </p>
              </div>
              {getFilteredMessages(activeTab).map((message) => (
                <DropdownMenuItem
                  key={`msg-${message.id}`}
                  className="flex items-start gap-3 p-4 cursor-pointer focus:bg-muted"
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="mt-1 text-blue-600 dark:text-blue-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">
                        {message.senderName}
                        {message.senderRole && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({message.senderRole})
                          </span>
                        )}
                      </p>
                      {(user?.role === 'admin' || user?.role === 'manager') && !message.adminApproved && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">Pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {message.jobDisplayId && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {message.jobDisplayId}
                        </Badge>
                      )}
                      {message.jobTitle && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {message.jobTitle}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
              {notifications.length > 0 && <DropdownMenuSeparator />}
            </>
          )}

          {/* Show system notifications */}
          {notifications.length > 0 && (
            <>
              <div className="px-4 py-2 bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  System Notifications
                </p>
              </div>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={`notif-${notification.id}`}
                  className="flex items-start gap-3 p-4 cursor-pointer focus:bg-muted"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>
                      <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {/* Empty state */}
          {notifications.length === 0 && jobMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
              <p className="text-xs mt-1">All caught up!</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};