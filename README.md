# Chat App

A real-time full-stack chat application with AI assistant support, built with React, Express, Socket.IO, and PostgreSQL.

## Features

- JWT-based authentication (register/login)
- Real-time messaging via Socket.IO
- Direct and group chats
- AI assistant powered by Gemini 2.5 Flash (streaming responses)
- Typing indicators
- Message read receipts
- Emoji reactions
- Online/offline presence
- Dark mode toggle

## Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend  | Express 5, TypeScript, Socket.IO          |
| Database | PostgreSQL via Prisma ORM                 |
| AI       | Google Gemini 2.5 Flash                  |

## Project Structure

```
Chat/
├── client/          # React frontend (Vite)
└── server/          # Express + Socket.IO backend
    └── prisma/      # Database schema and migrations
```

## Prerequisites

- Node.js 18+
- PostgreSQL
- A [Google AI Studio](https://aistudio.google.com/) API key

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

**Server** — copy `server/.env.example` to `server/.env` and fill in:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/chatapp"
JWT_SECRET="your-long-random-secret"
FRONTEND_ORIGINS="http://localhost:5173"
GEMINI_API_KEY="your-gemini-api-key"
```

**Client** — the Vite dev proxy handles API routing in development, so no `.env` is needed unless deploying to production. For production, copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Run database migrations

```bash
cd server
npm run db:migrate
```

### 4. Start development servers

From the project root:

```bash
npm run dev
```

This starts both the backend (port 3000) and frontend (port 5173) concurrently.

## Available Scripts

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start both servers in development    |
| `npm run build`       | Build server and client for production |
| `npm run db:migrate`  | Run Prisma migrations                |
| `npm run db:generate` | Regenerate Prisma client             |
| `npm run db:studio`   | Open Prisma Studio (DB GUI)          |

## API Routes

| Method | Path                     | Description             |
|--------|--------------------------|-------------------------|
| POST   | `/api/auth/register`     | Register a new user     |
| POST   | `/api/auth/login`        | Login and get JWT       |
| GET    | `/api/chats`             | List user's chats       |
| POST   | `/api/chats`             | Create a new chat       |
| GET    | `/api/chats/:id/messages`| Get messages for a chat |
| GET    | `/api/chats/:id/summary` | AI-generated chat summary |

## Socket Events

| Event             | Direction       | Description                        |
|-------------------|-----------------|------------------------------------|
| `join_chat`       | Client → Server | Join a chat room                   |
| `leave_chat`      | Client → Server | Leave a chat room                  |
| `send_message`    | Client → Server | Send a message                     |
| `mark_read`       | Client → Server | Mark messages as read              |
| `react`           | Client → Server | Toggle an emoji reaction           |
| `typing_start`    | Client → Server | Start typing indicator             |
| `typing_stop`     | Client → Server | Stop typing indicator              |
| `message_received`| Server → Client | New message broadcast              |
| `ai_stream`       | Server → Client | Streaming AI response token        |
| `messages_read`   | Server → Client | Read receipt update                |
| `reaction_updated`| Server → Client | Reaction change broadcast          |
| `user_typing`     | Server → Client | Another user is typing             |
| `user_stop_typing`| Server → Client | Another user stopped typing        |
| `user_online`     | Server → Client | User came online                   |
| `user_offline`    | Server → Client | User went offline                  |

## AI Assistant

Adding the **AI Assistant** user to any chat enables an AI participant powered by Gemini 2.5 Flash. It replies to every message in that chat with a streamed response, so tokens appear progressively. The full conversation history is sent as context with each request.
