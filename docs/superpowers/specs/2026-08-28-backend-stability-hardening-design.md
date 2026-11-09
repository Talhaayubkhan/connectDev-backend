# ConnectDev Backend Stability Hardening Design

Date: 2026-08-28

## Goal

Improve the ConnectDev backend for reliability, security, maintainability, and production readiness while preserving the API contract used by `connectDev-frontend`.

This pass covers the backend repository only. It does not add chat, AI features, or breaking endpoint changes.

## Current Problems

The initial audit confirmed several functional and operational problems:

- Password change always fails because its validator is called with the wrong arguments.
- The login rate limiter is imported but not applied to the login route.
- Connection request duplicate checks discard their result, allowing duplicate attempts to become unexpected database errors.
- Connection and profile identifiers are not consistently validated before database queries.
- Profile validation does not fully cover biography, photo URL, gender, skill limits, case insensitive duplicates, and field types.
- Valid empty request and connection lists return 404 instead of successful empty arrays.
- Current user responses differ between login, profile view, and profile update.
- Presence depends on an `isActive` value that is set but never reliably cleared.
- Password reset email failure can leave a stored reset token that blocks immediate retry.
- Mongoose validation, cast, duplicate key, malformed JSON, and CORS failures are not normalized consistently.
- The server does not validate its configuration before startup or shut down gracefully.
- The API lacks a JSON 404 response, health endpoint, request size limit, and secure HTTP headers.
- The project has no tests, lint command, or continuous integration checks.
- Development requires Nodemon, but Nodemon is not installed.
- The dependency audit reports a high severity vulnerability.
- Removed chat and socket behavior remains in dependencies, validation helpers, and README documentation.
- Production files contain large dead code blocks and comments that describe edit history instead of current decisions.

## Scope and Compatibility

Existing frontend routes and request shapes will remain supported:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `PATCH /auth/reset-password`
- `GET /profile/view`
- `GET /profile/:userId`
- `PATCH /profile/edit`
- `PATCH /profile/changePassword`
- `POST /request/send/:status/:toUserId`
- `POST /request/review/:status/:requestId`
- `GET /user/requests/received`
- `GET /user/connections`
- `GET /user/feed`

The implementation may add nonbreaking operational routes such as `GET /health`.

The response contract will become more consistent without removing fields the frontend uses. Safe user responses will include `_id` and `id` for compatibility, plus the profile fields required by navigation, profile forms, feed cards, and connection cards.

## Architecture

The current route to controller to service to model structure will remain. Responsibilities will be clarified:

- Routes apply authentication, rate limiting, and parameter status validation.
- Controllers translate HTTP input into service arguments and serialize responses.
- Services contain business rules and database operations.
- Validation utilities return normalized values and reject invalid input before database work.
- Models enforce final persistence constraints.
- The error middleware converts known framework and database errors into the shared JSON error shape.

Shared serializers, configuration helpers, and pagination validation will prevent endpoint behavior from drifting.

## Authentication and Password Flows

### Signup and login

Signup will validate a plain object, normalize email, preserve the submitted password exactly, enforce password strength, and convert duplicate email races into a 409 response. Login will use the same normalized email and will not trim or modify the password before comparison.

Login rate limiting will be applied at the route. Authentication failures will continue to use a shared message so the API does not reveal whether an email exists.

### Cookies and sessions

Cookie settings will come from validated runtime configuration. Cookies remain HTTP only and scoped to `/`. Production secure and same site behavior will be explicit so deployments can support the actual frontend and backend origins.

Password change and password reset will increment `tokenVersion`, invalidating previously issued sessions. Cookie clearing will use the same identity options as cookie creation.

### Password reset

Forgot password will keep the same response for existing and missing accounts. Reset tokens will be random, stored only as hashes, and expire after 15 minutes. If email delivery fails, the stored token and expiration will be cleared so the user can retry.

The reset link will be built from a validated frontend URL. Email configuration will be checked when the reset flow needs it, not exposed in responses or logs.

## Profile Behavior

Profile updates will accept only the current allowed fields and reject an empty update. Validation will normalize strings without silently accepting the wrong types.

Rules will cover:

- Required first and last names with supported lengths
- Optional age within the model and frontend range
- Optional gender from the supported values
- Optional valid photo URL
- Biography, location, and occupation length limits
- Skills as an array of trimmed strings
- A maximum of 15 skills
- Skill length limits
- Case insensitive duplicate skill rejection

