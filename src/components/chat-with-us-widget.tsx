"use client";

import { useState } from 'react';
import { MessageCircle, X, Send, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function ChatWithUsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!senderName.trim() || !senderEmail.trim()) {
      toast.error('Please provide your name and email');
      return;
    }

    setIsSending(true);
    try {
      // Get admin user ID (assuming admin ID is 1, or we can fetch from API)
      const adminId = 1; // This should be fetched from an API or config
      
      // Create a guest user ID based on email hash (for tracking)
      const guestId = 0; // Guest users will have ID 0

      const messageContent = `Name: ${senderName}
Email: ${senderEmail}
Phone: ${senderPhone || 'Not provided'}

${message}`;

      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderName,
          senderEmail,
          senderPhone,
          content: messageContent,
          isGuest: true,
        }),
      });

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setMessage('');
        setSenderName('');
        setSenderEmail('');
        setSenderPhone('');
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try WhatsApp instead.');
    } finally {
      setIsSending(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phone = '254701066845';
    const text = encodeURIComponent('Hello, I need assistance with TaskLynk.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all animate-pulse hover:animate-none"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Expanded Chat Card */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
          <Card className="shadow-2xl border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Chat with Us</CardTitle>
                <CardDescription className="text-sm">
                  Send us a message or call directly
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Message Form */}
              <div className="space-y-2">
                <Input
                  placeholder="Your Name *"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={isSending}
                />
                <Input
                  type="email"
                  placeholder="Your Email *"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  disabled={isSending}
                />
                <Input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  disabled={isSending}
                />
                <Textarea
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={isSending}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  className="w-full gap-2"
                  disabled={isSending}
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or contact directly
                  </span>
                </div>
              </div>

              {/* Quick Contact Options */}
              <div className="space-y-2">
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full justify-start gap-3 h-10"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">WhatsApp: +254 701 066 845</span>
                </Button>
                <Button
                  onClick={() => window.open('tel:+254701066845', '_self')}
                  className="w-full justify-start gap-3 h-10"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">Call: +254 701 066 845</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
