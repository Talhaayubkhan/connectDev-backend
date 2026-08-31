# ConnectDev Backend

Production-oriented REST API for [ConnectDev](https://github.com/Talhaayubkhan/connectDev-frontend), a developer networking web application. This repository owns authentication, profiles, connection requests, discovery, and password recovery. The React frontend lives in a separate repository and consumes this API with credentialed requests.

## Features

- Cookie-based JWT authentication with session revocation
- Signup, login, logout, forgot-password, and reset-password flows
- Current-user profile editing and connection-only public profiles
- Connection request creation, review, received requests, and accepted connections
- Paginated developer discovery feed
- Case-insensitive skill cleanup and strict profile validation
- Recent activity derived from `lastSeen`
- Helmet security headers, controlled CORS, request-size limits, and rate limiting
- Consistent JSON errors, graceful shutdown, and a health endpoint
- Jest unit, integration, and frontend-contract tests

Chat, messaging, Socket.IO, and AI features are not implemented in this repository.

## Requirements

- Node.js 22 or newer
- npm
- MongoDB
- A Gmail account with an app password if password-reset email is enabled

## Quick Start

```bash
git clone https://github.com/Talhaayubkhan/connectDev-backend.git
cd connectDev-backend
npm ci
cp .env.example .env
npm run dev
```

On Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env
```

The API listens on `http://localhost:3000` by default. Check it with:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "status": "ok"
}
```

## Environment Variables

Copy [.env.example](.env.example) and replace its placeholders. Startup fails early when required configuration is missing or invalid.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`. Defaults to `development`. |
| `PORT` | No | HTTP port from 1 to 65535. Defaults to `3000`. |
| `MONGODB_URL` | Yes | MongoDB connection URI. |
| `JWT_SECRET` | Yes | JWT signing secret with at least 32 characters. |
| `FRONTEND_URL` | Production | Comma-separated allowed frontend origins. The first origin is used in reset links. Development defaults to `http://localhost:5173`. |
| `EMAIL_USER` | Reset email | Gmail address used to send password-reset messages. |
| `EMAIL_PASS` | Reset email | Gmail app password. |
| `COOKIE_SAME_SITE` | No | `lax`, `strict`, or `none`. Defaults to `lax` outside production and `none` in production. |
| `COOKIE_SECURE` | No | `true` or `false`. Defaults to `true` in production. Must be `true` when SameSite is `none`. |

Never commit `.env`, database credentials, JWT secrets, or email app passwords.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the production entry point. |
| `npm run dev` | Start with Nodemon file watching. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run the Jest suite serially. |
| `npm run test:watch` | Run Jest in watch mode. |
| `npm run test:coverage` | Generate a coverage report. |
| `npm run check:syntax` | Parse-check every JavaScript file on Windows, macOS, or Linux. |
| `npm run check` | Run lint, tests, and syntax checks. |

## API

Successful responses use `success: true`. Failures use this stable shape:

```json
{
  "success": false,
  "message": "A safe error message."
}
```

Protected routes require the HTTP-only `token` cookie created by login. Browser clients must enable credentials on requests.

### Service

| Method | Route | Authentication | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Process health response. |

### Authentication

| Method | Route | Authentication | Request body |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | No | `firstName`, optional `lastName`, `email`, `password`, `confirmPassword` |
| `POST` | `/auth/login` | No | `email`, `password` |
| `POST` | `/auth/logout` | No | None |
| `POST` | `/auth/forgot-password` | No | `email` |
| `PATCH` | `/auth/reset-password` | No | `token`, `newPassword`, `confirmPassword` |

Login allows five failed attempts per 15-minute window, and successful logins are not counted. Forgot-password allows three requests per 15-minute window because successful requests still trigger email delivery.

Forgot-password always returns the same public success message whether an account exists or not. Reset tokens expire after 15 minutes and are stored only as hashes.

### Profiles

| Method | Route | Authentication | Notes |
| --- | --- | --- | --- |
| `GET` | `/profile/view` | Yes | Current profile, including email. |
| `GET` | `/profile/:userId` | Yes | Public profile for self or an accepted connection. Email is excluded. |
| `PATCH` | `/profile/edit` | Yes | Updates allowed profile fields only. |
| `PATCH` | `/profile/changePassword` | Yes | Body: `currentPassword`, `newPassword`. Clears the active cookie after success. |

Editable profile fields are `firstName`, `lastName`, `gender`, `age`, `about`, `skills`, `photoURL`, `location`, and `occupation`. Unknown fields and empty update objects are rejected.

### Connection Requests

| Method | Route | Authentication | Allowed status |
| --- | --- | --- | --- |
| `POST` | `/request/send/:status/:toUserId` | Yes | `interested`, `ignored` |
| `POST` | `/request/review/:status/:requestId` | Yes | `accepted`, `rejected` |

Self requests and duplicate relationships in either direction are rejected. Only the intended receiver can review a pending request.

### User Lists and Feed

| Method | Route | Authentication | Response collection |
| --- | --- | --- | --- |
| `GET` | `/user/requests/received` | Yes | `results` |
| `GET` | `/user/connections` | Yes | `data` |
| `GET` | `/user/feed?page=1&limit=10` | Yes | `data`, plus `page`, `limit`, `hasNextPage` |

Empty collections return HTTP 200 with an empty array. Feed `page` and `limit` must be positive whole numbers, and `limit` cannot exceed 50.

## Response Privacy

User responses are built through a single allowlist serializer. Password hashes, reset tokens, token versions, and internal fields are never copied into API responses. Public users include both `_id` and `id` for frontend compatibility, and current-user responses additionally include email.

`isActive` is calculated from a `lastSeen` value within the previous five minutes. It is not stored as a permanently true database flag.

## Architecture

```text
src/
├── app.js                         Express middleware and routes
├── server.js                      Database-first startup and shutdown
├── config/                        Environment and MongoDB configuration
├── routes/                        Endpoint and middleware wiring
├── controllers/                   HTTP request and response handling
├── services/                      Business rules and database operations
├── models/                        Mongoose schemas and indexes
├── middlewares/                   Authentication, status, 404, and errors
└── utils/                         Validation, serialization, pagination, email

tests/
├── unit/                          Isolated behavior and edge cases
├── integration/                   Express route and middleware behavior
└── contract/                      Backend fields required by the frontend
```

The main request flow is route to controller to service to model. Errors pass to one JSON error handler. Expected operational errors keep their safe messages, while unexpected failures are logged server-side and return a generic message.

## Security Notes

- JWTs are stored in HTTP-only cookies and expire after seven days.
- Changing or resetting a password increments `tokenVersion`, invalidating older sessions.
- Passwords are never trimmed because whitespace can be part of the chosen secret.
- CORS accepts only configured origins and still permits clients without an `Origin` header.
- JSON bodies are limited to 100 KB.
- Helmet supplies defensive HTTP headers and Express identification is disabled.
- MongoDB validation, malformed JSON, invalid IDs, duplicate keys, and oversized bodies receive controlled responses.
- Shutdown stops accepting new HTTP requests before closing Mongoose.

Use HTTPS in production. For a frontend and API on different sites, use `COOKIE_SAME_SITE=none` with `COOKIE_SECURE=true`.

## Quality and CI

Run the complete local gate before opening a pull request:

```bash
npm ci
npm run check
npm audit --omit=dev --audit-level=high
```

GitHub Actions runs the same checks on pushes to `main` and on pull requests.

## License

ISC
