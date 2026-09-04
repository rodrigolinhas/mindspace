# MindSpace V1 — HTTP API & SQLite Schema Specification

This document provides a comprehensive, evidence-based inventory of the MindSpace V1 HTTP API surface, request/response contracts, and SQLite persistence model as implemented in the baseline codebase (`23ce400f45971e48de30f30996914da24e2005b8`).

---

## 1. Express HTTP API Inventory

The backend server mounts three modular routers under `/api`:
- `/api/users` -> `server/src/routes/users.ts`
- `/api/entries` -> `server/src/routes/entries.ts`
- `/api/quotes` -> `server/src/routes/quotes.ts`

Global middleware applied prior to route dispatch in `server/src/server.ts`:
1. `helmet()` (security headers)
2. `globalLimiter` (100 requests / 1 min / IP)
3. `cors(...)` (allowed origins: `http://localhost:5174`, `http://localhost:3000`, `process.env.CLIENT_URL`)
4. `express.json({ limit: "10kb" })`

---

### 1.1 Endpoint Directory

| Method | Path | Middleware Pipeline | Auth Required | Role / Permissions | Controller Handler |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | None | No | Public | Inline: `(req, res) => res.send(...)` |
| `POST` | `/api/users/signup` | `authLimiter` | No | Public (accepts `role`) | `createUser` (`usersController.ts`) |
| `POST` | `/api/users/login` | `authLimiter` | No | Public | `loginUser` (`usersController.ts`) |
| `GET` | `/api/users` | `verifyToken` | Yes | Authenticated (Any role) | `getAllUsers` (`usersController.ts`) |
| `PUT` | `/api/users/:id` | `verifyToken` | Yes | Self or Admin | `updateUser` (`usersController.ts`) |
| `DELETE` | `/api/users/:id` | `verifyToken` | Yes | Self or Admin (Admin non-self) | `deleteUser` (`usersController.ts`) |
| `GET` | `/api/entries` | `verifyToken` | Yes | Authenticated (Owner only) | `getAllEntries` (`entriesController.ts`) |
| `POST` | `/api/entries` | `verifyToken` | Yes | Authenticated (Owner only) | `createEntry` (`entriesController.ts`) |
| `DELETE` | `/api/entries/:id` | `verifyToken` | Yes | Authenticated (Owner only) | `deleteEntry` (`entriesController.ts`) |
| `GET` | `/api/quotes` | None | No | Public | `getAllQuotes` (`quotesController.ts`) |
| `GET` | `/api/quotes/random`| None | No | Public | `getRandomQuote` (`quotesController.ts`) |

---

### 1.2 Route Details & Operational Traces

#### `GET /`
- **Purpose**: Server health / sanity check.
- **Auth**: None.
- **Response**: `200 OK`, text/html: `"Mindspace API running (secured)"`.

---

#### `POST /api/users/signup`
- **File**: `server/src/routes/users.ts:23`, `server/src/controllers/usersController.ts:33-63`
- **Middleware**: `authLimiter` (10 requests per 15 min per IP)
- **Authentication**: None.
- **Authorization**: Public.
- **Input Validation**: `signupSchema` (`server/src/middlewares/validation.ts:25-40`):
  ```typescript
  z.object({
    username: z.string().min(2).max(50).regex(/^[\w]+$/),
    email: z.string().email().max(100),
    password: z.string().min(3).max(100),
    role: z.enum(["admin", "user"]).optional().default("user"),
  })
  ```
- **Database Operations**:
  1. Hashes password: `await bcrypt.hash(password, 10)`
  2. Inserts row: `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`
  3. Queries created row: `SELECT id, username, email, role, created_at FROM users WHERE id = ?`
