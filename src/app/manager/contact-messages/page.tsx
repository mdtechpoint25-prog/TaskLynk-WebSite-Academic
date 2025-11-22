"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Phone, User, Clock, Check, X } from 'lucide-react';

interface ContactMessage {
  id: number;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  content: string;
  status: 'pending' | 'read' | 'resolved';
  isGuest: boolean;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchMessages = async (status?: string) => {
    try {
      const url = status 
        ? `/api/contact-messages?status=${status}` 
        : '/api/contact-messages';
      const response = await fetch(url);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(activeTab === 'all' ? undefined : activeTab);
  }, [activeTab]);

  const updateMessageStatus = async (id: number, newStatus: 'read' | 'resolved') => {
    try {
      const response = await fetch('/api/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Message marked as ${newStatus}`);
        fetchMessages(activeTab === 'all' ? undefined : activeTab);
      } else {
        toast.error('Failed to update message');
      }
    } catch (error) {
      console.error('Failed to update message:', error);
      toast.error('Failed to update message');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">
          Messages from the "Chat with Us" widget
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <p className="text-center py-8">Loading messages...</p>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No {activeTab !== 'all' ? activeTab : ''} messages found
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">{message.senderName}</CardTitle>
                        {getStatusBadge(message.status)}
                        {message.isGuest && (
                          <Badge variant="outline">Guest</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <a href={`mailto:${message.senderEmail}`} className="hover:underline">
                            {message.senderEmail}
                          </a>
                        </div>
                        {message.senderPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${message.senderPhone}`} className="hover:underline">
                              {message.senderPhone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                    {message.content}
                  </div>
                  
                  {message.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {message.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMessageStatus(message.id, 'read')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateMessageStatus(message.id, 'resolved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as Resolved
                      </Button>
                    </div>
                  )}
                  
                  {message.resolvedAt && (
                    <p className="text-xs text-muted-foreground">
                      Resolved on {formatDate(message.resolvedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
