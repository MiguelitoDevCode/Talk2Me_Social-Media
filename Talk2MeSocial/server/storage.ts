import { 
  users, contacts, messages, 
  type User, type InsertUser, type UpdateUser,
  type Contact, type InsertContact,
  type Message, type InsertMessage
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  setUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined>;

  // Contact operations
  getContacts(userId: number): Promise<User[]>;
  addContact(contact: InsertContact): Promise<Contact>;
  removeContact(userId: number, contactId: number): Promise<boolean>;
  
  // Message operations
  getMessages(userId: number, contactId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  
  // Search operations
  searchUsers(query: string): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private messages: Map<number, Message>;
  currentUserId: number;
  currentContactId: number;
  currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentContactId = 1;
    this.currentMessageId = 1;
    
    // Add some initial users for testing
    this.createUser({
      username: "alex",
      password: "password123",
      fullName: "Alex Morgan",
      email: "alex@example.com"
    });
    
    this.createUser({
      username: "sarah",
      password: "password123",
      fullName: "Sarah Johnson",
      email: "sarah@example.com"
    });
    
    this.createUser({
      username: "michael",
      password: "password123",
      fullName: "Michael Chen",
      email: "michael@example.com"
    });
    
    this.createUser({
      username: "lisa",
      password: "password123",
      fullName: "Lisa Wong",
      email: "lisa@example.com"
    });
    
    this.createUser({
      username: "robert",
      password: "password123",
      fullName: "Robert Smith",
      email: "robert@example.com"
    });
    
    // Add contacts between users
    this.addContact({ userId: 1, contactId: 2 });
    this.addContact({ userId: 1, contactId: 3 });
    this.addContact({ userId: 1, contactId: 4 });
    this.addContact({ userId: 2, contactId: 1 });
    this.addContact({ userId: 3, contactId: 1 });
    this.addContact({ userId: 4, contactId: 1 });
    
    // Add some sample messages
    this.createMessage({ senderId: 2, receiverId: 1, content: "Hey, how's your project going?" });
    this.createMessage({ senderId: 1, receiverId: 2, content: "It's going really well! I just finished the main design yesterday." });
    this.createMessage({ senderId: 2, receiverId: 1, content: "Awesome! I'd love to see it when it's ready." });
    this.createMessage({ senderId: 3, receiverId: 1, content: "Can we meet tomorrow at 2pm?" });
    this.createMessage({ senderId: 4, receiverId: 1, content: "Thanks for your help yesterday!" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isOnline: false, 
      lastActive: timestamp,
      bio: null,
      profilePicture: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isOnline,
      lastActive: isOnline ? user.lastActive : new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getContacts(userId: number): Promise<User[]> {
    const contactIds = Array.from(this.contacts.values())
      .filter(contact => contact.userId === userId)
      .map(contact => contact.contactId);
    
    return contactIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  async addContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = { ...insertContact, id };
    this.contacts.set(id, contact);
    return contact;
  }

  async removeContact(userId: number, contactId: number): Promise<boolean> {
    const contactToRemove = Array.from(this.contacts.values()).find(
      contact => contact.userId === userId && contact.contactId === contactId
    );
    
    if (contactToRemove) {
      this.contacts.delete(contactToRemove.id);
      return true;
    }
    return false;
  }

  async getMessages(userId: number, contactId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userId && message.receiverId === contactId) || 
        (message.senderId === contactId && message.receiverId === userId)
      )
      .sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const timestamp = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp,
      isRead: false
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    Array.from(this.messages.values())
      .filter(message => 
        message.senderId === senderId && 
        message.receiverId === receiverId && 
        !message.isRead
      )
      .forEach(message => {
        message.isRead = true;
        this.messages.set(message.id, message);
      });
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery) || 
      user.fullName.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const storage = new MemStorage();