- **Token Generation**: Generates JWT via `generateToken(user)` (contains `id, username, email, role, created_at`).
- **Response**:
  - Success: `201 Created`
    ```json
    {
      "id": 24,
      "username": "newuser",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2026-09-04 20:45:00",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - Validation Failure: `400 Bad Request`
    ```json
    {
      "error": "Invalid data",
      "details": ["Username must be at least 2 characters"]
    }
    ```
  - Database Conflict / Server Error: `500 Internal Server Error`
    ```json
    { "error": "Failed to create user" }
    ```

---

#### `POST /api/users/login`
- **File**: `server/src/routes/users.ts:26`, `server/src/controllers/usersController.ts:68-97`
- **Middleware**: `authLimiter` (10 requests per 15 min per IP)
- **Authentication**: None.
- **Authorization**: Public.
- **Input Validation**: `loginSchema` (`server/src/middlewares/validation.ts:9-22`):
  ```typescript
  z.object({
    username: z.string().min(2).max(50).regex(/^[\w]+$/),
    password: z.string().min(1).max(100),
  })
  ```
- **Database Operations**:
  1. Finds user: `SELECT * FROM users WHERE username = ?`
  2. Compares hash: `await bcrypt.compare(password, user.password)`
- **Token Generation**: Passes the complete retrieved database row (which includes `user.password` bcrypt hash) into `generateToken(user)`.
- **Response**:
  - Success: `200 OK`
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "role": "admin",
      "username": "Rodrigo",
      "id": 3
    }
    ```
  - User Not Found: `404 Not Found`
    ```json
    { "error": "User not found" }
    ```
  - Invalid Password: `401 Unauthorized`
    ```json
    { "error": "Incorrect password" }
    ```
  - Validation Failure: `400 Bad Request`
  - Server Error: `500 Internal Server Error`

---

#### `GET /api/users`
- **File**: `server/src/routes/users.ts:20`, `server/src/controllers/usersController.ts:17-28`
- **Middleware**: `verifyToken` (`server/src/middlewares/auth.ts:54-65`)
- **Authentication**: Bearer JWT required in `Authorization` header.
- **Authorization**: **Unrestricted to any authenticated user** (missing role check).
- **Database Operations**:
  `SELECT id, username, email, role, created_at FROM users`
- **Response**:
  - Success: `200 OK`
    ```json
    [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@mail.com",
        "role": "admin",
        "created_at": "2024-01-14T09:30:00Z"
      }
    ]
    ```
  - Missing Token: `401 Unauthorized` (`{ "message": "Token missing" }`)
  - Invalid/Expired Token: `403 Forbidden` (`{ "message": "Invalid token" }`)
  - Server Error: `500 Internal Server Error`

---

#### `PUT /api/users/:id`
- **File**: `server/src/routes/users.ts:29`, `server/src/controllers/usersController.ts:140-215`
- **Middleware**: `verifyToken`
- **Authentication**: Bearer JWT required.
- **Authorization / Ownership Rules**:
  - `requestingUser.role !== 'admin' && requestingUser.id !== Number(id)` -> `403 Forbidden` (`{ "error": "No permission to edit this user" }`).
  - If `role` is provided and `requestingUser.role !== 'admin'` -> `403 Forbidden` (`{ "error": "Only administrators can change roles" }`).
- **Input Validation**: `updateUserSchema` (`validation.ts:51-61`):
  ```typescript
  z.object({
    username: z.string().min(2).max(50).regex(/^[\w]+$/).optional(),
    email: z.string().email().max(100).optional(),
    password: z.string().min(3).max(100).optional(),
    role: z.enum(["admin", "user"]).optional(),
  })
  ```
- **Database Operations**:
  1. Checks existing record: `SELECT * FROM users WHERE id = ?`
  2. Hashes password if updated: `await bcrypt.hash(password, 10)`
  3. Updates dynamic columns: `UPDATE users SET [columns] WHERE id = ?`
  4. Returns updated projection: `SELECT id, username, email, role, created_at FROM users WHERE id = ?`
- **Response**:
  - Success: `200 OK` (returns updated user object)
  - Not Found: `404 Not Found` (`{ "error": "User not found" }`)
  - Validation Failure: `400 Bad Request`
  - Empty Update: `400 Bad Request` (`{ "error": "No fields to update" }`)
  - Forbidden: `403 Forbidden`
  - Server Error: `500 Internal Server Error`

---

#### `DELETE /api/users/:id`
- **File**: `server/src/routes/users.ts:32`, `server/src/controllers/usersController.ts:104-133`
- **Middleware**: `verifyToken`
- **Authentication**: Bearer JWT required.
- **Authorization / Ownership Rules**:
  - If `requestingUser.role === 'admin' && requestingUser.id === Number(id)` -> `403 Forbidden` (`{ "error": "Admins cannot delete their own account" }`).
  - If `requestingUser.role !== 'admin' && requestingUser.id !== Number(id)` -> `403 Forbidden` (`{ "error": "No permission to delete this account" }`).
