import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth, User } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Search } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ContactListProps {
  onSelectContact: (contactId: number) => void;
  activeContactId: number | null;
}

export default function ContactList({ onSelectContact, activeContactId }: ContactListProps) {
  const { user } = useAuth();
  const { contactStatuses } = useSocket();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [newContactUsername, setNewContactUsername] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery<User[]>({
    queryKey: ['/api/contacts'],
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactUsername: string) => {
      const res = await apiRequest('POST', '/api/contacts', { contactUsername });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setNewContactUsername('');
      setIsAddContactOpen(false);
      toast({
        title: 'Contact added',
        description: 'The contact has been added to your list',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact',
        variant: 'destructive',
      });
    },
  });

  // Handle add contact form submission
  const handleAddContact = (e: FormEvent) => {
    e.preventDefault();
    if (newContactUsername.trim()) {
      addContactMutation.mutate(newContactUsername);
    }
  };

  // Filter contacts by search query
  const filteredContacts = contacts?.filter(contact => 
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary">
              <Edit className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContact} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  value={newContactUsername}
                  onChange={(e) => setNewContactUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <Button type="submit" className="w-full" disabled={addContactMutation.isPending}>
                {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Search */}
      <div className="flex items-center px-3 py-1.5 rounded-full bg-background mb-4">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <Input 
          type="text" 
          placeholder="Search contacts" 
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Contact List */}
      <div className="space-y-1 mt-3 flex-1 overflow-y-auto">
        {isLoading ? (
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="flex items-center p-2 rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-3 flex-1">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))
        ) : filteredContacts?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No contacts found' : 'No contacts yet'}
          </div>
        ) : (
          filteredContacts?.map((contact) => (
            <div 
              key={contact.id} 
              className={`flex items-center p-2 rounded-lg hover:bg-background cursor-pointer transition-colors ${activeContactId === contact.id ? 'bg-background' : ''}`}
              onClick={() => onSelectContact(contact.id)}
            >
              <div className="relative">
                <Avatar>
                  {contact.profilePicture ? (
                    <AvatarImage src={contact.profilePicture} alt={contact.fullName} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(contact.fullName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span 
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                    contactStatuses[contact.id] ? 'bg-[#31A24C]' : 'bg-[#65676B]'
                  }`}
                ></span>
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">{contact.fullName}</h3>
                  {/* We would show last message time here */}
                  <span className="text-xs text-muted-foreground">
                    {contact.lastActive ? new Date(contact.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {/* This would be the last message */}
                  {contact.username}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
