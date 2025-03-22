import { Message } from '@/lib/socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  senderName: string;
  senderAvatar?: string | null;
}

export default function MessageBubble({ message, isSent, senderName, senderAvatar }: MessageBubbleProps) {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (isSent) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-sm shadow-sm">
            <p>{message.content}</p>
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground mt-1 mr-2">{formattedTime}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-4">
      <Avatar className="h-8 w-8 mr-2 self-end">
        {senderAvatar ? (
          <AvatarImage src={senderAvatar} alt={senderName} />
        ) : (
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {getInitials(senderName)}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="max-w-[75%]">
        <div className="bg-surface p-3 rounded-lg rounded-bl-sm shadow-sm">
          <p>{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 ml-2">{formattedTime}</span>
      </div>
    </div>
  );
}
