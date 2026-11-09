# ConnectDev Backend Stability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tested, secure, and maintainable ConnectDev backend while preserving every API route and request shape used by the frontend.

**Architecture:** Keep the existing route, controller, service, and Mongoose model layers. Add focused configuration, serialization, pagination, error translation, and test helpers so HTTP concerns, business rules, and persistence constraints remain separate and independently testable.

**Tech Stack:** Node.js 22, Express 5, Mongoose 9, JWT, bcrypt, Nodemailer, Jest, Supertest, ESLint, Helmet, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-28-backend-stability-hardening-design.md`

## Global Constraints

- Modify only `connectDev-backend`.
- Preserve all existing frontend facing route paths and request shapes.
- Do not add chat, Socket.IO, Google AI features, or a destructive data migration.
- Do not expose passwords, password hashes, reset tokens, JWTs, email credentials, database URLs, or stack traces.
- Keep comments only where they explain a non-obvious reason. Use concise `WHY` comments for security, validation, cookie, race, or database decisions.
- Remove dead commented implementations and edit-history comments such as `CHANGED`, `ADDED`, and `REMOVED`.
- Use Node.js 22 or newer.
- Every behavior change follows a failing test, minimal implementation, passing test, and focused commit.

## File Structure

### New files

- `.env.example`: safe runtime configuration template.
- `.github/workflows/backend-quality.yml`: CI quality gate.
- `eslint.config.js`: Node and Jest lint configuration.
- `jest.config.js`: deterministic Node test environment.
- `src/config/env.js`: validated environment access.
- `src/middlewares/notFound.js`: consistent JSON 404 response.
- `src/utils/userSerializer.js`: safe user responses and derived recent activity.
- `src/utils/pagination.js`: strict page and limit parsing.
- `tests/helpers/createMockResponse.js`: controller response test helper.
- `tests/helpers/setTestEnv.js`: safe test environment defaults.
- Focused test files under `tests/unit`, `tests/integration`, and `tests/contract`.

### Existing files to modify

- `package.json`, `package-lock.json`: scripts, supported engine, dependencies, and development tools.
- `src/app.js`: security middleware, body limit, health route, routers, not found, and errors.
- `src/server.js`: validated startup and graceful shutdown.
- `src/config/database.js`: connection lifecycle without duplicate listener registration.
- `src/middlewares/auth.js`: safe JWT handling and throttled last seen updates.
- `src/middlewares/errorHandler.js`: framework and database error normalization.
- `src/routes/authRouter.js`: apply sensitive route rate limits.
- `src/controllers/*.js`: consistent responses and validated service arguments.
- `src/services/*.js`: repaired auth, password, profile, connection, and feed rules.
- `src/models/*.js`: persistence constraints and safe defaults.
- `src/utils/constants.js`: public field lists and cookie or CORS configuration.
- `src/utils/rateLimiting.js`: consistent limiter responses.
- `src/utils/validation.js`: current feature validation only.
- `src/utils/email/*.js`: safe configuration and reset email behavior.
- `README.md`: current backend documentation.

### Files to remove

- `src/utils/changePasswordDTO.js`: unused abstraction.

---

### Task 1: Quality Harness and Dependency Baseline

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `eslint.config.js`
- Create: `jest.config.js`
- Create: `scripts/checkSyntax.js`
- Create: `tests/helpers/setTestEnv.js`
- Create: `tests/unit/validation.test.js`

**Interfaces:**

- Produces: npm scripts `lint`, `test`, `test:watch`, `test:coverage`, `check:syntax`, and `check`.
- Produces: Jest globals and test environment defaults used by all later tasks.
- Consumes: existing CommonJS source layout.

- [ ] **Step 1: Write the first failing validation test**

Create `tests/unit/validation.test.js` with a regression showing that password change validation accepts `(currentPassword, newPassword)` without requiring a controller-only confirmation value:

```js
require("../helpers/setTestEnv");

const { validatePasswordChange } = require("../../src/utils/validation");

describe("password change validation", () => {
  test("accepts a valid new password without changing its value", () => {
    expect(
      validatePasswordChange("CurrentPass1!", "NewStrongPass2!"),
    ).toBe("NewStrongPass2!");
  });
});
```

- [ ] **Step 2: Run the test command to confirm the missing harness**

Run: `npm test`

Expected: FAIL because no test script or Jest installation exists.

- [ ] **Step 3: Install only required dependencies**

Run:

```bash
npm uninstall @google/genai socket.io mongodb
npm install helmet
npm install --save-dev jest supertest nodemon eslint @eslint/js globals
npm audit fix
```

Add Node `>=22` and scripts:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint .",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --runInBand",
    "check:syntax": "node scripts/checkSyntax.js",
    "check": "npm run lint && npm test && npm run check:syntax"
  }
}
```

- [ ] **Step 4: Configure Jest and ESLint**

Create `jest.config.js`:

```js
module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
};
```

Create test environment defaults that never contain real secrets:

```js
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
process.env.MONGODB_URL = "mongodb://127.0.0.1:27017/connectdev_test";
process.env.FRONTEND_URL = "http://localhost:5173";
```

Configure ESLint for Node globals in `src`, Jest globals in `tests`, recommended JavaScript rules, and ignored `coverage` and `node_modules` directories.

Create `scripts/checkSyntax.js` to walk `src` and `tests`, then run the current Node executable with `--check` for each JavaScript file. This keeps the quality command portable across Windows, macOS, and Linux.

- [ ] **Step 5: Run the focused test and record the expected behavior failure**

Run: `npm test -- tests/unit/validation.test.js`

Expected: FAIL because the current `validatePasswordChange` requires three values and returns `true`.

- [ ] **Step 6: Run the dependency audit**

Run: `npm audit --audit-level=moderate`

Expected: 0 vulnerabilities after compatible fixes.

- [ ] **Step 7: Commit the harness**

```bash
git add package.json package-lock.json eslint.config.js jest.config.js scripts/checkSyntax.js tests/helpers/setTestEnv.js tests/unit/validation.test.js
git commit -m "test: add backend quality harness"
```

---

### Task 2: Runtime Configuration, HTTP Safety, and Error Responses

**Files:**

- Create: `.env.example`
- Create: `src/config/env.js`
- Create: `src/middlewares/notFound.js`
- Create: `tests/integration/app.test.js`
- Create: `tests/unit/errorHandler.test.js`
- Modify: `src/app.js`
- Modify: `src/server.js`
- Modify: `src/config/database.js`
- Modify: `src/middlewares/errorHandler.js`
- Modify: `src/utils/constants.js`

**Interfaces:**

- Produces: `getRuntimeConfig(env)`, `getCookieOptions(config)`, and `getCorsOptions(config)`.
- Produces: `startServer()` returning the HTTP server and `shutdown(signal)` closing HTTP and Mongoose resources.
- Produces: `GET /health` returning `{ success: true, status: "ok" }`.
- Consumes: `AppError` subclasses and all existing routers.

- [ ] **Step 1: Write failing application safety tests**

Use Supertest to assert:

```js
expect((await request(app).get("/health")).status).toBe(200);
expect((await request(app).get("/missing-route")).body).toEqual({
  success: false,
  message: "Route not found.",
});
```

Also send malformed JSON and an oversized JSON body. Expect controlled 400 and 413 JSON responses rather than Express HTML.

- [ ] **Step 2: Run the application tests to verify failure**

Run: `npm test -- tests/integration/app.test.js tests/unit/errorHandler.test.js`

Expected: FAIL because health, JSON 404, body limit, Helmet, and normalized parser errors do not exist.

- [ ] **Step 3: Add validated runtime configuration**

Implement `getRuntimeConfig(env = process.env)` that returns:

```js
{
  nodeEnv,
  port,
  mongoUrl,
  jwtSecret,
  frontendOrigins,
  emailUser,
  emailPass,
  cookieSameSite,
  cookieSecure
}
```

Require `MONGODB_URL` and a JWT secret of at least 32 characters during server startup. Parse `FRONTEND_URL` as a comma separated list of valid HTTP or HTTPS origins. Default to `http://localhost:5173` only outside production.

- [ ] **Step 4: Harden the Express application**

Apply middleware in this order:

```js
app.disable("x-powered-by");
app.use(helmet());
app.use(cors(getCorsOptions(config)));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
```

Add `/health`, mount existing routers, add `notFound`, then add `errorHandler` last.

- [ ] **Step 5: Normalize known framework and database errors**

Translate errors before choosing the response:

```js
if (err.type === "entity.parse.failed") return new ValidationError("Malformed JSON body.");
if (err.type === "entity.too.large") return new PayloadTooLargeError("Request body is too large.");
if (err.name === "CastError") return new ValidationError("Invalid resource ID.");
if (err.name === "ValidationError") return new ValidationError(firstMongooseMessage(err));
if (err.code === 11000) return new ConflictError("Resource already exists.");
```

Add a 413 `PayloadTooLargeError` subclass. Keep unexpected error messages and stacks server side.

- [ ] **Step 6: Add safe startup and graceful shutdown**

Export `startServer` for tests. Connect to MongoDB before listening. Capture the HTTP server, handle `SIGINT` and `SIGTERM`, stop accepting requests, close Mongoose, and exit with the correct status. Exit with status 1 for startup failure and unhandled rejections.

Register MongoDB connection listeners once, outside repeated connection attempts.

- [ ] **Step 7: Run focused and full checks**

Run:

```bash
npm test -- tests/integration/app.test.js tests/unit/errorHandler.test.js
npm run lint
npm run check:syntax
```

Expected: all pass.

- [ ] **Step 8: Commit runtime hardening**

```bash
git add .env.example src/config src/app.js src/server.js src/middlewares src/utils/errors src/utils/constants.js tests/integration/app.test.js tests/unit/errorHandler.test.js
git commit -m "feat: harden backend runtime and error handling"
```

---

### Task 3: Validation, Safe User Serialization, and Activity

**Files:**

- Create: `src/utils/userSerializer.js`
- Create: `src/utils/pagination.js`
- Create: `tests/unit/userSerializer.test.js`
- Create: `tests/unit/pagination.test.js`
- Modify: `tests/unit/validation.test.js`
- Modify: `src/utils/validation.js`
- Modify: `src/utils/constants.js`
- Modify: `src/models/userSchema.js`
- Modify: `src/middlewares/auth.js`

**Interfaces:**

- Produces: `serializeUser(user, { includeEmail = false } = {})`.
- Produces: `isRecentlyActive(lastSeen, now = Date.now())` using a five minute window.
- Produces: `parsePagination(query, { defaultLimit = 10, maxLimit = 50 } = {})`.
- Produces: `validateNewPassword(password)`, `validatePasswordChange(currentPassword, newPassword)`, `validateProfileData(data)`, and `requireObjectId(value, fieldName)`.

- [ ] **Step 1: Expand failing validation and serializer tests**

Test exact password preservation, invalid field types, empty update rejection, photo URL, biography length, gender, age 18 to 100, 15 skill maximum, 30 character skill maximum, and case insensitive duplicate skills.

Test that serializers include both `_id` and `id`, omit password and reset fields, include email only when requested, include location and occupation, and derive `isActive` from `lastSeen`.

Test pagination rejects `0`, negative values, decimals, `2abc`, arrays, and values above the maximum while accepting missing values with defaults.

- [ ] **Step 2: Run focused tests to verify failures**

Run:

```bash
npm test -- tests/unit/validation.test.js tests/unit/userSerializer.test.js tests/unit/pagination.test.js
```

Expected: FAIL on current validation signatures, missing serializers, and permissive `parseInt` behavior.

- [ ] **Step 3: Implement current feature validation only**

Remove unused chat validation functions. Do not call `.trim()` on passwords:

```js
// WHY: silently trimming changes the user's secret and makes login behavior surprising.
const validateNewPassword = (password) => {
  if (typeof password !== "string") throw new ValidationError("Password is required.");
  validatePasswordCore(password);
  return password;
};
```

Make profile validation return a new sanitized object rather than mutating `req.body`.

- [ ] **Step 4: Implement safe serialization and recent activity**

Use a five minute window:

```js
const isRecentlyActive = (lastSeen, now = Date.now()) =>
  Boolean(lastSeen) && now - new Date(lastSeen).getTime() <= 5 * 60 * 1000;
```

Return `_id`, `id`, names, optional email, photo, age, gender, biography, skills, location, occupation, derived `isActive`, `lastSeen`, and timestamps. Never spread the original document into the response.

- [ ] **Step 5: Align model constraints and auth activity updates**

Align age maximum to 100, biography maximum to 300, and skill item length to 30. Stop writing `isActive`. Update only `lastSeen` when older than one minute and derive activity in serializers.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
npm test -- tests/unit/validation.test.js tests/unit/userSerializer.test.js tests/unit/pagination.test.js
npm run check
```

Expected: all pass.

- [ ] **Step 7: Commit shared validation**

```bash
git add src/utils src/models/userSchema.js src/middlewares/auth.js tests/unit
git commit -m "refactor: centralize backend validation and user responses"
```

---

### Task 4: Authentication and Password Recovery

**Files:**

- Create: `tests/unit/authServices.test.js`
- Create: `tests/unit/profilePassword.test.js`
- Create: `tests/integration/authRoutes.test.js`
- Modify: `src/routes/authRouter.js`
- Modify: `src/controllers/authController.js`
- Modify: `src/controllers/profileController.js`
- Modify: `src/services/authServices.js`
- Modify: `src/services/profileService.js`
- Modify: `src/utils/rateLimiting.js`
- Modify: `src/utils/email/sendEmail.js`
- Modify: `src/utils/email/resetPasswordTemplate.js`
- Delete: `src/utils/changePasswordDTO.js`

**Interfaces:**

- Consumes: `validateNewPassword`, `validatePasswordChange`, `serializeUser`, and validated runtime cookie options.
- Produces: stable signup, login, logout, forgot password, reset password, and profile password change behavior.

- [ ] **Step 1: Write failing authentication regression tests**

Cover:

- Login route invokes `loginLimiter` before the controller.
- Signup and login do not trim passwords.
- Duplicate email code `11000` becomes 409.
- Login uses the same message for missing users and wrong passwords.
- Password change accepts `{ currentPassword, newPassword }`, rejects wrong current password and reuse, increments `tokenVersion`, and clears the cookie.
- Reset rejects missing, malformed, expired, mismatched, and weak inputs.
- Successful reset clears token fields and increments `tokenVersion`.
- Failed reset email delivery clears the stored token and expiration.

- [ ] **Step 2: Run focused tests to verify failures**

Run:

```bash
npm test -- tests/unit/authServices.test.js tests/unit/profilePassword.test.js tests/integration/authRoutes.test.js
```

Expected: FAIL for the broken password change, missing login limiter, and reset cleanup behavior.

- [ ] **Step 3: Repair authentication controllers and services**

Use shared validators and `serializeUser`. Keep public forgot password responses identical for missing and existing accounts. Apply the limiter:

```js
router.post("/auth/login", loginLimiter, userLogin);
```

Pass only the two values supported by the frontend to password change. Validate the new password with shared rules, compare it with the current hash, increment `tokenVersion`, and save.

- [ ] **Step 4: Make reset email state recoverable**

Wrap delivery and clear only the token generated by this request if delivery fails:

```js
try {
  await sendEmail(...);
} catch (error) {
  await User.updateOne(
    { _id: user._id, resetPasswordToken: hashedToken },
    { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
  );
  throw error;
}
```

The `WHY` comment will explain that a failed delivery must not block retry for the full expiration window.

- [ ] **Step 5: Standardize limiter JSON**

Return `{ success: false, message }` from login and forgot password limiters, use standard headers, and disable legacy headers.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
npm test -- tests/unit/authServices.test.js tests/unit/profilePassword.test.js tests/integration/authRoutes.test.js
npm run check
```

Expected: all pass.

- [ ] **Step 7: Commit authentication repairs**

```bash
git add src/routes/authRouter.js src/controllers src/services src/utils/rateLimiting.js src/utils/email tests
git rm src/utils/changePasswordDTO.js
git commit -m "fix: repair authentication and password flows"
```

---

### Task 5: Profile Contract and Validation

**Files:**

- Create: `tests/unit/profileService.test.js`
- Create: `tests/contract/profileContract.test.js`
- Modify: `src/controllers/profileController.js`
- Modify: `src/services/profileService.js`
- Modify: `src/routes/profileRouter.js`

**Interfaces:**

- Consumes: `serializeUser`, `validateProfileData`, and `requireObjectId`.
- Produces: consistent current, updated, and public profile response fields.

- [ ] **Step 1: Write failing profile tests**

Test that current profile includes email, `_id`, `id`, location, and occupation. Test that public profiles exclude email. Test invalid IDs before database access, empty updates, unknown fields, wrong types, and normalized valid updates.

- [ ] **Step 2: Run focused tests to verify failures**

Run: `npm test -- tests/unit/profileService.test.js tests/contract/profileContract.test.js`

Expected: FAIL because current serializers drift and profile validation is incomplete.

- [ ] **Step 3: Use one serializer across profile controllers**

Use `serializeUser(req.user, { includeEmail: true })` for current profile and updates. Use `serializeUser(user)` for another user's profile. Do not manually duplicate allowlists in controllers.

- [ ] **Step 4: Validate then apply only sanitized fields**

Make `updateProfileService(body, user)` call `validateProfileData`, then set only returned entries. If a normalized optional field is `undefined`, use `user.set(field, undefined)` deliberately so clearing the frontend field works.

- [ ] **Step 5: Resolve user existence before connection access decision**

Validate the ID, load the safe target profile, return 404 if missing, permit self view, then require an accepted connection for other users. Return 403 without leaking internal connection information.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
npm test -- tests/unit/profileService.test.js tests/contract/profileContract.test.js
npm run check
```

Expected: all pass.

- [ ] **Step 7: Commit profile repairs**

```bash
git add src/controllers/profileController.js src/services/profileService.js src/routes/profileRouter.js tests/unit/profileService.test.js tests/contract/profileContract.test.js
git commit -m "fix: align profile validation and response contracts"
```

---

### Task 6: Connection Requests, Lists, and Feed

**Files:**

- Create: `tests/unit/connectionRequestService.test.js`
- Create: `tests/unit/userController.test.js`
- Create: `tests/contract/frontendApiContract.test.js`
- Modify: `src/models/connectionSchema.js`
- Modify: `src/services/connectionRequestService.js`
- Modify: `src/controllers/connectionRequestController.js`
- Modify: `src/controllers/userController.js`
- Modify: `src/routes/connectionRequestRoutes.js`

**Interfaces:**

- Consumes: `requireObjectId`, `parsePagination`, public user field lists, and error classes.
- Produces: deterministic request conflicts, empty list success responses, strict feed pagination, and fields required by the frontend cards.

- [ ] **Step 1: Write failing connection and feed tests**

Cover invalid receiver and request IDs, missing users, self requests, same direction duplicates, reverse direction duplicates, duplicate key races, unauthorized review, nonpending review, empty lists, accepted connection mapping, malformed pagination, page maximum, and frontend field presence.

- [ ] **Step 2: Run focused tests to verify failures**

Run:

```bash
npm test -- tests/unit/connectionRequestService.test.js tests/unit/userController.test.js tests/contract/frontendApiContract.test.js
```

Expected: FAIL because the existing duplicate query result is ignored, IDs are not validated, empty lists throw 404, and pagination is permissive.

- [ ] **Step 3: Repair request creation and review**

Validate IDs before database calls. Reject self requests. Use the existing request result:

```js
const existing = await ConnectionRequest.findOne({
  $or: [
    { senderUserId: senderId, receiverUserId: receiverId },
    { senderUserId: receiverId, receiverUserId: senderId },
  ],
});
if (existing) throw new ConflictError("A connection request already exists.");
```

Catch duplicate code `11000` and translate it to the same conflict. Keep receiver ownership and `interested` state in the atomic review query.

- [ ] **Step 4: Return successful empty collections**

Controllers return status 200, `count: 0`, and `results: []` or `data: []` using the existing response field expected for each endpoint. Add a `WHY` comment explaining that an empty collection is a valid query result, not a missing resource.

- [ ] **Step 5: Use strict pagination and remove stale activity filtering**

Call `parsePagination(req.query)` and pass its `skip` and `limit` to the service. Remove `isActive: true` from the user query. Continue excluding all users with an existing relationship in either direction.

- [ ] **Step 6: Align public fields with frontend cards**

Include `_id`, names, photo, age, gender, biography, skills, location, occupation, `lastSeen`, and derived recent activity in feed, connections, requests, and public profile results.

- [ ] **Step 7: Run focused and full tests**

Run:

```bash
npm test -- tests/unit/connectionRequestService.test.js tests/unit/userController.test.js tests/contract/frontendApiContract.test.js
npm run check
```

Expected: all pass.

- [ ] **Step 8: Commit connection repairs**

```bash
git add src/models/connectionSchema.js src/services/connectionRequestService.js src/controllers src/routes/connectionRequestRoutes.js tests
git commit -m "fix: harden connection requests and feed behavior"
```

---

### Task 7: Documentation, CI, and Final Verification

**Files:**

- Create: `.github/workflows/backend-quality.yml`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: all changed production files for comment cleanup only

**Interfaces:**

- Consumes: all scripts and behavior from Tasks 1 through 6.
- Produces: accurate contributor documentation and automated repository checks.

- [ ] **Step 1: Replace stale README content**

Document only implemented authentication, password recovery, profiles, connection requests, lists, feed, health endpoint, environment values, cookies, error shape, scripts, architecture, tests, security, and frontend repository link. Remove all chat, Socket.IO, AI, message, and nonexistent file sections.

- [ ] **Step 2: Add the environment template and ignore generated output**

Ensure `.env.example` contains safe placeholders for `NODE_ENV`, `PORT`, `MONGODB_URL`, `JWT_SECRET`, `FRONTEND_URL`, `EMAIL_USER`, `EMAIL_PASS`, `COOKIE_SAME_SITE`, and `COOKIE_SECURE`. Ignore `.env`, `coverage`, logs, and local editor output.

- [ ] **Step 3: Add GitHub Actions**

Create a Node 22 workflow for pushes to `main` and pull requests:

```yaml
- run: npm ci
- run: npm run lint
- run: npm test
- run: npm run check:syntax
- run: npm audit --omit=dev --audit-level=high
```

- [ ] **Step 4: Remove dead comments and verify useful reasons remain**

Run:

```bash
rg -n '^\s*//|/\*|console\.|TODO|FIXME|CHANGED|ADDED|REMOVED|WHY' src
```

Delete dead implementations and editing history. Keep only short current design comments that explain non-obvious security, validation, cookie, race, email rollback, empty collection, and activity decisions.

- [ ] **Step 5: Review the frontend contract**

Compare backend routes and response fields with `connectDev-frontend/src/services`, hooks, and cards. Confirm password reset receives `token`, `newPassword`, and `confirmPassword`; password change receives `currentPassword` and `newPassword`; request lists use `results`; connections and profiles use `data`; and feed uses `data`, `hasNextPage`, `page`, and `limit`.

- [ ] **Step 6: Run final verification from a clean dependency install**

Run:

```bash
npm ci
npm run lint
npm test
npm run check:syntax
npm audit --omit=dev --audit-level=high
git diff --check
git status --short
```

Expected: lint passes, all tests pass, every JavaScript file parses, production audit reports zero high vulnerabilities, whitespace validation passes, and only intended tracked changes remain before the final commit.

- [ ] **Step 7: Commit documentation and CI**

```bash
git add .github .env.example .gitignore README.md src package.json package-lock.json tests eslint.config.js jest.config.js
git commit -m "chore: document and automate backend quality"
```

- [ ] **Step 8: Publish and open the pull request**

Push `codex/backend-stability-hardening` and open a pull request against `main` with confirmed bugs, compatibility decisions, security changes, test counts, audit result, and verification commands. Preserve the branch for review feedback.
