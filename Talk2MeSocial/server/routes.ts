/**
 * Talk2Me - Une application de messagerie en temps réel
 * Copyright © 2025 MIGUELITO DevCode
 * Tous droits réservés
 */

import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginUserSchema, 
  updateUserSchema,
  insertMessageSchema
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

// Déclaration pour étendre le type Session dans express-session
declare module 'express-session' {
  interface Session {
    userId: number;
  }
}

// Type for the extended WebSocket with userId
interface ExtendedWebSocket extends WebSocket {
  userId?: number;
}

// Type for active user connections
interface ActiveUser {
  userId: number;
  socket: ExtendedWebSocket;
}

// Active user connections store
const activeConnections: ActiveUser[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: "talk2me-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: new SessionStore({
      checkPeriod: 86400000 // 24 hours
    })
  }));

  // Middleware to check authentication
  const checkAuth = (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Create the HTTP server
  const httpServer = createServer(app);

  // Create the WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // API routes
  // User routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const newUser = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = newUser;
      req.session.userId = newUser.id;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      const user = await storage.getUserByUsername(loginData.username);
      
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.session.userId = user.id;
      await storage.setUserOnlineStatus(user.id, true);
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/logout', checkAuth, async (req, res) => {
    const userId = req.session.userId as number;
    await storage.setUserOnlineStatus(userId, false);
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/user', checkAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch('/api/user', checkAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const updateData = updateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Contact routes
  app.get('/api/contacts', checkAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const contacts = await storage.getContacts(userId);
    
    // Remove passwords from contacts
    const contactsWithoutPasswords = contacts.map(contact => {
      const { password, ...contactWithoutPassword } = contact;
      return contactWithoutPassword;
    });
    
    res.json(contactsWithoutPasswords);
  });

  app.post('/api/contacts', checkAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const { contactUsername } = req.body;
    
    if (!contactUsername) {
      return res.status(400).json({ message: "Contact username is required" });
    }
    
    const contactUser = await storage.getUserByUsername(contactUsername);
    if (!contactUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (contactUser.id === userId) {
      return res.status(400).json({ message: "Cannot add yourself as a contact" });
    }
    
    // Check if already a contact
    const contacts = await storage.getContacts(userId);
    if (contacts.some(contact => contact.id === contactUser.id)) {
      return res.status(400).json({ message: "Already in contacts" });
    }
    
    await storage.addContact({ userId, contactId: contactUser.id });
    
    // Also add reverse relationship for demo purposes
    await storage.addContact({ userId: contactUser.id, contactId: userId });
    
    const { password, ...contactWithoutPassword } = contactUser;
    res.status(201).json(contactWithoutPassword);
  });

  app.delete('/api/contacts/:contactId', checkAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    
    const success = await storage.removeContact(userId, contactId);
    if (!success) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    // Also remove reverse relationship
    await storage.removeContact(contactId, userId);
    
    res.json({ message: "Contact removed successfully" });
  });

  // Message routes
  app.get('/api/messages/:contactId', checkAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    
    const messages = await storage.getMessages(userId, contactId);
    
    // Mark received messages as read
    await storage.markMessagesAsRead(contactId, userId);
    
    res.json(messages);
  });

  // Search route
  app.get('/api/search', checkAuth, async (req, res) => {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const results = await storage.searchUsers(query);
    
    // Remove passwords and current user from results
    const userId = req.session.userId as number;
    const filteredResults = results
      .filter(user => user.id !== userId)
      .map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    
    res.json(filteredResults);
  });

  // WebSocket handling
  wss.on('connection', async (ws: ExtendedWebSocket, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const userId = parseInt(url.searchParams.get('userId') || '0');
    
    if (!userId) {
      ws.close(1008, 'User ID is required');
      return;
    }
    
    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      ws.close(1008, 'User not found');
      return;
    }
    
    // Set user as online
    await storage.setUserOnlineStatus(userId, true);
    
    // Store the connection
    ws.userId = userId;
    activeConnections.push({ userId, socket: ws });
    
    // Broadcast online status to all contacts
    const contacts = await storage.getContacts(userId);
    broadcastToUsers(
      contacts.map(contact => contact.id),
      JSON.stringify({ type: 'status', userId, isOnline: true })
    );
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'message') {
          const { receiverId, content } = message;
          
          if (!receiverId || !content) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
            return;
          }
          
          // Store the message
          const newMessage = await storage.createMessage({
            senderId: userId,
            receiverId,
            content
          });
          
          // Send to the sender for confirmation
          ws.send(JSON.stringify({ type: 'message_sent', message: newMessage }));
          
          // Send to the recipient if online
          const recipientConnection = activeConnections.find(
            conn => conn.userId === receiverId
          );
          
          if (recipientConnection && recipientConnection.socket.readyState === WebSocket.OPEN) {
            recipientConnection.socket.send(JSON.stringify({ 
              type: 'new_message', 
              message: newMessage 
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', async () => {
      // Remove from active connections
      const index = activeConnections.findIndex(conn => conn.userId === userId);
      if (index !== -1) {
        activeConnections.splice(index, 1);
      }
      
      // Set user as offline if no other connections exist
      const hasOtherConnections = activeConnections.some(conn => conn.userId === userId);
      if (!hasOtherConnections) {
        await storage.setUserOnlineStatus(userId, false);
        
        // Broadcast offline status to all contacts
        broadcastToUsers(
          contacts.map(contact => contact.id),
          JSON.stringify({ type: 'status', userId, isOnline: false })
        );
      }
    });
  });

  // Helper function to broadcast to specific users
  function broadcastToUsers(userIds: number[], message: string) {
    userIds.forEach(userId => {
      const userConnections = activeConnections.filter(conn => conn.userId === userId);
      userConnections.forEach(conn => {
        if (conn.socket.readyState === WebSocket.OPEN) {
          conn.socket.send(message);
        }
      });
    });
  }

  return httpServer;
}
