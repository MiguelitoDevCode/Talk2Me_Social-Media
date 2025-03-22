import React, { createContext, useState, useContext, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './auth';
import { queryClient } from './queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface SocketContextType {
  connected: boolean;
  sendMessage: (receiverId: number, content: string) => void;
  contactStatuses: Record<number, boolean>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [contactStatuses, setContactStatuses] = useState<Record<number, boolean>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;

      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected');
      };

      socketRef.current.onclose = (event) => {
        setConnected(false);
        console.log('WebSocket disconnected', event.code, event.reason);
        
        // Try to reconnect after a delay if the connection was lost unexpectedly
        if (event.code !== 1000) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              // Handle new incoming message
              const message = data.message as Message;
              queryClient.invalidateQueries({ queryKey: [`/api/messages/${message.senderId}`] });
              
              // Show notification
              toast({
                title: 'New Message',
                description: `From ${message.senderId}: ${message.content.slice(0, 30)}${message.content.length > 30 ? '...' : ''}`
              });
              break;
              
            case 'message_sent':
              // Handle confirmation of sent message
              const sentMessage = data.message as Message;
              queryClient.invalidateQueries({ queryKey: [`/api/messages/${sentMessage.receiverId}`] });
              break;
              
            case 'status':
              // Handle contact status change
              setContactStatuses(prev => ({ 
                ...prev, 
                [data.userId]: data.isOnline 
              }));
              break;
              
            case 'error':
              console.error('WebSocket error from server:', data.message);
              toast({
                title: 'Error',
                description: data.message,
                variant: 'destructive',
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user, toast]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((receiverId: number, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to server. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'message',
      receiverId,
      content
    }));
  }, [toast]);

  const contextValue: SocketContextType = {
    connected,
    sendMessage,
    contactStatuses
  };
  
  // Return the provider component
  return React.createElement(
    SocketContext.Provider,
    { value: contextValue },
    children
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
