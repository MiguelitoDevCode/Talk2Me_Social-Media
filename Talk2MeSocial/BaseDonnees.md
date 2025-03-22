# Documentation de la Base de Données - Talk2Me

**Copyright © 2025 MIGUELITO DevCode**

## Architecture de la Base de Données

Talk2Me utilise actuellement une solution de stockage en mémoire pour le développement, mais l'architecture est conçue pour permettre une transition facile vers une base de données PostgreSQL pour la production.

## Modèle de Données

Le modèle de données de Talk2Me comprend trois entités principales :

### 1. Utilisateurs (users)

La table des utilisateurs stocke les informations de compte et de profil :

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  isOnline: boolean("is_online").default(false).notNull(),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

### 2. Contacts (contacts)

La table des contacts définit les relations entre les utilisateurs :

```typescript
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contactId: integer("contact_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

### 3. Messages (messages)

La table des messages stocke les conversations entre utilisateurs :

```typescript
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
```

## Schémas de Validation

Les schémas de validation sont définis à l'aide de Zod et Drizzle-Zod pour garantir l'intégrité des données :

```typescript
// Schémas d'insertion
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

export const insertContactSchema = createInsertSchema(contacts).pick({
  userId: true,
  contactId: true
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true
});
```

## Types exportés

Les types TypeScript sont dérivés des schémas pour garantir la cohérence des types entre le frontend et le backend :

```typescript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Message = typeof messages.$inferSelect;
```

## Implémentation du Stockage en Mémoire

Pour le développement, Talk2Me utilise une implémentation de stockage en mémoire qui suit l'interface IStorage :

```typescript
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private messages: Map<number, Message>;
  currentUserId: number;
  currentContactId: number;
  currentMessageId: number;
  
  constructor() {
    // Initialisation des Maps et compteurs
  }
  
  // Méthodes d'accès utilisateur
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const timestamp = new Date().toISOString();
    
    const user: User = { 
      id, 
      ...insertUser, 
      bio: null, 
      profilePicture: null,
      isOnline: false,
      lastActive: null,
      createdAt: timestamp
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updateData: UpdateUser): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const timestamp = new Date().toISOString();
    const updatedUser = { 
      ...user, 
      isOnline, 
      lastActive: isOnline ? user.lastActive : timestamp 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Méthodes de gestion des contacts
  async getContacts(userId: number): Promise<User[]> {
    const userContacts = Array.from(this.contacts.values())
      .filter(contact => contact.userId === userId);
    
    const contactUsers = await Promise.all(
      userContacts.map(contact => this.getUser(contact.contactId))
    );
    
    return contactUsers.filter((user): user is User => user !== undefined);
  }
  
  async addContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const timestamp = new Date().toISOString();
    
    const contact: Contact = { ...insertContact, id, createdAt: timestamp };
    this.contacts.set(id, contact);
    return contact;
  }
  
  async removeContact(userId: number, contactId: number): Promise<boolean> {
    const contactEntry = Array.from(this.contacts.entries()).find(
      ([_, contact]) => contact.userId === userId && contact.contactId === contactId
    );
    
    if (!contactEntry) return false;
    
    this.contacts.delete(contactEntry[0]);
    return true;
  }
  
  // Méthodes de gestion des messages
  async getMessages(userId: number, contactId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === userId && msg.receiverId === contactId) ||
        (msg.senderId === contactId && msg.receiverId === userId)
      )
      .sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const timestamp = new Date().toISOString();
    
    const message: Message = { 
      id, 
      ...insertMessage, 
      isRead: false, 
      timestamp 
    };
    
    this.messages.set(id, message);
    return message;
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    const messagesToUpdate = Array.from(this.messages.values())
      .filter(msg => msg.senderId === senderId && msg.receiverId === receiverId && !msg.isRead);
    
    messagesToUpdate.forEach(message => {
      const updatedMessage = { ...message, isRead: true };
      this.messages.set(message.id, updatedMessage);
    });
  }
  
  // Méthode de recherche
  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.username.toLowerCase().includes(lowerQuery) ||
        user.fullName.toLowerCase().includes(lowerQuery) ||
        (user.bio && user.bio.toLowerCase().includes(lowerQuery))
      );
  }
}
```

## Migration vers PostgreSQL

Pour passer à une base de données PostgreSQL en production, il suffit d'implémenter une nouvelle classe qui implémente l'interface IStorage en utilisant Drizzle ORM :

```typescript
export class PostgresStorage implements IStorage {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}
  
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);
    return results[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await this.db.insert(users).values(insertUser).returning();
    return results[0];
  }
  
  // Implémentation des autres méthodes IStorage...
}
```

## Configuration de Drizzle

La configuration de Drizzle est définie dans `drizzle.config.ts` :

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/talk2me"
  }
} satisfies Config;
```

## Gestion des Migrations

Pour gérer les migrations de base de données avec Drizzle :

1. Générer les migrations :
   ```bash
   npx drizzle-kit generate:pg
   ```

2. Appliquer les migrations :
   ```typescript
   import { drizzle } from "drizzle-orm/postgres-js";
   import { migrate } from "drizzle-orm/postgres-js/migrator";
   import postgres from "postgres";

   const connectionString = process.env.DATABASE_URL;
   const sql = postgres(connectionString, { max: 1 });
   const db = drizzle(sql);

   async function runMigration() {
     await migrate(db, { migrationsFolder: "./drizzle" });
     await sql.end();
   }

   runMigration();
   ```

## Considérations pour la Production

1. **Sécurité** : Utiliser des variables d'environnement pour les informations sensibles de la base de données.
2. **Connection Pooling** : Configurer correctement le pooling de connexions pour optimiser les performances.
3. **Indexation** : Ajouter des index aux colonnes fréquemment recherchées pour améliorer les performances.
4. **Sauvegardes** : Mettre en place des sauvegardes régulières de la base de données.

## Relations et Contraintes

Les relations entre les tables sont définies par des clés étrangères :

- `contacts.userId` → `users.id`
- `contacts.contactId` → `users.id`
- `messages.senderId` → `users.id`
- `messages.receiverId` → `users.id`

Ces relations garantissent l'intégrité référentielle dans la base de données.

## Optimisations Potentielles

1. **Pagination** : Implémenter la pagination pour les requêtes retournant de grandes quantités de données.
2. **Mise en Cache** : Utiliser Redis pour mettre en cache les données fréquemment accédées.
3. **Partitionnement** : Pour une application à grande échelle, envisager le partitionnement des tables de messages.
4. **Requêtes Optimisées** : Optimiser les requêtes SQL pour les opérations complexes.