import { useState, useEffect } from 'react';
import { useMediaQuery } from "@/hooks/use-mobile";
import Header from '@/components/layout/header';
import ContactList from '@/components/chat/contact-list';
import ChatArea from '@/components/chat/chat-area';
import { useAuth } from '@/lib/auth';
import { SocketProvider } from '@/lib/socket';
import { MessageSquare, Users, Search, User } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ChatPage() {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [showMobileContacts, setShowMobileContacts] = useState(false);
  const [, setLocation] = useLocation();

  // Reset mobile UI state when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setShowMobileContacts(false);
    }
  }, [isMobile]);

  // Handle mobile navigation
  const handleNavClick = (screen: 'chats' | 'profile') => {
    if (screen === 'chats') {
      setShowMobileContacts(true);
    } else if (screen === 'profile') {
      setLocation('/profile');
    }
  };

  // Clear active contact on mobile when showing contacts list
  useEffect(() => {
    if (showMobileContacts && isMobile) {
      setActiveContactId(null);
    }
  }, [showMobileContacts, isMobile]);

  if (!user) return null;

  return (
    <SocketProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Contact sidebar - hidden on mobile unless explicitly shown */}
          <div className={`${isMobile ? (showMobileContacts ? 'block' : 'hidden') : 'block'} ${isMobile ? 'w-full' : 'w-full sm:w-80 lg:w-[270px]'} bg-surface shadow-sm z-10`}>
            <ContactList 
              onSelectContact={(contactId) => {
                setActiveContactId(contactId);
                if (isMobile) {
                  setShowMobileContacts(false);
                }
              }}
              activeContactId={activeContactId}
            />
          </div>
          
          {/* Chat area - shown on mobile when contacts are hidden */}
          <div className={`${isMobile && showMobileContacts ? 'hidden' : 'flex'} flex-1 flex-col bg-background`}>
            <ChatArea 
              activeContactId={activeContactId} 
              onMenuClick={() => setShowMobileContacts(true)}
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isMobile && (
          <nav className="bg-surface border-t border-border py-1">
            <div className="flex justify-around">
              <button 
                className={`p-2 ${!showMobileContacts ? 'text-primary' : 'text-muted-foreground'} flex flex-col items-center`}
                onClick={() => setShowMobileContacts(false)}
              >
                <MessageSquare className="h-6 w-6" />
                <span className="text-xs">Chats</span>
              </button>
              <button 
                className={`p-2 ${showMobileContacts ? 'text-primary' : 'text-muted-foreground'} flex flex-col items-center`}
                onClick={() => setShowMobileContacts(true)}
              >
                <Users className="h-6 w-6" />
                <span className="text-xs">People</span>
              </button>
              <button 
                className="p-2 text-muted-foreground flex flex-col items-center"
              >
                <Search className="h-6 w-6" />
                <span className="text-xs">Search</span>
              </button>
              <button 
                className="p-2 text-muted-foreground flex flex-col items-center"
                onClick={() => handleNavClick('profile')}
              >
                <User className="h-6 w-6" />
                <span className="text-xs">Profile</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </SocketProvider>
  );
}
