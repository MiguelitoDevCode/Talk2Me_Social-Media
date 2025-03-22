# Documentation du Code Source - Talk2Me

**Copyright © 2025 MIGUELITO DevCode**

## Architecture du Backend

Le backend de Talk2Me est construit avec Node.js et Express. Il fournit une API RESTful pour les opérations CRUD et utilise WebSockets pour les communications en temps réel.

### Structure des Fichiers

```
server/
  ├── index.ts       # Point d'entrée de l'application
  ├── routes.ts      # Définition des routes API et gestion des WebSockets
  ├── storage.ts     # Couche d'accès aux données (mémoire ou base de données)
  └── vite.ts        # Configuration Vite pour le développement
```

## Points d'Entrée (server/index.ts)

```typescript
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

async function main() {
  const app = express();
  
  // Configuration du middleware pour parser le JSON
  app.use(express.json());
  
  // Enregistrement des routes API
  const server = await registerRoutes(app);
  
  // Configuration du serveur Vite en développement
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Démarrage du serveur
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

## Gestion des Routes et WebSockets (server/routes.ts)

Le fichier `routes.ts` contient toutes les définitions d'API et la logique de gestion des WebSockets pour les communications en temps réel.

### Sessions et Authentification

```typescript
// Extension du type Session pour inclure l'ID utilisateur
declare module 'express-session' {
  interface Session {
    userId: number;
  }
}

// Configuration du middleware de session
const SessionStore = MemoryStore(session);
app.use(session({
  secret: "talk2me-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 heures
  store: new SessionStore({
    checkPeriod: 86400000 // 24 heures
  })
}));

// Middleware pour vérifier l'authentification
const checkAuth = (req: Request, res: Response, next: () => void) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
```

### Routes d'API

Les principales routes API sont organisées par fonctionnalité :

#### Routes Utilisateur

```typescript
// Inscription
app.post('/api/register', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Vérification si le nom d'utilisateur existe déjà
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

// Connexion
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

// Déconnexion
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

// Récupération du profil utilisateur
app.get('/api/user', checkAuth, async (req, res) => {
  const userId = req.session.userId as number;
  const user = await storage.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Mise à jour du profil utilisateur
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
```

#### Routes de Contacts

```typescript
// Récupération des contacts
app.get('/api/contacts', checkAuth, async (req, res) => {
  const userId = req.session.userId as number;
  const contacts = await storage.getContacts(userId);
  
  // Suppression des mots de passe des contacts
  const contactsWithoutPasswords = contacts.map(contact => {
    const { password, ...contactWithoutPassword } = contact;
    return contactWithoutPassword;
  });
  
  res.json(contactsWithoutPasswords);
});

// Ajout d'un contact
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
  
  // Vérification si déjà contact
  const contacts = await storage.getContacts(userId);
  if (contacts.some(contact => contact.id === contactUser.id)) {
    return res.status(400).json({ message: "Already in contacts" });
  }
  
  await storage.addContact({ userId, contactId: contactUser.id });
  
  // Ajout de la relation inverse pour les besoins de la démo
  await storage.addContact({ userId: contactUser.id, contactId: userId });
  
  const { password, ...contactWithoutPassword } = contactUser;
  res.status(201).json(contactWithoutPassword);
});

// Suppression d'un contact
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
  
  // Suppression de la relation inverse
  await storage.removeContact(contactId, userId);
  
  res.json({ message: "Contact removed successfully" });
});
```

#### Routes de Messages

```typescript
// Récupération des messages
app.get('/api/messages/:contactId', checkAuth, async (req, res) => {
  const userId = req.session.userId as number;
  const contactId = parseInt(req.params.contactId);
  
  if (isNaN(contactId)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }
  
  const messages = await storage.getMessages(userId, contactId);
  
  // Marquer les messages reçus comme lus
  await storage.markMessagesAsRead(contactId, userId);
  
  res.json(messages);
});
```

#### Route de Recherche

```typescript
// Recherche d'utilisateurs
app.get('/api/search', checkAuth, async (req, res) => {
  const query = req.query.q as string;
  
  if (!query || query.length < 2) {
    return res.json([]);
  }
  
  const results = await storage.searchUsers(query);
  
  // Suppression des mots de passe et de l'utilisateur actuel des résultats
  const userId = req.session.userId as number;
  const filteredResults = results
    .filter(user => user.id !== userId)
    .map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  
  res.json(filteredResults);
});
```

### Gestion des WebSockets

La gestion des WebSockets pour les communications en temps réel est cruciale pour l'application de messagerie :

```typescript
// Types pour WebSocket étendu avec ID utilisateur
interface ExtendedWebSocket extends WebSocket {
  userId?: number;
}

