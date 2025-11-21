/**
 * Real-time Notifications Client
 * Handles WebSocket/SSE connection for live notifications
 */

import React from 'react';

type NotificationCallback = (notification: any) => void;

class NotificationsClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private callbacks: NotificationCallback[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      this.url = `${protocol}://${host}/api/notifications/ws`;
    }
  }

  subscribe(userId: number, callback: NotificationCallback): () => void {
    this.userId = userId;
    this.callbacks.push(callback);
    
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
      if (this.callbacks.length === 0) {
        this.disconnect();
      }
    };
  }

  private connect(): void {
    if (!this.url || typeof window === 'undefined') return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ Notifications connected');
        this.reconnectAttempts = 0;
        
        if (this.userId) {
          this.ws?.send(JSON.stringify({
            type: 'subscribe',
            userId: this.userId,
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.callbacks.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error('Callback error:', error);
            }
          });
        } catch (error) {
          console.error('Parse error:', error);
        }
      };

      this.ws.onerror = () => {
        console.error('❌ Notifications error');
      };

      this.ws.onclose = () => {
        console.warn('⚠️ Notifications disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }

  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async sendNotification(userId: number, notification: any): Promise<void> {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...notification }),
      });
    } catch (error) {
      console.error('Send error:', error);
    }
  }
}

export const notificationsClient = typeof window !== 'undefined' 
  ? new NotificationsClient() 
  : null;

export function useNotifications(userId: number | null) {
  const [notifications, setNotifications] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!userId || !notificationsClient) return;

    const unsubscribe = notificationsClient.subscribe(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, [userId]);

  return notifications;
}
