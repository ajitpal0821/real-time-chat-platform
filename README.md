# PulseChat

> A modern, horizontally scalable real-time chat platform engineered with Angular 18, Node.js, Express 5, Socket.IO, Redis, and MongoDB Atlas.

[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/ajitpal0821/real-time-chat-platform/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/ajitpal0821/real-time-chat-platform/actions/workflows/ci.yml)
[![Angular](https://img.shields.io/badge/Angular-18-E03232?style=flat-square)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-43853D?style=flat-square)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-7-D82C20?style=flat-square)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-13AA52?style=flat-square)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## Overview

PulseChat is an enterprise-grade real-time chat platform designed for high concurrency, low latency, and smooth user interactions. It adopts a dual-channel architecture:

- **HTTP REST APIs**: Handles authentication, user profile management, channel configuration, and cursor-paginated chat history.
- **WebSocket Layer (Socket.IO)**: Delivers sub-millisecond bidirectional communication for live messaging, message editing and deletion, real-time typing indicators, and user presence.
- **Redis Pub/Sub Adapter**: Synchronizes socket events across distributed Node.js processes, enabling effortless horizontal scaling behind a reverse proxy or load balancer.

---

## Screenshots
<img width="1598" height="868" alt="image" src="https://github.com/user-attachments/assets/e2995ab5-35b1-4b00-9914-2ddc96ff3205" />

<!-- Add your screenshots below by placing images in your repository (e.g., in a /screenshots folder) -->

| Main Interface | Channels & Member Directory |
| :---: | :---: |
| ![Main Interface](<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/17037d52-3429-45c0-8e07-bfe33fc03e07" />
) | ![Channels and Members](<img width="323" height="895" alt="image" src="https://github.com/user-attachments/assets/901aca67-a504-4c28-8954-b303b7d928cd" />
) |

| Real-Time Messaging & Actions | Responsive Mobile View |
| :---: | :---: |
| ![Real-Time Messaging](<img width="953" height="901" alt="image" src="https://github.com/user-attachments/assets/de2401fd-fbab-49c9-b6e6-cac5945095c4" />
) | ![Mobile View](<img width="872" height="638" alt="image" src="https://github.com/user-attachments/assets/bccaffef-d088-40af-b7c1-029ca0010263" />
) |



---

## Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Angular 18+ | Standalone components, fine-grained reactive state with Signals |
| **UI & Components** | Angular Material & CDK | Accessible dialogs, layout primitives, and navigation |
| **Styling** | SCSS | Minimalist dark theme and responsive design |
| **Client Transport** | RxJS & Socket.IO Client | Stream composition and persistent WebSocket connections |
| **Backend Runtime** | Node.js 20+ & Express 5 | Layered RESTful backend with modular routing |
| **Real-Time Engine** | Socket.IO 4.x | Event-driven duplex socket transport |
| **Pub/Sub & Cache** | Redis 7 & `@socket.io/redis-adapter` | Inter-instance broadcast routing and multi-tab user presence |
| **Database** | MongoDB Atlas & Mongoose 8 | Persistent storage for users, channels, memberships, and messages |
| **Authentication** | JWT & bcrypt | Dual-token access/refresh model with salted password hashing |
| **Validation** | Zod | Strictly-typed request payload validation |
| **Security** | Helmet, CORS, Rate Limit, Mongo Sanitize | HTTP header hardening, IP rate limiting, and NoSQL query sanitization |
| **Containerization** | Docker & Docker Compose | Multi-stage production container builds and local Redis orchestration |

---

## Key Features

### Real-Time Messaging & Synchronization
- **Instant Duplex Messaging**: Instant message transmission and delivery across channel rooms.
- **Live Mutations**: In-place edits and deletions broadcast instantaneously to all peers in the room.
- **Debounced Typing Indicator**: Keystroke detection with a 2-second client-side debounce to eliminate network flooding while maintaining live feedback.

### Multi-Tab User Presence
- **Connection-Aware Tracking**: Powered by Redis Sets (`SADD` / `SREM`). If a user has three tabs open and closes two, they remain marked online until their final socket disconnects.
- **Auto-Expiring Heartbeats**: Redis TTL safeguards (60s) ensure users are cleanly disconnected during unexpected network dropouts.
- **Live Member Status**: Dynamic indicators reflect online/offline transitions across channel member lists without page reloads.

### Message History & Smart Scrolling
- **Cursor-Based Pagination**: Retrieves historical messages with `before=<timestamp>` to prevent duplicate rendering and missed entries during active conversations.
- **Jump-Free History Prepending**: Compensates scroll offsets during history pagination to prevent viewport jumping.
- **Intelligent Auto-Scroll**: Automatically pins the viewport to incoming messages when at the bottom, while surfacing a subtle unread pill when viewing older history.

### Channel Management & Access Control
- **Channel Operations**: Create, join, and leave public or private chat channels.
- **Room Authorization**: Validates socket session memberships before joining broadcast rooms.

### Security
- **Dual-Token Auth**: Short-lived access tokens (15m) paired with long-lived refresh tokens (7d). Handshake middleware validates tokens prior to WebSocket establishment.
- **Layered Defense**: NoSQL injection sanitization, rate-limiting on sensitive auth routes, and schema validation with Zod.

---

## System Architecture

```text
                           +------------------------+
                           |     Client Browser     |
                           | (Angular 18 + Signals) |
                           +-----------+------------+
                                       |
                +----------------------+----------------------+
                |                                             |
         HTTP REST (JSON)                               WebSocket (TCP)
                |                                             |
                v                                             v
    +-----------------------+                     +-----------------------+
    |  Express REST Routes  |                     |  Socket.IO Handshake  |
    |  (Auth, History, CRUD)|                     | (JWT, Rooms, Events)  |
    +-----------+-----------+                     +-----------+-----------+
                |                                             |
                +----------------------+----------------------+
                                       |
                                       v
                         +---------------------------+
                         |   Controller & Services   |
                         +-------------+-------------+
                                       |
                +----------------------+----------------------+
                |                                             |
                v                                             v
     +--------------------+                        +--------------------+
     |   MongoDB Atlas    |                        |    Redis Engine    |
     |  (Primary Source   |                        | (Pub/Sub Adapter,  |
     |    of Truth)       |                        | Cache, Presence)   |
     +--------------------+                        +--------------------+
```

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- Docker Desktop (for running Redis locally)
- MongoDB Atlas cluster or local MongoDB instance

---

### 1. Clone the Repository

```bash
git clone https://github.com/ajitpal0821/real-time-chat-platform.git
cd real-time-chat-platform
```

---

### 2. Environment Setup

Create `.env` inside the `Server/` directory:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat_db?retryWrites=true&w=majority

JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

REDIS_URL=redis://localhost:6379

CLIENT_URL=http://localhost:4200
```

Verify client settings in `client/src/environment/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

---

### 3. Start Redis

Launch the Redis container via Docker Compose:

```bash
docker compose -f Server/docker-compose.yml up -d redis
```

Confirm Redis is reachable:
```bash
docker exec -it chat-redis redis-cli ping
# Output: PONG
```

---

### 4. Install Dependencies & Launch

```bash
# Install workspace dependencies
npm install
npm --prefix Server install
npm --prefix client install
```

Start the backend server (Port 3000):
```bash
npm run server
```

In a separate terminal, start the Angular client (Port 4200):
```bash
npm run client
```

Open `http://localhost:4200` in your browser.

---

## API & Socket Reference

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate user and issue tokens | No |
| `GET` | `/api/users/me` | Fetch active user profile | Yes |
| `GET` | `/api/rooms` | List joined rooms | Yes |
| `POST` | `/api/rooms` | Create a new room | Yes |
| `POST` | `/api/rooms/:id/join` | Join a room | Yes |
| `POST` | `/api/rooms/:id/leave` | Leave a room | Yes |
| `GET` | `/api/rooms/:id/members` | Retrieve member list for a room | Yes |
| `GET` | `/api/rooms/:roomId/messages` | Fetch cursor-paginated messages (`?limit=50&before=`) | Yes |
| `GET` | `/health` | Health check endpoint | No |

### Socket.IO Events

| Event | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `join_room` | Client to Server | `{ roomId }` | Subscribes socket to channel room |
| `leave_room` | Client to Server | `{ roomId }` | Unsubscribes socket from room |
| `send_message` | Client to Server | `{ roomId, content, messageType }` | Persists message and broadcasts to room |
| `new_message` | Server to Client | `Message` object | Emits incoming message to room members |
| `update_message` | Client to Server | `{ roomId, messageId, content }` | Updates message in database |
| `message_updated` | Server to Client | `Message` object | Broadcasts updated message payload |
| `delete_message` | Client to Server | `{ roomId, messageId }` | Deletes message in database |
| `message_deleted` | Server to Client | `{ roomId, messageId, deletedBy }` | Informs peers to remove message from UI |
| `typing_start` | Client to Server | `{ roomId }` | Emits typing state (debounced) |
| `typing_stop` | Client to Server | `{ roomId }` | Clears typing state |
| `user_typing` | Server to Client | `{ userId, username }` | Broadcasts active typing indicator |
| `user_stopped_typing`| Server to Client | `{ userId }` | Broadcasts typing cessation |
| `get_online_users` | Client to Server | `{}` (Ack callback) | Returns active online user IDs |
| `user_status_changed` | Server to Client | `{ userId, status }` | Global broadcast for presence transitions |

---

## Project Structure

```text
real-time-chat-platform/
├── client/                               # Angular 18 Single Page Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                     # Services, guards, interceptors, models
│   │   │   ├── features/
│   │   │   │   ├── auth/                 # Login and registration modules
│   │   │   │   └── chat/                 # ChatLayout, RoomList, MessageList, Dialogs
│   │   │   └── shared/                   # Shared UI primitives
│   │   └── environment/                  # Client environment configuration
│   ├── angular.json
│   └── package.json
│
├── Server/                               # Node.js + Express + Socket.IO Server
│   ├── src/
│   │   ├── config/                       # Mongoose and Redis client configurations
│   │   ├── controllers/                  # REST API controllers
│   │   ├── middleware/                   # JWT auth, rate limiter, error and validation
│   │   ├── models/                       # Mongoose schemas (User, Room, Message, RoomMember)
│   │   ├── repositories/                 # Data access layer
│   │   ├── routes/                       # Express routes
│   │   ├── services/                     # Business logic and Redis presence engine
│   │   ├── sockets/                      # Socket.IO connection and event handlers
│   │   ├── utils/                        # Error classes, token and password helpers
│   │   ├── validations/                  # Zod validation schemas
│   │   ├── app.js                        # Express app setup
│   │   └── server.js                     # Server entrypoint and graceful shutdown
│   ├── Dockerfile                        # Multi-stage production container build
│   ├── docker-compose.yml                # Container orchestration
│   └── package.json
│
└── README.md                             # Project documentation
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