// Type pour les connexions utilisateur actives
interface ActiveUser {
  userId: number;
  socket: ExtendedWebSocket;
}

// Stockage des connexions actives
const activeConnections: ActiveUser[] = [];

// Création du serveur WebSocket
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Gestion des connexions WebSocket
wss.on('connection', async (ws: ExtendedWebSocket, req) => {
  const url = new URL(req.url || '', 'http://localhost');
  const userId = parseInt(url.searchParams.get('userId') || '0');
  
  if (!userId) {
    ws.close(1008, 'User ID is required');
    return;
  }
  
  // Vérification si l'utilisateur existe
  const user = await storage.getUser(userId);
  if (!user) {
    ws.close(1008, 'User not found');
    return;
  }
  
  // Définir l'utilisateur comme en ligne
  await storage.setUserOnlineStatus(userId, true);
  
  // Stocker la connexion
  ws.userId = userId;
  activeConnections.push({ userId, socket: ws });
  
  // Diffuser le statut en ligne à tous les contacts
  const contacts = await storage.getContacts(userId);
  broadcastToUsers(
    contacts.map(contact => contact.id),
    JSON.stringify({ type: 'status', userId, isOnline: true })
  );
  
  // Gestion des messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'message') {
        const { receiverId, content } = message;
        
        if (!receiverId || !content) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          return;
        }
        
        // Stocker le message
        const newMessage = await storage.createMessage({
          senderId: userId,
          receiverId,
          content
        });
        
        // Envoyer au destinataire pour confirmation
        ws.send(JSON.stringify({ type: 'message_sent', message: newMessage }));
        
        // Envoyer au destinataire s'il est en ligne
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
  
  // Gestion de fermeture de connexion
  ws.on('close', async () => {
    // Supprimer des connexions actives
    const index = activeConnections.findIndex(conn => conn.userId === userId);
    if (index !== -1) {
      activeConnections.splice(index, 1);
    }
    
    // Définir l'utilisateur comme hors ligne si aucune autre connexion n'existe
    const hasOtherConnections = activeConnections.some(conn => conn.userId === userId);
    if (!hasOtherConnections) {
      await storage.setUserOnlineStatus(userId, false);
      
      // Diffuser le statut hors ligne à tous les contacts
      broadcastToUsers(
        contacts.map(contact => contact.id),
        JSON.stringify({ type: 'status', userId, isOnline: false })
      );
    }
  });
});

// Fonction d'aide pour diffuser aux utilisateurs spécifiques
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
```

## Stockage des Données (server/storage.ts)

Le module de stockage gère l'accès aux données. Le projet utilise une implémentation de stockage en mémoire (MemStorage) adaptée pour le développement et les tests.

```typescript
export interface IStorage {
  // Opérations utilisateur
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  setUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined>;

  // Opérations contact
  getContacts(userId: number): Promise<User[]>;
  addContact(contact: InsertContact): Promise<Contact>;
  removeContact(userId: number, contactId: number): Promise<boolean>;
  
  // Opérations message
  getMessages(userId: number, contactId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  
  // Opérations recherche
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
    
    // Ajout d'utilisateurs de démonstration
    this.createUser({
      username: "john",
      password: "password",
      fullName: "John Doe",
      email: "john@example.com"
    });
    
    this.createUser({
      username: "jane",
      password: "password",
      fullName: "Jane Smith",
      email: "jane@example.com"
    });
  }
  
  // Implémentations des méthodes IStorage...
}
```

## Validation des Données

Le projet utilise Zod pour la validation des données côté serveur, avec des schémas définis dans `shared/schema.ts`.

```typescript
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true
});

export const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const updateUserSchema = createInsertSchema(users).pick({
  fullName: true,
  email: true, 
  bio: true,
  profilePicture: true
}).partial();
```

## Configuration de Vite

Le serveur de développement Vite est configuré dans `server/vite.ts` pour servir l'application frontend et permettre le HMR (Hot Module Replacement).

```typescript
export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server
      },
      allowedHosts: true
    }
  });

  app.use(vite.middlewares);
}
```

## Points de Sécurité à Noter

1. **Authentification** : L'application utilise des sessions pour gérer l'authentification des utilisateurs.
2. **Hachage des mots de passe** : Dans une version de production, les mots de passe devraient être hachés avant d'être stockés.
3. **Validation des entrées** : Toutes les entrées sont validées avec Zod pour éviter les injections.
4. **CORS** : Dans un environnement de production, une configuration CORS appropriée devrait être mise en place.