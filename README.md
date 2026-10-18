<!-- # PulseChat — Real-Time Scalable Chat Platform

[![Angular](https://img.shields.io/badge/Angular-18+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A production-grade, distributed real-time chat platform engineered with **Angular 18+ (Signals & Material Design)**, **Node.js/Express**, **Socket.IO**, **Redis**, and **MongoDB Atlas**. Designed for high throughput, horizontal scalability via Redis Pub/Sub, and seamless real-time user experiences.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [Frontend Highlights](#frontend-highlights-angular-18)
  - [Backend Highlights](#backend-highlights-nodejs--socketio)
- [Technical Highlights & Engineering Solutions](#-technical-highlights--engineering-solutions)
  - [1. Bidirectional Scrolling & Cursor Pagination](#1-bidirectional-scrolling--cursor-pagination)
  - [2. Multi-Tab User Presence (Redis Sets)](#2-multi-tab-user-presence-redis-sets)
  - [3. Horizontal Socket.IO Scaling (Redis Adapter)](#3-horizontal-socketio-scaling-redis-adapter)
  - [4. Real-Time Debounced Typing Indicators](#4-real-time-debounced-typing-indicators)
- [Repository Structure](#-repository-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Running Locally for Development](#running-locally-for-development)
- [API & Socket Reference](#-api--socket-reference)

---

## 🏛 System Architecture

The platform uses a **hybrid dual-channel communication model**:
* **HTTP REST**: Dedicated to historical queries, authentication, cursor-based pagination, and room management.
* **WebSockets (Socket.IO)**: Dedicated to low-latency bi-directional messaging, live message mutations (edits/deletions), typing events, and presence heartbeats.
* **Redis Pub/Sub**: Enables horizontal clustering across multiple Node.js instances behind load balancers.

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

## ✨ Key Features

### Frontend Highlights (Angular 18)
* **Reactive Signal Architecture:** High-performance, fine-grained reactivity using Angular Signals (`signal`, `computed`, `effect`) for state management (`ChatStateService`, `MessageStateService`).
* **Bidirectional Infinite Scroll:** Seamless cursor-based pagination (`before=<timestamp>`) prepends historical messages without viewport jump or flickering.
* **Smart Auto-Scroll & Floating Pill:** Automatically scrolls to the bottom on self-sent messages and live updates when near the bottom; presents a floating *"X new messages ↓"* badge when reading older history.
* **Real-Time Synchronized CRUD:** Sending, editing, and deleting messages reflect across all connected clients in that channel with zero page reloads.
* **Live Debounced Typing Indicators:** Visual typing waves (`Someone is typing...`) throttled on the client side with 2-second debounce timers to prevent socket flooding.
* **Online/Offline Member Presence:** Real-time green/gray status dots in the channel members dialog driven by live socket presence events.
* **Modern Material UI & PulseChat Theme:** Dark-mode glassmorphism, responsive navigation sidebar, channel search, and accessible modal dialogs.

### Backend Highlights (Node.js & Socket.IO)
* **Layered Clean Architecture:** Strict separation across `Routes ➔ Middlewares ➔ Controllers ➔ Services ➔ Repositories ➔ Models`.
* **JWT Authentication:** Dual-token strategy with short-lived Access Tokens (15m) and Refresh Tokens (7d), validated in HTTP headers and Socket.IO handshakes.
* **Horizontal Scalability:** Integrated `@socket.io/redis-adapter` for multi-node deployments behind load balancers.
* **Redis Multi-Tab Presence:** Multi-connection tracking using Redis Sets with 60s TTL and 30s heartbeat intervals.
* **Containerized Deployment:** Multi-stage production `Dockerfile` (Node 20 Alpine) with non-root security context, health checks, and `docker-compose.yml`.
* **Robust Security & Validation:** Zod request validation, rate limiting, bcrypt password hashing, and custom `AppError` centralized error handling.

---

## 🔬 Technical Highlights & Engineering Solutions

### 1. Bidirectional Scrolling & Cursor Pagination
* **The Problem:** Prepending older messages increases the scroll container's `scrollHeight`. Without compensation, the viewport jumps to the top, triggering infinite scroll loops and disorienting the user. Furthermore, reactive signal updates can erroneously trigger bottom-scrolling during history reads.
* **The Solution:**
  1. Capture `previousScrollHeight` and `previousScrollTop` prior to state mutation.
  2. Prepend messages to `MessageStateService`.
  3. Compensate scroll position using `requestAnimationFrame`:
     $$\text{scrollTop} = \text{previousScrollTop} + (\text{newScrollHeight} - \text{previousScrollHeight})$$
  4. Track `prevLastMessageId` in Angular effects to differentiate *prepends* (history) from *appends* (new incoming messages).

### 2. Multi-Tab User Presence (Redis Sets)
* **The Multi-Tab Problem:** If a user has two tabs open and closes one, a simple boolean status (`isOnline: false`) would falsely mark them offline.
* **The Solution:**
  * Sockets register in Redis Sets: `SADD presence:<userId> <socket.id>`.
  * When size transitions $0 \rightarrow 1$, emit `user_status_changed: online`.
  * On disconnect: `SREM presence:<userId> <socket.id>`. When cardinality reaches $0$, emit `user_status_changed: offline`.
  * Auto-expiring TTLs (60s) prevent ghost online states in the event of abrupt client crashes or connection drops.

### 3. Horizontal Socket.IO Scaling (Redis Adapter)
* The Socket.IO Redis adapter forwards room broadcasts between different server instances via Redis Pub/Sub channels. When User A connected to Instance 1 sends a message to `#general`, Instance 2 receives the Redis broadcast and emits it to User B connected to Instance 2.

### 4. Real-Time Debounced Typing Indicators
* Keystrokes invoke `typing_start` only once (`isTyping = true`), while resetting a 2000ms debounce timer.
* When typing pauses or the message is sent, `typing_stop` fires, clearing the indicator across peer clients and eliminating unnecessary socket traffic.

---

## 📂 Repository Structure

```text
real-time-chat-platform/
├── client/                               # Angular 18 Single Page Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                     # Core Singleton Services, Guards & Interceptors
│   │   │   │   ├── guards/               # Auth Guards
│   │   │   │   ├── interceptors/         # JWT Bearer Token HTTP Interceptor
│   │   │   │   ├── models/               # TypeScript Interfaces (User, Room, Message)
│   │   │   │   └── services/             # ChatService, SocketService, TokenService, State Services
│   │   │   ├── features/                 # Modular Feature Components
│   │   │   │   ├── auth/                 # Login & Registration Components
│   │   │   │   └── chat/                 # ChatLayout, RoomList, ChatWindow, MessageList, MessageInput
│   │   │   └── shared/                   # Shared UI Components & Modals
│   │   └── environment/                  # Environment Configurations (API & Socket URLs)
│   ├── angular.json
│   └── package.json
│
├── Server/                               # Node.js / Express / Socket.IO Server
│   ├── src/
│   │   ├── config/                       # Database (MongoDB Mongoose) & Redis Client
│   │   ├── controllers/                  # HTTP Request Controllers
│   │   ├── middleware/                   # JWT Auth, Room Access, Error, Zod Validation
│   │   ├── models/                       # Mongoose Schemas (User, Room, RoomMember, Message)
│   │   ├── repositories/                 # Data Access Layer / Database Queries
│   │   ├── routes/                       # Express REST Route Definitions
│   │   ├── services/                     # Business Logic & Presence Engine
│   │   ├── sockets/                      # Socket.IO Server, Auth & Event Handlers
│   │   ├── utils/                        # AppError, JWT, Password & Response Helpers
│   │   ├── validations/                  # Zod Request Validation Schemas
│   │   ├── app.js                        # Express App Configuration & Middlewares
│   │   └── server.js                     # HTTP Server, Socket.IO & Graceful Shutdown
│   ├── Dockerfile                        # Multi-Stage Production Container Build
│   ├── docker-compose.yml                # Docker Orchestration (API + Redis)
│   └── package.json
│
└── README.md                             # Project Documentation
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Angular 18+** | Standalone Components, Signal-based Reactive State |
| **UI & Styling** | **Angular Material & SCSS** | Customized dark-mode glassmorphic theme |
| **Client Transport** | **RxJS & socket.io-client** | Stream orchestration & WebSocket connections |
| **Backend Runtime** | **Node.js 20+ & Express 5** | RESTful routing, clean layered architecture |
| **Real-Time Engine** | **Socket.IO 4.x** | Bi-directional WebSocket communication |
| **Pub/Sub & Cache** | **Redis 7 & @socket.io/redis-adapter** | Cross-instance messaging & multi-tab presence |
| **Database** | **MongoDB Atlas & Mongoose** | Persistent storage for users, channels, and messages |
| **Authentication** | **JWT & bcrypt** | Access/refresh token pattern with secure password hashing |
| **Validation** | **Zod** | Schema-first request body validation |
| **DevOps** | **Docker & Docker Compose** | Containerized services with health checks and restart policies |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** 20.x or higher
* **npm** 10.x or higher
* **Docker Desktop** (for running Redis & containerized backend)
* **MongoDB Atlas** cluster URI

---

### Environment Configuration

Create a `.env` file inside the `Server/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat_db?retryWrites=true&w=majority

# Security (JWT)
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Client CORS
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

### Running with Docker Compose (Redis)

Start Redis with Docker Compose:
```bash
docker compose -f Server/docker-compose.yml up -d redis
```

Verify Redis is responsive:
```bash
docker exec -it chat-redis redis-cli ping
# Response: PONG
```

---

### Running Locally for Development

From the root directory, start both the Server and Angular Client:

1. **Start the Backend Server (Port 3000):**
   ```bash
   npm run server
   ```

2. **Start the Angular Client (Port 4200):**
   ```bash
   npm run client
   ```

3. Open **`http://localhost:4200`** in your browser.

---

## 📡 API & Socket Reference

### REST Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and obtain JWT tokens | No |
| `GET` | `/api/rooms` | Retrieve user's joined channels | Yes |
| `POST` | `/api/rooms` | Create a new public/private channel | Yes |
| `POST` | `/api/rooms/:id/join` | Join an existing channel | Yes |
| `POST` | `/api/rooms/:id/leave` | Leave a channel | Yes |
| `GET` | `/api/rooms/:id/members`| Get room members list | Yes |
| `GET` | `/api/rooms/:id/messages`| Fetch paginated message history (`?limit=50&before=`) | Yes |

### Real-Time Socket Events
| Event Name | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomId }` | Subscribes socket to channel channel |
| `leave_room` | Client ➔ Server | `{ roomId }` | Unsubscribes socket from channel |
| `send_message` | Client ➔ Server | `{ roomId, content, messageType }` | Saves to DB and broadcasts to room |
| `new_message` | Server ➔ Client | `Message` | Broadcasts new message to room peers |
| `update_message` | Client ➔ Server | `{ roomId, messageId, content }` | Edits message and broadcasts update |
| `message_updated`| Server ➔ Client | `Message` | Broadcasts updated message content |
| `delete_message` | Client ➔ Server | `{ roomId, messageId }` | Deletes message and broadcasts deletion |
| `message_deleted`| Server ➔ Client | `{ roomId, messageId, deletedBy }`| Informs peers to remove message from DOM |
| `typing_start` | Client ➔ Server | `{ roomId }` | User started typing (debounced) |
| `typing_stop` | Client ➔ Server | `{ roomId }` | User stopped typing |
| `user_typing` | Server ➔ Client | `{ userId }` | Broadcasts active typing state to room |
| `user_stopped_typing`| Server ➔ Client| `{ userId }` | Clears active typing state |
| `get_online_users`| Client ➔ Server | `{}` (Ack) | Retrieves snapshot of active online user IDs |
| `user_status_changed`| Server ➔ Client| `{ userId, status }` | Broadcasts global online/offline transitions |

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. -->
Coming Soon..