- **Database Operations**:
  - `DELETE FROM users WHERE id = ?`
  - Cascades deletions to `entries` due to `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- **Response**:
  - Success: `200 OK` (`{ "message": "User deleted successfully" }`)
  - Not Found: `404 Not Found` (`{ "error": "User not found" }`)
  - Forbidden: `403 Forbidden`
  - Server Error: `500 Internal Server Error`

---

#### `GET /api/entries`
- **File**: `server/src/routes/entries.ts:17`, `server/src/controllers/entriesController.ts:45-58`
- **Middleware**: `verifyToken`
- **Authentication**: Bearer JWT required.
- **Authorization / Ownership**: Enforced by scoping query to `req.user.id`.
- **Database Operations**:
  `SELECT * FROM entries WHERE user_id = ? ORDER BY data DESC`
- **Response**:
  - Success: `200 OK`
    ```json
    [
      {
        "id": 12,
        "user_id": 3,
        "sentimento": "Feliz",
        "data": "2024-01-18T10:15:00Z"
      }
    ]
    ```
  - Server Error: `500 Internal Server Error`

---

#### `POST /api/entries`
- **File**: `server/src/routes/entries.ts:20`, `server/src/controllers/entriesController.ts:10-40`
- **Middleware**: `verifyToken`
- **Authentication**: Bearer JWT required.
- **Authorization / Ownership**: Scoped to authenticated `req.user.id`.
- **Input Validation**: `createEntrySchema` (`validation.ts:43-48`):
  ```typescript
  z.object({
    sentimento: z.string().min(1, "Sentiment is required").max(50, "Sentiment is too long"),
  })
  ```
- **Database Operations**:
  1. `INSERT INTO entries (user_id, sentimento) VALUES (?, ?)`
  2. `SELECT * FROM entries WHERE id = ?` with `result.lastID`
- **Response**:
  - Success: `201 Created`
    ```json
    {
      "id": 64,
      "user_id": 3,
      "sentimento": "Calmo",
      "data": "2026-09-04 20:53:10"
    }
    ```
  - Validation Failure: `400 Bad Request`
  - Server Error: `500 Internal Server Error`

---

#### `DELETE /api/entries/:id`
- **File**: `server/src/routes/entries.ts:23`, `server/src/controllers/entriesController.ts:64-84`
- **Middleware**: `verifyToken`
- **Authentication**: Bearer JWT required.
- **Authorization / Ownership**:
  - `SELECT * FROM entries WHERE id = ?`
  - If `entry.user_id !== req.user.id` -> `403 Forbidden` (`{ "error": "No permission to delete this entry" }`).
  - *Note*: Even administrators cannot delete entries belonging to other users through this endpoint.
- **Database Operations**:
  `DELETE FROM entries WHERE id = ?`
- **Response**:
  - Success: `200 OK` (`{ "message": "Entry deleted successfully" }`)
  - Not Found: `404 Not Found` (`{ "error": "Entry not found" }`)
  - Forbidden: `403 Forbidden`
  - Server Error: `500 Internal Server Error`

---

#### `GET /api/quotes`
- **File**: `server/src/routes/quotes.ts:12`, `server/src/controllers/quotesController.ts:48-51`
- **Middleware**: None.
- **Query Parameters**: `lang` (`pt` | `en`, default: `pt`).
- **Data Source**: In-memory `quotesCache` loaded from text files.
- **Response**: `200 OK` (Array of Quote objects):
  ```json
  [
    {
      "texto": "A persistência é o caminho do êxito.",
      "autor": "Charles Chaplin"
    }
  ]
  ```

---

#### `GET /api/quotes/random`
- **File**: `server/src/routes/quotes.ts:15`, `server/src/controllers/quotesController.ts:58-65`
- **Middleware**: None.
- **Query Parameters**: `lang` (`pt` | `en`, default: `pt`).
- **Data Source**: Random selection from in-memory `quotesCache[lang]`.
- **Response**:
  - Success: `200 OK`
    ```json
    {
      "texto": "The journey of a thousand miles begins with one step.",
      "autor": "Lao Tzu"
    }
    ```
  - Cache Empty: `500 Internal Server Error` (`{ "error": "Nenhuma quote carregada" }`)

---

## 2. Real SQLite Schema Specification

The database is initialized by `initDB()` in `server/src/db.ts` and stored at `./server/data/mindspace.db`.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  sentimento TEXT NOT NULL,
  data TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2.1 Table: `users`
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `INTEGER` | No | Auto | `PRIMARY KEY AUTOINCREMENT` | Auto-incrementing identifier |
| `username` | `TEXT` | No | None | `UNIQUE` | Unique login username |
| `email` | `TEXT` | No | None | `UNIQUE` | Unique user email address |
| `password` | `TEXT` | No | None | None | BCrypt password hash string |
| `role` | `TEXT` | No | `'user'` | `CHECK(role IN ('admin', 'user'))` | RBAC role discriminator |
| `created_at` | `TEXT` | Yes | `CURRENT_TIMESTAMP` | None | Account creation timestamp |

- **Current Row Count**: 23 rows.

### 2.2 Table: `entries`
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `INTEGER` | No | Auto | `PRIMARY KEY AUTOINCREMENT` | Auto-incrementing identifier |
| `user_id` | `INTEGER` | No | None | `FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE` | Owner user identifier |
| `sentimento` | `TEXT` | No | None | None | Sentiment label string |
| `data` | `TEXT` | Yes | `CURRENT_TIMESTAMP` | None | Log entry timestamp |

- **Current Row Count**: 63 rows.

### 2.3 Table: `sqlite_sequence`
Internal SQLite system table automatically generated when `AUTOINCREMENT` is declared.
- Columns: `name TEXT`, `seq INTEGER`
- Current Values: `[('users', 23), ('entries', 63)]`

### 2.4 Constraints, Foreign Keys & Cascade Behavior
- `PRAGMA foreign_keys = ON;` is explicitly executed upon opening the connection in `getDB()` / `initDB()`.
- The foreign key constraint `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` ensures deleting a user record immediately cascades and removes all linked records in `entries`.
- SQLite does not enforce column data type constraints (dynamic typing), but types are constrained to `INTEGER` and `TEXT` by the application.
- Indexes: Only implicit unique B-tree indexes generated for `users.id`, `users.username`, `users.email`, and `entries.id`. There are **no explicit indexes** on `entries.user_id` or `entries.data`.

### 2.5 Timestamp Representation & Discrepancy
Timestamps in SQLite are stored as `TEXT`. There is an active representation divergence:
1. When populated via `populate.ts`: The seeder parses strings and inserts ISO 8601 strings (e.g. `'2024-01-14T09:30:00Z'`).
2. When inserted via standard application runtime (`entriesController.ts` or `db.ts` table default): SQLite assigns `CURRENT_TIMESTAMP` in the format `'YYYY-MM-DD HH:MM:SS'`.
- *Migration Consequence*: The V2 PostgreSQL migration script must normalize both ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`) and SQLite datetime (`YYYY-MM-DD HH:MM:SS`) into PostgreSQL `TIMESTAMPTZ`.