Password change will validate the current password, validate the new password using shared password rules, reject reuse of the current password, save the new hash, invalidate prior sessions, and clear the current cookie.

Public profile access will validate the user ID first and return controlled 404 or 403 responses. Profile serializers will prevent password hashes, reset tokens, token versions, and other internal fields from leaving the API.

## Connections, Requests, and Feed

Connection operations will validate user and request IDs before querying MongoDB. Self requests will be rejected. Existing requests in either direction will be handled deliberately instead of relying on a duplicate key crash.

Database duplicate key races will be converted into a conflict response. Request review will remain limited to the intended receiver and pending `interested` requests.

Valid empty request and connection lists will return status 200 with empty arrays and a count of zero.

Feed pagination will accept strict positive integers only, cap the page size, and reject malformed values such as `2abc`. The feed will exclude the current user and anyone who already has a request relationship with that user.

The feed will not filter on the unreliable stored `isActive` flag. Activity returned to the frontend will be derived from `lastSeen` using a documented recent activity window.

## Security and Runtime Safety

The server will add:

- Helmet security headers
- A small JSON request body limit
- Consistent rate limiting on sensitive authentication routes
- Validated frontend origins and credentialed CORS behavior
- Startup validation for required database and JWT configuration
- A health endpoint suitable for deployment checks
- A JSON not found handler
- Graceful HTTP and MongoDB shutdown on termination signals
- Controlled handling for startup failure and unhandled promise rejection

The global error handler will normalize known Mongoose, MongoDB, Express JSON, JWT, and CORS errors. Unexpected failures will be logged on the server with their stack and returned to clients as a generic 500 response.

No password, reset token, JWT, email credential, database URL, or internal stack trace will be returned to clients.

## Comments and Code Cleanup

Comments will be added only where the reason cannot be understood from the code itself. Useful examples include:

- Why password values are not trimmed
- Why account lookup errors share the same login message
- Why email reset tokens are rolled back after delivery failure
- Why empty collections return 200
- Why database duplicate errors need translation
- Why recent activity is derived from `lastSeen`

Dead commented implementations and comments beginning with edit history terms such as `CHANGED`, `ADDED`, or `REMOVED` will be removed. Comments will describe the current design, not the history of an edit.

## Dependencies and Tooling

Unused Google AI, Socket.IO, direct MongoDB driver, and dead password DTO dependencies or files will be removed after confirming there are no consumers.

Runtime dependencies will receive compatible security and maintenance updates. Nodemon will be added as a development dependency. Jest, Supertest, ESLint, and any small test support packages needed for isolated backend testing will be added as development dependencies.

Major dependency upgrades that require unrelated migrations are outside this stability pass.

## Testing Strategy

Tests will avoid the real production database and external email service. Model and email boundaries will be mocked where appropriate, while Supertest will verify Express middleware and response contracts.

Coverage will include:

- Signup, login, cookie, and rate limiting behavior
- Password strength, mismatch, reuse, reset, and token expiration
- Reset email failure cleanup
- Authentication middleware with missing, invalid, expired, and outdated tokens
- Profile allowlist and validation boundaries
- Safe user serialization
- Invalid, self, duplicate, and reverse connection failures, including duplicate key races
- Request ownership and state transitions
- Empty request and connection responses
- Feed pagination defaults, maximums, and malformed values
- Malformed JSON, missing routes, CORS rejection, and database error normalization
- Health endpoint response

The test suite will be deterministic and will not require MongoDB, Gmail, or deployment secrets.

## Documentation and Continuous Integration

The repository will receive:

- An accurate `.env.example` with safe placeholder values
- A professional README that documents only implemented behavior
- Scripts for development, linting, tests, coverage, syntax checks, and a combined verification command
- A GitHub Actions workflow that installs dependencies, runs lint and tests, checks JavaScript syntax, builds or verifies startup modules as appropriate, and audits production dependencies for high severity vulnerabilities

Chat, Socket.IO, message models, and nonexistent file references will be removed from the README.

## Verification and Delivery

Before delivery, the branch will run:

- ESLint
- Full Jest test suite
- JavaScript syntax checks
- Production dependency audit
- Git whitespace validation
- A frontend to backend endpoint and response contract review

The verified branch will be published and opened as a pull request against `main`. The backend worktree will remain available for pull request feedback.

## Out of Scope

- Adding real time chat
- Adding Google AI features
- Renaming existing frontend facing endpoints
- Replacing MongoDB or Mongoose
- A destructive connection data migration
- Deployment to a production hosting provider
