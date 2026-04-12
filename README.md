# devConnect — Backend API 🚀

REST API and real-time layer for **devConnect**, a developer networking platform where people can discover profiles, send connection requests, build a contact list, and chat in real time.

> This repository contains **only the Node.js backend**. See the frontend repo for the client-side code.

---

## ✨ What this backend does

| Area | Behavior |
|------|----------|
| 🔐 **Auth** | Sign up, login (JWT in httpOnly cookie), logout, forgot/reset password via email |
| 👤 **Profiles** | View and edit your own profile; view another user's public profile |
| 🤝 **Connections** | Send requests (`interested` / `ignored`); accept or reject incoming requests |
| 🔍 **Discovery** | Feed of suggested users; lists of received requests and accepted connections |
| 💬 **Chat** | REST endpoints for chat list, opening a thread, and paginated message history; live messaging over Socket.IO |

---

## 🛠️ Tech stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (LTS) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (cookie + Socket handshake), bcrypt, `tokenVersion` for session invalidation |
| Email | Nodemailer (Gmail) for password reset |
| Real-time | Socket.IO 4 — shares the same HTTP server as Express |
| Utilities | `cookie-parser`, `cors`, `express-rate-limit`, `validator` |

---

## ⚙️ Prerequisites

- **Node.js** (LTS recommended)
- A running **MongoDB** instance and its connection string
- A **Gmail account + app password** for the password reset email flow
- A **frontend** that shares the CORS origin and sends credentials for cookie-based auth (see [CORS section](#-cors-and-frontend))

---

## 🔑 Environment variables

Create a `.env` file in the project root (same folder as `package.json`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing and verifying JWTs |
| `PORT` | No | HTTP port (default `3000`) |
| `EMAIL_USER` | For reset flow | Gmail address used by Nodemailer |
| `EMAIL_PASS` | For reset flow | Gmail app password (or SMTP secret) |
| `FRONTEND_URL` | For reset flow | Base URL of the frontend; injected into the password reset link |

---

## 🚀 Install and run

```bash
npm install
```

**Development** — uses `nodemon` for auto-restart on file changes:

```bash
npm run dev
```

> If you prefer not to use nodemon, run `npm start` and restart manually after changes.

**Production:**

```bash
npm start
```

The server connects to MongoDB first; on success it starts listening on `PORT` and initializes Socket.IO on the same HTTP server.

---

## 📡 HTTP API overview

All protected routes require a valid `token` httpOnly cookie set at login.

### 🔐 Auth — `src/routes/authRouter.js`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/auth/signup` | No | Register a new user |
| `POST` | `/auth/login` | No | Sets JWT cookie; rate-limited (5 req / 15 min) |
| `POST` | `/auth/logout` | No | Clears the cookie |
| `POST` | `/auth/forgot-password` | No | Sends reset email if user exists; rate-limited (3 req / 15 min) |
| `PATCH` | `/auth/reset-password` | No | Body: reset token + new password (validated) |

### 👤 Profile — `src/routes/profileRouter.js`

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/profile/view` | Yes — current user's profile |
| `GET` | `/profile/:userId` | Yes — another user's public profile |
| `PATCH` | `/profile/edit` | Yes |
| `PATCH` | `/profile/changePassword` | Yes |

### 🤝 Connection requests — `src/routes/connectionRequestRoutes.js`

| Method | Path | Auth | Status segment |
|--------|------|------|----------------|
| `POST` | `/request/send/:status/:toUserId` | Yes | `interested` or `ignored` |
| `POST` | `/request/review/:status/:requestId` | Yes | `accepted` or `rejected` |

Statuses are validated by `src/middlewares/statusValidation.js`.

### 🔍 User feed and lists — `src/routes/userRouter.js`

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/user/requests/received` | Yes |
| `GET` | `/user/connections` | Yes |
| `GET` | `/user/feed` | Yes |

### 💬 Chat (REST) — `src/routes/chatRouter.js`

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/chats` | Yes — sidebar: all chats with last message preview |
| `GET` | `/chats/user/:targetUserId` | Yes — get or create a 1:1 chat thread + recent messages |
| `GET` | `/chats/:chatId/messages` | Yes — paginated message history |

---

## ⚡ Socket.IO — real-time chat

Configured in `src/utils/socket.js` and attached in `src/server.js`.

**Authentication**

The client must pass a JWT in the Socket.IO handshake:

```js
{ auth: { token: "<jwt>" } }
```

The token is verified with `JWT_SECRET` before the connection is accepted.

**Events**

| Event | Direction | Payload | Behavior |
|-------|-----------|---------|----------|
| `joinChat` | Client → Server | `{ receiverId }` | Joins a deterministic room derived from both user IDs |
| `sendMessage` | Client → Server | `{ receiverId, text, senderFirstName }` | Persists message, updates `lastMessage`, emits `messageReceived` to the room |
| `messageReceived` | Server → Client | Message object | Delivered to all participants in the chat room |

Room IDs are generated by `generateChatRoomId` in `src/utils/constants.js`.

---

## 🗂️ Project structure

```
devConnect-backend/
├── package.json
└── src/
    ├── server.js                  # Entry point — HTTP server, DB connect, Socket.IO init
    ├── app.js                     # Express app: middleware, routers, central error handler
    ├── config/
    │   └── database.js            # Mongoose connect (reads MONGODB_URL)
    ├── models/
    │   ├── userSchema.js          # User model — password hashing + JWT helper methods
    │   ├── connectionSchema.js    # Connection requests — unique sender/receiver pair
    │   ├── chatSchema.js          # 1:1 chats — sorted participants + indexes
    │   └── messageSchema.js       # Messages — linked to chat and sender
    ├── routes/                    # URL → controller wiring
    ├── controllers/               # HTTP handlers — validate input, call services, respond
    ├── services/                  # Business logic and DB operations
    ├── middlewares/
    │   ├── auth.js                # Cookie JWT verification, user load, tokenVersion check, throttled lastSeen
    │   ├── errorHandler.js        # Central error handler — returns { success, message }; hides internals
    │   └── statusValidation.js    # Validates connection request status values
    └── utils/
        ├── constants.js           # CORS config, chat room ID helper, populate field lists
        ├── validation.js          # Shared input validation helpers
        ├── rateLimiting.js        # Login and forgot-password rate limiters
        ├── socket.js              # Socket.IO auth middleware + chat event handlers
        ├── changePasswordDTO.js
        ├── email/
        │   ├── sendEmail.js       # Nodemailer transport
        │   └── resetPasswordTemplate.js
        └── errors/                # AppError, AuthError, ValidationError, etc.
```

**Request flow:** `routes` → `controllers` → `services` → Mongoose `models`. All errors bubble up to `errorHandler` for a consistent `{ success, message }` JSON response.

---

## 🗃️ Data model

| Model | Key fields |
|-------|-----------|
| **User** | Profile fields, `tokenVersion` (increment to invalidate all sessions), optional `resetPasswordToken` / `resetPasswordExpires`, `lastSeen`, `isActive` |
| **ConnectionRequest** | `senderUserId`, `receiverUserId`, `status` (`interested` / `accepted` / `rejected` / `ignored`), unique sender+receiver pair |
| **Chat** | Two `participants`, optional `lastMessage` ref |
| **Message** | `chat`, `sender`, `text` (max 2000 chars) |

---

## 🌐 CORS and frontend

CORS is configured in `src/utils/constants.js` with `origin: http://localhost:5173` and `credentials: true` so the browser includes cookies on every request.

> **Before deploying:** change the `origin` value to your production frontend URL, or derive it from `process.env.FRONTEND_URL`. The same CORS config is applied to both Express and Socket.IO.

---

## 📋 Scripts

| Script | Command |
|--------|---------|
| `npm start` | `node src/server.js` |
| `npm run dev` | `nodemon src/server.js` |

---

## 👨‍💻 Author

**Talha Ayub** — backend for the devConnect project.

---

## 📄 License

ISC — see `package.json`.