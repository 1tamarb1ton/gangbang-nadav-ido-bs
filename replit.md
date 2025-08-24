# Party Qs - Custom Questions Game

## Overview

Party Qs is a real-time multiplayer web application designed for social gaming experiences. The app allows a host to create custom question games where players join via room codes and submit answers through their mobile devices. Built as a modern full-stack application, it provides seamless real-time communication between hosts and players through WebSocket connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript, utilizing a component-based architecture. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable interface elements. The application uses Wouter for lightweight client-side routing and TanStack Query for server state management.

**Key Frontend Decisions:**
- **React with TypeScript**: Chosen for type safety and component reusability
- **shadcn/ui + Radix UI**: Provides accessible, customizable components with consistent design
- **Wouter**: Lightweight routing solution suitable for the simple navigation needs
- **TanStack Query**: Manages server state and API interactions efficiently
- **Tailwind CSS**: Utility-first styling with design system variables for consistent theming

### Backend Architecture
The server implements a Node.js Express application with Socket.IO for real-time WebSocket communication. The architecture follows a modular approach with separate concerns for routing, storage, and socket management.

**Key Backend Decisions:**
- **Express.js**: Provides robust HTTP server foundation with middleware support
- **Socket.IO**: Enables real-time bidirectional communication for game interactions
- **In-memory storage**: Simple storage solution using Map data structures for room and player management
- **Zod validation**: Runtime type checking and validation for socket events and data structures

### Data Storage Solutions
The application uses in-memory storage for game state management, storing room data, player information, and game answers in JavaScript Map objects. This approach was chosen for simplicity and the ephemeral nature of game sessions.

**Storage Architecture:**
- **MemStorage class**: Implements IStorage interface for room and player management
- **Room-based data structure**: Each room contains questions, player roster, current game state, and submitted answers
- **No persistence**: Game data is lost when server restarts, appropriate for temporary gaming sessions

### Authentication and Authorization
The application implements a simple session-based approach without traditional authentication. Players are identified by their socket connection IDs, and hosts are distinguished by being the creator of a room.

**Security Approach:**
- **Socket-based identity**: Players identified by unique socket connection IDs
- **Host privileges**: Room creator has administrative controls (start/reveal/next actions)
- **Room code validation**: 4-digit codes provide basic access control to game rooms

### Real-time Communication
Socket.IO handles all real-time communication between clients and server, implementing custom event schemas for different game actions.

**Socket Event Architecture:**
- **Typed events**: Client-to-server and server-to-client events are strongly typed using shared schemas
- **Room-based broadcasting**: Messages are sent to specific socket rooms based on game room codes
- **Game state synchronization**: All connected clients receive real-time updates about game progression

### Build and Development
The project uses Vite for frontend development and building, with esbuild for server bundling in production. The development setup includes hot module replacement and error overlays for improved developer experience.

**Build Pipeline:**
- **Vite**: Fast development server with HMR for frontend code
- **esbuild**: Fast bundling for server-side code in production
- **TypeScript compilation**: Type checking across client, server, and shared code
- **Path aliases**: Simplified imports using @ prefixes for different code areas

## External Dependencies

### Database and ORM
- **Drizzle ORM**: Modern TypeScript ORM configured for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connections
- **PostgreSQL**: Configured as the target database dialect (may be added later by the coding agent)

### UI and Styling
- **Radix UI**: Comprehensive set of low-level UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **class-variance-authority**: Type-safe variant API for component styling
- **Lucide React**: Icon library providing consistent iconography

### Real-time Communication
- **Socket.IO**: Real-time bidirectional event-based communication
- **express**: Web application framework for Node.js server

### Development and Build Tools
- **Vite**: Next-generation frontend build tool and development server
- **TypeScript**: Static type checking for improved code quality
- **esbuild**: Fast JavaScript bundler for production builds

### Form Handling and Validation
- **React Hook Form**: Performant forms library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type safety
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries

### State Management
- **TanStack React Query**: Server state management and data fetching
- **React Context**: Local state management for socket connections and game state

### Routing
- **Wouter**: Lightweight client-side routing library for React applications

### Utility Libraries
- **clsx**: Utility for constructing className strings conditionally
- **date-fns**: Modern JavaScript date utility library
- **nanoid**: URL-friendly unique string ID generator