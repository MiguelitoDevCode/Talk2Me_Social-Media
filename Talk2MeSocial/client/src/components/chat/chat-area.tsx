import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, User } from '@/lib/auth';
import { useSocket, Message } from '@/lib/socket';
import MessageBubble from './message-bubble';
import MessageInput from './message-input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, Info, Phone, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatAreaProps {
  activeContactId: number | null;
  onMenuClick: () => void;
  isMobile: boolean;
}

export default function ChatArea({ activeContactId, onMenuClick, isMobile }: ChatAreaProps) {
  const { user } = useAuth();
  const { sendMessage, contactStatuses } = useSocket();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active contact
  const { data: activeContact, isLoading: contactLoading } = useQuery<User>({
    queryKey: [`/api/user/${activeContactId}`],
    queryFn: async () => {
      const res = await fetch(`/api/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const contacts = await res.json();
      return contacts.find((contact: User) => contact.id === activeContactId);
    },
    enabled: !!activeContactId,
  });

  // Fetch messages with active contact
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${activeContactId}`],
    enabled: !!activeContactId,
  });

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!activeContactId || !messageText.trim()) return;
    
    sendMessage(activeContactId, messageText);
    setMessageText('');
  };

  // Group messages by date
  const groupedMessages = messages?.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Helper to determine if a date is today
  const isToday = (dateStr: string) => {
    const today = new Date().toLocaleDateString();
    return dateStr === today;
  };

  // Helper to determine if a date is yesterday
  const isYesterday = (dateStr: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toLocaleDateString();
  };

  const formatDateLabel = (dateStr: string) => {
    if (isToday(dateStr)) return 'Today';
    if (isYesterday(dateStr)) return 'Yesterday';
    return dateStr;
  };

  // Get contact status
  const isOnline = activeContactId ? contactStatuses[activeContactId] || false : false;

  // Generate initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!activeContactId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary h-8 w-8"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Your Messages</h3>
          <p className="text-muted-foreground">
            Select a contact to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="p-3 bg-surface shadow-sm flex items-center justify-between">
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center">
            {contactLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
              <div className="relative">
                <Avatar>
                  {activeContact?.profilePicture ? (
                    <AvatarImage src={activeContact.profilePicture} alt={activeContact.fullName} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(activeContact?.fullName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${isOnline ? 'bg-[#31A24C]' : 'bg-[#65676B]'}`}></span>
              </div>
            )}
            
            <div className="ml-3">
              {contactLoading ? (
                <>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <h2 className="font-medium">{activeContact?.fullName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? 'Online' : activeContact?.lastActive 
                      ? `Last active ${formatDistanceToNow(new Date(activeContact.lastActive), { addSuffix: true })}`
                      : 'Offline'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-primary">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            <div className="flex mb-4">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <div>
                <Skeleton className="h-16 w-64 rounded-lg mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex justify-end mb-4">
              <div>
                <Skeleton className="h-16 w-64 rounded-lg mb-1" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            </div>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex justify-center my-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages && Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center my-4">
                  <span className="text-xs px-3 py-1 bg-background rounded-full text-muted-foreground border border-border">
                    {formatDateLabel(date)}
                  </span>
                </div>
                
                {dateMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isSent={message.senderId === user?.id}
                    senderName={activeContact?.fullName || ''}
                    senderAvatar={activeContact?.profilePicture}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message Input */}
      <MessageInput
        value={messageText}
        onChange={setMessageText}
        onSend={handleSendMessage}
      />
    </>
  );
}
