import React, { memo, useRef, useEffect } from 'react';
import { Paperclip, Loader2, X, Send, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ChatSectionProps {
  messages: Message[];
  userId?: number;
  newMessage: string;
  onMessageChange: (msg: string) => void;
  selectedFiles: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSendMessage: () => void;
  sending: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ChatMessage = memo(({
  msg,
  userId,
  onFileDownload,
}: {
  msg: Message;
  userId?: number;
  onFileDownload: (url: string, fileName: string) => void;
}) => {
  const isSent = msg.senderId === userId;
  const messageParts = msg.message.split(/(\[.*?\]\(\/api\/files\/download\/\d+\))/g);

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] ${isSent ? 'text-right' : 'text-left'}`}>
        {!isSent && (
          <p className="text-xs font-semibold mb-1 text-muted-foreground">
            {msg.senderName}
          </p>
        )}
        <div className={`inline-block px-4 py-2 rounded-2xl ${
          isSent 
            ? 'bg-blue-600 text-white' 
            : 'bg-green-600 text-white'
        }`}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {messageParts.map((part, idx) => {
              const linkMatch = part.match(/\[(.*?)\]\((\/api\/files\/download\/\d+)\)/);
              if (linkMatch) {
                const [, fileName, downloadUrl] = linkMatch;
                return (
                  <div key={idx} className="mt-1">
                    <button
                      onClick={() => onFileDownload(downloadUrl, fileName)}
                      className="text-white underline hover:text-blue-200 flex items-center gap-1 cursor-pointer"
                    >
                      📎 {fileName}
                    </button>
                  </div>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
        </p>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

const shortenFileName = (name: string, maxLength: number = 30) => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return shortened + '.' + ext;
};

export const ChatSection = memo(({
  messages,
  userId,
  newMessage,
  onMessageChange,
  selectedFiles,
  onFileSelect,
  onRemoveFile,
  onSendMessage,
  sending,
  uploading,
  fileInputRef,
}: ChatSectionProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileDownload = (downloadUrl: string, fileName: string) => {
    const role = 'client';
    const uid = Number(userId || 0);
    const urlWithParams = downloadUrl.includes('?')
      ? `${downloadUrl}&role=${role}&userId=${uid}`
      : `${downloadUrl}?role=${role}&userId=${uid}`;
    window.open(urlWithParams, '_blank');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-muted/30">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start a conversation below</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  userId={userId}
                  onFileDownload={handleFileDownload}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/50">
            <p className="text-xs font-semibold mb-2">Attachments ({selectedFiles.length}/10)</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs bg-background p-1 rounded">
                  <Paperclip className="w-3 h-3" />
                  <span className="flex-1 truncate">{shortenFileName(file.name, 30)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveFile(index)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && selectedFiles.length === 0) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFileSelect}
              className="hidden"
              accept="*/*"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedFiles.length >= 10}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files ({selectedFiles.length}/10)
            </Button>
            
            {selectedFiles.length > 0 ? (
              <Button
                onClick={onSendMessage}
                disabled={sending || uploading}
                className="ml-auto"
              >
                {sending || uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Upload & Send</>
                )}
              </Button>
            ) : (
              <Button
                onClick={onSendMessage}
                disabled={sending || !newMessage.trim()}
                className="ml-auto"
              >
                <Send className="w-4 h-4 mr-2" />Send
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ChatSection.displayName = 'ChatSection';