### 2.6 Schema Migration Strategy
- MindSpace V1 has **no database migration system** (no Flyway, Knex, Prisma, TypeORM, or Umzug).
- Schema evolution is managed solely via `CREATE TABLE IF NOT EXISTS` at bootstrap time.
- Structural schema changes (adding/altering columns) currently require manual SQLite CLI manipulation or rebuilding the database via `npm run populate`.

---

## 3. Discrepancy Matrix: Documentation vs Actual Implementation

| Feature / Behavior | README.md / Academic Report Claim | Real Implementation in Code | Architectural / Security Impact |
| :--- | :--- | :--- | :--- |
| **`GET /api/users` Authorization** | "Admin access" (README:96); "somente acessível a admins" (Report:4) | Only calls `verifyToken`. Has **no role check** (`users.ts:20`, `usersController.ts:17-28`). | **High**: Any registered standard user can retrieve the full user table. |
| **Mood Reflection Notes** | "Daily emotional status entries with mood tag selection and personal journaling notes" (README:25) | Only accepts and stores `sentimento`. No reflection/note column exists in schema or API. | **Medium**: The data model does not support journaling text. V2 must add `note`/`reflection` column if feature is desired. |
| **History Filtering & Pagination** | "Filterable, paginated record table" (README:27) | Renders all entries returned by the API inside an unpaginated CSS scroll box with no filter controls (`History.tsx`). | **Low**: UI discrepancy; pagination and filters must be designed from scratch in V2. |
| **Quotes Persistence** | "Initialize the SQLite schema and populate sample data (users & quotes)" (README:141) | Quotes are **not** stored in SQLite. They are loaded statically from text files into memory (`quotesController.ts`). | **Medium**: V2 must either introduce a `quotes` table in PostgreSQL or retain static asset loading. |
| **CORS Configuration** | Implicitly supports client app | `server.ts:25-29` hardcodes `localhost:5174` and `localhost:3000`. Omits default Vite port `5173`. | **Medium**: Development environment requires setting `CLIENT_URL` in `.env` or running on port 5174. |
| **Admin Route Protection (Frontend)** | Implied admin gate on `/admin` | `App.tsx:86-92` wraps `/admin` in `<ProtectedRoute>`, which only checks if user is logged in. Component redirect in `Admin.tsx` relies on client-side state. | **Medium**: Client-side enforcement can be bypassed; API vulnerability above compounds this. |
