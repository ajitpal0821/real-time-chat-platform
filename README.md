# PulseChat — Real-Time Scalable Chat Platform

[![CI Pipeline](https://github.com/ajitpal0821/real-time-chat-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/ajitpal0821/real-time-chat-platform/actions/workflows/ci.yml)
[![Angular](https://img.shields.io/badge/Angular-18+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 📌 What is PulseChat?

**PulseChat** is a production-grade, distributed real-time chat platform built with **Angular 18+** on the frontend and **Node.js/Express 5** on the backend. It leverages **Socket.IO** and **Redis Pub/Sub** for horizontally scalable, low-latency messaging, backed by **MongoDB Atlas** for persistent storage.

The platform follows a **hybrid communication model**:
- **HTTP REST APIs**: Used for resource-heavy queries, user authentication, channel management, and cursor-based message history.
- **WebSockets (Socket.IO)**: Used for instantaneous two-way event communication, live message updates/deletions, real-time typing indicators, and online presence tracking.
- **Redis Cluster Adapter**: Enables horizontal scaling across multiple backend instances behind load balancers without losing socket room state or user sessions.

---

## 📸 Screenshots

<!-- ================================================================= -->
<!-- SCREENSHOT PLACEHOLDER SECTION: Insert your screenshot links below -->
<!-- Tip: Place your images in a folder like `screenshots/` or `assets/`  -->
<!-- ================================================================= -->

| 💬 Main Chat Interface | 👥 Channel & Member List |
| :---: | :---: |
| ![Chat Interface Placeholder](https://via.placeholder.com/600x380/1e293b/ffffff?text=Main+Chat+Interface+Screenshot) | ![Channel List Placeholder](https://via.placeholder.com/600x380/1e293b/ffffff?text=Room+%26+Members+Dialog+Screenshot) |

| ✍️ Live Typing & Message Actions | 📱 Responsive / Mobile View |
| :---: | :---: |
| ![Message Actions Placeholder](https://via.placeholder.com/600x380/1e293b/ffffff?text=Message+Actions+%26+Typing+Screenshot) | ![Mobile View Placeholder](https://via.placeholder.com/600x380/1e293b/ffffff?text=Mobile+View+Screenshot) |

> 💡 *To display your own screenshots, replace the image URLs above with your file paths (e.g., `./screenshots/chat-main.png`).*

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Angular 18+ (Standalone Components, Signals & Reactive State)
- **UI Components & Icons**: Angular Material 18 & CDK
- **Styling**: SCSS with custom dark-mode glassmorphic theme
- **State & Stream Orchestration**: Angular Signals (`signal`, `computed`, `effect`) & RxJS
- **WebSocket Client**: `socket.io-client` (v4.8+)

### Backend
- **Runtime & Framework**: Node.js 20+ & Express.js 5.x
- **Real-Time Communication**: Socket.IO 4.x
- **Pub/Sub & Distributed State**: Redis 7 with `@socket.io/redis-adapter`
- **Database & ODM**: MongoDB Atlas & Mongoose 8.x
- **Authentication**: JWT (JSON Web Tokens) with dual-token strategy (Access & Refresh tokens) + `bcrypt` password hashing
- **Input Validation**: Zod schema validation
- **Security Middlewares**: Helmet, CORS, Express Rate Limit, Express Mongo Sanitize (NoSQL injection defense)

### DevOps & Tooling
- **Containerization**: Docker & Docker Compose (Multi-stage Node.js Alpine builds)
- **CI/CD**: GitHub Actions (Linting, security vulnerability audit, container build checks)
- **Testing**: Jest, Supertest, Mongo Memory Server, Jasmine & Karma

---

## ✨ Features

### ⚡ Real-Time Messaging & State Sync
- **Bidirectional Instant Messaging**: Sub-millisecond message delivery across active channels using Socket.IO.
- **Message Editing & Deletion**: Real-time content mutations broadcasted to all connected peers in the channel without page refresh.
- **Real-Time Debounced Typing Indicators**: Broadcasts active typing state (`typing_start` / `typing_stop`) with a 2-second client-side debounce to prevent network congestion.

### 🌐 Presence & Multi-Tab Tracking
- **Multi-Tab Presence Engine**: Powered by Redis Sets (`SADD` / `SREM`). A user can have multiple browser tabs open; their status transitions to offline only when their last active socket disconnects.
- **Auto-Expiring Heartbeats**: Redis TTLs (60s) ensure clean presence teardown even during abrupt network drops or client crashes.
- **Live Member Presence**: Active green/gray status indicators update dynamically across channel member lists.

### 📜 Smart Chat History & Scrolling
- **Cursor-Based Pagination**: Fetches message history with `before=<timestamp>` to prevent duplicate or missing records during high-traffic chat streams.
- **Flicker-Free Bidirectional Infinite Scroll**: Angular Signals dynamically compensate scroll offsets when prepending older messages, preventing viewport jumps.
- **Smart Auto-Scroll**: Automatically scrolls down for incoming messages if the user is already near the bottom; presents a *"New messages below"* floating badge when reviewing past messages.

### 🛡 Rooms & Access Control
- **Channel Management**: Create public and private channels, join/leave rooms, and view active channel members.
- **Role-Aware Security**: Ensures sockets can only receive broadcasts from channels they are verified members of.

### 🔒 Enterprise-Grade Security
- **Dual-Token Authentication**: 15-minute access tokens and 7-day refresh tokens; socket connection handshake validates JWT tokens on connect.
- **Defense in Depth**: Express 5 rate-limiting on authentication and API routes, Helmet HTTP headers, NoSQL query injection sanitization, and strict Zod payload validation.

---

## 🏛 System Architecture

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

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker Desktop**: Recommended for local Redis service
- **MongoDB Atlas** account (or local MongoDB `v7+`)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ajitpal0821/real-time-chat-platform.git
cd real-time-chat-platform
```

---

### 2. Environment Configuration

Create a `.env` file in the `Server/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat_db?retryWrites=true&w=majority

# Security (JWT)
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Redis Cache & Pub/Sub
REDIS_URL=redis://localhost:6379

# Client URL (for CORS)
CLIENT_URL=http://localhost:4200
```

Verify client environment in `client/src/environment/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

---

### 3. Start Redis

Using Docker Compose:

```bash
docker compose -f Server/docker-compose.yml up -d redis
```

Verify Redis is running:
```bash
docker exec -it chat-redis redis-cli ping
# Output: PONG
```

---

### 4. Install Dependencies & Run

You can run both client and server from the root directory:

#### Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
npm --prefix Server install
npm --prefix client install
```

#### Start the Backend Server (Port 3000)
```bash
npm run server
```

#### Start the Angular Client (Port 4200)
```bash
npm run client
```

Navigate to **`http://localhost:4200`** in your browser to start chatting.

---

## 📡 API & Socket Event Reference

### REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and issue access & refresh tokens | No |
| `GET` | `/api/users/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/rooms` | Retrieve all user joined channels | Yes |
| `POST` | `/api/rooms` | Create a new public/private channel | Yes |
| `POST` | `/api/rooms/:id/join` | Join a channel by ID | Yes |
| `POST` | `/api/rooms/:id/leave` | Leave a channel | Yes |
| `GET` | `/api/rooms/:id/members`| Get active room members list | Yes |
| `GET` | `/api/rooms/:roomId/messages` | Cursor-paginated message history (`?limit=50&before=`) | Yes |
| `GET` | `/health` | Service health check | No |

### Real-Time Socket.IO Events

| Event Name | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomId }` | Joins a channel socket room |
| `leave_room` | Client ➔ Server | `{ roomId }` | Leaves a channel socket room |
| `send_message` | Client ➔ Server | `{ roomId, content, messageType }` | Saves to DB and broadcasts to room |
| `new_message` | Server ➔ Client | `Message` object | Broadcasts incoming message to channel members |
| `update_message` | Client ➔ Server | `{ roomId, messageId, content }` | Updates message content in database |
| `message_updated` | Server ➔ Client | `Message` object | Broadcasts edited message payload |
| `delete_message` | Client ➔ Server | `{ roomId, messageId }` | Deletes message in database |
| `message_deleted` | Server ➔ Client | `{ roomId, messageId, deletedBy }` | Informs peers to remove message from UI |
| `typing_start` | Client ➔ Server | `{ roomId }` | Notifies server that user is typing |
| `typing_stop` | Client ➔ Server | `{ roomId }` | Notifies server that user stopped typing |
| `user_typing` | Server ➔ Client | `{ userId, username }` | Broadcasts user typing state to channel |
| `user_stopped_typing`| Server ➔ Client | `{ userId }` | Broadcasts typing stop event |
| `get_online_users` | Client ➔ Server | `{}` (Ack) | Retrieves current list of online user IDs |
| `user_status_changed` | Server ➔ Client | `{ userId, status }` | Global broadcast for online/offline transitions |

---

## 📂 Repository Structure

```text
real-time-chat-platform/
├── client/                               # Angular 18 Single Page Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                     # Singleton services, JWT interceptors, guards, models
│   │   │   ├── features/
│   │   │   │   ├── auth/                 # Login & Registration views
│   │   │   │   └── chat/                 # ChatLayout, RoomList, MessageList, Dialogs
│   │   │   └── shared/                   # Shared UI components & material modules
│   │   └── environment/                  # Environment configurations
│   ├── angular.json
│   └── package.json
│
├── Server/                               # Node.js + Express + Socket.IO Server
│   ├── src/
│   │   ├── config/                       # MongoDB Mongoose & Redis client configs
│   │   ├── controllers/                  # REST request handlers
│   │   ├── middleware/                   # JWT auth, rate limiter, error & validation
│   │   ├── models/                       # Mongoose schemas (User, Room, Message, RoomMember)
│   │   ├── repositories/                 # Data access layer
│   │   ├── routes/                       # Express route definitions
│   │   ├── services/                     # Business logic & Redis presence service
│   │   ├── sockets/                      # Socket.IO connection & event handlers
│   │   ├── utils/                        # AppError, token & password utils
│   │   ├── validations/                  # Zod request validation schemas
│   │   ├── app.js                        # Express application configuration
│   │   └── server.js                     # Server entrypoint & graceful shutdown
│   ├── Dockerfile                        # Multi-stage production container build
│   ├── docker-compose.yml                # Docker compose orchestration (API + Redis)
│   └── package.json
│
└── README.md                             # Project documentation
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.