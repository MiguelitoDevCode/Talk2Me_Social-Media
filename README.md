# Talk2Me - Real-Time Messaging Application

**Talk2Me** is a minimal real-time messaging application built with React, Node.js, and Express.js. It provides essential chat functionality with WebSocket-based real-time communication.

**Copyright © 2025 MIGUELITO DevCode - All rights reserved**

## 📋 Overview

Talk2Me is a modern messaging application that enables users to communicate in real-time. The application features a clean, responsive interface and focuses on core messaging functionalities without unnecessary complexity.

## 🚀 Key Features

### Minimal Core Functionalities

- **User Authentication**
  - User registration with username, email, and password
  - Secure login system with session management
  - User logout functionality

- **Real-Time Messaging**
  - Instant message delivery using WebSockets
  - One-to-one chat conversations
  - Message read/unread status
  - Real-time message notifications

- **User Profiles**
  - Profile management (name, email, bio, profile picture)
  - Online/offline status tracking
  - Last active timestamp

- **Contact Management**
  - Add contacts to your chat list
  - Remove contacts
  - Search for users by username, full name, or email
  - View contact online status

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query (React Query)** - Data fetching and state management
- **Radix UI** - Accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **WebSocket (ws)** - Real-time bidirectional communication
- **Express Session** - Session middleware
- **Zod** - Schema validation

### Storage
- **In-Memory Storage** - Default storage (MemStorage)
- **Drizzle ORM** - Optional database integration
- **PostgreSQL** - Optional database support

## 📦 Project Structure

```
Talk2MeSocial/
├── client/               # React frontend application
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Libraries (auth, socket, etc.)
│       ├── pages/        # Page components (auth, chat, profile)
│       └── App.tsx       # Main application component
├── server/               # Express backend server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes and WebSocket handlers
│   ├── storage.ts        # Data storage layer
│   └── vite.ts           # Vite development configuration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Zod schemas and TypeScript types
└── package.json          # Project dependencies and scripts
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MiguelitoDevCode/Talk2Me_Social-Media.git
   cd Talk2Me_Social-Media/Talk2MeSocial
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   
   Open your browser and navigate to: `http://localhost:5000`

### Available Scripts

- `npm run dev` - Start development server (backend + frontend)
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run check` - Type-check TypeScript files
- `npm run db:push` - Push database schema (if using PostgreSQL)

## 🎯 Usage

### First Time Setup

1. **Register a new account** on the authentication page
2. **Log in** with your credentials
3. **Search for users** using the search bar
4. **Add contacts** to start chatting
5. **Send messages** in real-time to your contacts

### Demo Users (Pre-loaded)

The application comes with sample users for testing:
- Username: `alex` / Password: `password123`
- Username: `sarah` / Password: `password123`
- Username: `michael` / Password: `password123`
- Username: `lisa` / Password: `password123`
- Username: `robert` / Password: `password123`

## 📱 Features in Detail

### Authentication Flow
- Session-based authentication with secure cookies
- Password validation (minimum 6 characters)
- Automatic redirect to chat on successful login

### Real-Time Communication
- WebSocket connections for instant message delivery
- Automatic reconnection on connection loss
- Online/offline status broadcasts
- Message delivery confirmations

### User Interface
- Dark/Light theme support with theme toggle
- Responsive design for mobile and desktop
- Smooth animations and transitions
- Loading states and error handling
- Toast notifications for user feedback

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file in the `Talk2MeSocial` directory:

```env
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-secret-key-here
```

### Database Configuration (Optional)

By default, the application uses in-memory storage. To use PostgreSQL:

1. Set up a PostgreSQL database
2. Configure database connection in `drizzle.config.ts`
3. Run migrations: `npm run db:push`

## 📚 Additional Documentation

Detailed documentation is available in the `Talk2MeSocial` folder:

- **[RunDeploi.md](Talk2MeSocial/RunDeploi.md)** - Deployment guide for various platforms
- **[Code.md](Talk2MeSocial/Code.md)** - Source code documentation
- **[BaseDonnees.md](Talk2MeSocial/BaseDonnees.md)** - Database structure and schema
- **[maj.md](Talk2MeSocial/maj.md)** - Update and maintenance guide

## 🤝 Contributing

This is a personal project by MIGUELITO DevCode. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

**Copyright © 2025 MIGUELITO DevCode - All rights reserved**

## 🙏 Acknowledgments

- Built with modern web technologies
- UI components from Radix UI
- Icons from Lucide React
- Styling with Tailwind CSS

## 📞 Contact

For questions or support, please open an issue in the GitHub repository.

---

**Note**: This is a minimal messaging application focused on core chat functionality. It is designed for learning purposes and small-scale deployments.
