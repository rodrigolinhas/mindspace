# MindSpace V1 — Security Analysis & V2 Migration Constraints

This document details the security posture, architectural debt, and concrete migration constraints identified in MindSpace V1 as of the baseline commit (`23ce400f45971e48de30f30996914da24e2005b8`).

Per M0 issue scope rules, **no security vulnerabilities or architectural flaws are modified or repaired in V1**. These findings serve as critical requirements and design constraints for the upcoming NestJS and PostgreSQL architecture (Milestones M1–M5).

---

## 1. Security Analysis & Hypothesis Verification

Every previously identified hypothesis is evaluated against the source code and classified under one of the formal statuses:
- `CONFIRMED`
- `PARTIALLY CONFIRMED`
- `NOT PRESENT`
- `NO LONGER APPLICABLE`

---

### 1.1 Authentication & Authorization

#### 1. Public signup accepts a client-controlled `role`
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/middlewares/validation.ts`, lines 25–40:
    ```typescript
    export const signupSchema = z.object({
      username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username is too long").regex(/^[\w]+$/, "Username can only contain letters, numbers and underscore"),
      email: z.string().email("Invalid email").max(100, "Email is too long"),
      password: z.string().min(3, "Password must be at least 3 characters").max(100, "Password is too long"),
      role: z.enum(["admin", "user"]).optional().default("user"),
    });
    ```
  - `server/src/controllers/usersController.ts`, lines 33–52:
    ```typescript
    const validation = signupSchema.safeParse(req.body);
    ...
    const { username, email, password, role } = validation.data;
    ...
    const result = await db.run(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashed, role]
    );
    ```
- **Finding**: The Zod validation schema explicitly allows the client to supply `role: "admin"` in the public registration request body. The controller takes this validated property and inserts it directly into the database without restriction.

---

#### 2. Normal user can register as `admin`
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/routes/users.ts`, line 23:
    ```typescript
    router.post("/signup", authLimiter, createUser);
    ```
- **Finding**: The endpoint is completely unauthenticated and accessible to any external client. Any user can post `{"username": "attacker", "email": "attacker@example.com", "password": "secretpassword", "role": "admin"}` to instantly gain administrative privileges in the system.

---

#### 3. `/api/users` requires only authentication rather than admin authorization
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/routes/users.ts`, line 20:
    ```typescript
    router.get("/", verifyToken, getAllUsers);
    ```
  - `server/src/controllers/usersController.ts`, lines 17–28:
    ```typescript
    export const getAllUsers = async (req: Request, res: Response) => {
      try {
        const db = await getDB();
        const users = await db.all(
          "SELECT id, username, email, role, created_at FROM users"
        );
        res.json(users);
      } catch (err) {
        ...
      }
    };
    ```
- **Finding**: While the route checks for a valid JWT via `verifyToken`, it **does not verify whether `req.user.role === 'admin'`**. Any regular authenticated user with a valid token can query `GET /api/users` and receive the entire user database list (IDs, usernames, emails, roles, creation dates). This contradicts README.md (line 96) and Report.pdf (page 4).

---

#### 4. Ownership checks are correctly enforced on mood entries
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/controllers/entriesController.ts`:
    - Creation (`lines 20–30`): Uses `req.user.id` extracted from the decoded JWT rather than accepting `user_id` from the client request body:
      ```typescript
      const userId = req.user.id;
      await db.run("INSERT INTO entries (user_id, sentimento) VALUES (?, ?)", [userId, sentimento]);
      ```
    - Retrieval (`lines 48–53`): Constrains queries to the authenticated user ID:
      ```typescript
      const userId = req.user.id;
      const entries = await db.all(`SELECT * FROM entries WHERE user_id = ? ORDER BY data DESC`, [userId]);
      ```
    - Deletion (`lines 64–79`): Explicitly validates that the entry's `user_id` matches `req.user.id`:
      ```typescript
      const entry = await db.get("SELECT * FROM entries WHERE id = ?", [id]);
      ...
      if (entry.user_id !== userId) {
        return res.status(403).json({ error: "No permission to delete this entry" });
      }
      ```
- **Finding**: Entry operations strictly enforce ownership at the controller level based on the verified JWT identity.

---

#### 5. Exact JWT payload created during login
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/controllers/usersController.ts`, lines 82–92:
    ```typescript
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });
    const token = generateToken(user);
    ```
  - `server/src/middlewares/auth.ts`, lines 43–45:
    ```typescript
    export function generateToken(user: Omit<User, "password">): string {
      return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1h" });
    }
    ```
- **Decoded JWT Payload**:
  ```json
  {
    "id": 3,
    "username": "Rodrigo",
    "email": "rodrigo@mail.com",
    "password": "$2b$10$QDWn.wv4NYoFso./i6Iv7OzJiy8c2Cs8V9dmJ.G9yVEKtKTgYxh0K",
    "role": "admin",
    "created_at": "2024-01-14T09:30:00Z",
    "iat": 1725483200,
    "exp": 1725486800
  }
  ```

---

#### 6. A password/BCrypt hash can accidentally become part of the JWT
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - In `server/src/controllers/usersController.ts:83`, the login handler fetches the user via `SELECT * FROM users WHERE username = ?`.
  - The returned `user` object contains `user.password` (the BCrypt hash).
  - While `generateToken(user: Omit<User, "password">)` is typed in TypeScript to exclude `password`, TypeScript types are erased at compile time.
  - At runtime, `jwt.sign(user, ...)` serializes the unmodified object directly into the token.
- **Finding**: **Critical Information Disclosure**. Every JWT issued via `/api/users/login` contains the user's salted BCrypt password hash. Because JWTs are sent to the client and readable via standard Base64 decoding, this hash is completely exposed to anyone inspecting the token or local storage.

---

#### 7. JWT expiration behavior
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/middlewares/auth.ts`, line 44:
    `{ expiresIn: "1h" }`
- **Finding**: Tokens are hardcoded to expire in exactly 1 hour. No refresh token mechanism exists. Tokens are completely stateless with no server-side blacklist or revocation list (e.g. logging out in the client does not invalidate the token on the server).

---

#### 8. JWT secret / configuration handling
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/middlewares/auth.ts`, lines 44 & 60:
    `jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1h" });`
    `jwt.verify(token, process.env.JWT_SECRET!, ...);`
- **Finding**:
  - The code uses non-null assertion (`process.env.JWT_SECRET!`).
  - There is no fallback secret and no startup assertion ensuring `JWT_SECRET` is set.
  - No `.env` or `.env.example` file exists in the repository.
  - If `process.env.JWT_SECRET` is undefined, `jsonwebtoken` v9 throws a runtime error upon signing or verification.

---

### 1.2 Password Handling & Cryptography

#### 1. Password validation & minimum length
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/middlewares/validation.ts`:
    - Signup (`line 37`): `password: z.string().min(3, "Password must be at least 3 characters").max(100)`
    - Update (`line 59`): `password: z.string().min(3).max(100).optional()`
- **Finding**: Passwords are accepted with a minimum length of only 3 characters. There are zero complexity constraints (no uppercase, lowercase, digits, or symbol requirements).

#### 2. BCrypt usage & salt rounds
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `server/src/middlewares/auth.ts`, lines 20–23:
    ```typescript
    export async function hashPassword(password: string): Promise<string> {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    }
    ```
  - `server/src/populate.ts`, line 58:
    `const hashedPassword = await bcrypt.hash(data.password, 10);`
- **Finding**: `bcrypt` (v6.0.0) is properly used with 10 salt rounds across both dynamic registration and database seeding.

#### 3. Password hashes exposed outside persistence/authentication boundaries
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - As detailed in Section 1.1 (#6), password hashes are directly leaked inside client-facing JWT tokens.
  - *Mitigating Note*: `GET /api/users` explicitly selects `SELECT id, username, email, role, created_at FROM users`, and `PUT /api/users/:id` similarly excludes password from its return query. The leak is isolated to the JWT token generation in `loginUser`.

---

### 1.3 Type / Model Boundaries & Coupling

#### Model Reuse Audit
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `shared/types/User.ts`:
    ```typescript
    export interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      created_at?: string;
      role: "admin" | "user";
    }
    ```
  - Express Request Decordation (`server/src/middlewares/auth.ts:7-13`):
    ```typescript
    declare global {
      namespace Express {
        interface Request {
          user: User;
        }
      }
    }
    ```
  - Client Auth Type (`client/src/auth/AuthContext.tsx:14-17`):
    ```typescript
    export type AuthUser = Pick<User, "username" | "role"> &
      Partial<Pick<User, "id">> & {
        token: string;
      };
    ```
- **Finding**: The database record representation (`User`) includes `password: string` and is directly shared across frontend and backend tiers. There is no architectural separation between persistence entities, domain models, authentication session objects, and public API data transfer objects (DTOs).

---

### 1.4 Frontend Token Handling

#### Client Storage Audit
- **Classification**: `CONFIRMED`
- **Source Code Evidence**:
  - `client/src/auth/AuthContext.tsx`, lines 45–50, 73–74:
    ```typescript
    const [user, setUser] = useState<AuthUser | null>(() => {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState<string | null>(() =>
      localStorage.getItem("token")
    );
    ...
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
    ```
- **Finding**: Tokens and user profile data are persisted directly in `window.localStorage`. While straightforward for single-page applications, this makes the JWT vulnerable to Cross-Site Scripting (XSS) extraction.

---

### 1.5 Database Evolution & Persistence Debt

#### Database Architecture Audit
- **Classification**: `CONFIRMED`
- **Findings**:
  1. **No Migrations**: Zero database migration scripts exist. Schema generation is solely handled by raw SQL inside `server/src/db.ts:initDB()` via `CREATE TABLE IF NOT EXISTS`.
  2. **Timestamp Inconsistency**:
     - `db.ts` table definition uses `TEXT DEFAULT CURRENT_TIMESTAMP` (producing `'YYYY-MM-DD HH:MM:SS'`).
     - `populate.ts` inserts ISO 8601 strings (producing `'2024-01-14T09:30:00Z'`).
     - Real SQLite database contains both formats.
  3. **ID Strategy**: Uses SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`. Sequence numbers are tracked in `sqlite_sequence`.
  4. **Data Required to Survive SQLite -> PostgreSQL Migration**:
     - 23 users in `users` (usernames, emails, bcrypt hashes, roles, creation dates).
     - 63 mood logs in `entries` (user_id relations, sentiment labels, timestamps).
     - Quote corpus (300 quotes total across Portuguese and English files).

---

### 1.6 Automated Testing Baseline

#### Repository Test Search Audit
- **Classification**: `CONFIRMED (Zero tests)`
- **Inspected Elements**:
  - `package.json`: No `test` script, no dependencies for Jest, Vitest, Supertest, Cypress, Playwright, or React Testing Library.
  - File system: Zero `*.test.*` or `*.spec.*` files across `client/`, `server/`, `shared/`, or root.
  - CI/CD pipelines: No `.github/` folder or CI execution configurations.
- **Finding**: The V1 repository has completely zero automated tests.

---

## 2. Migration Constraints & Proposed V2 Directions

The findings above inform the architectural boundaries and design considerations for the V2 redesign across subsequent milestones (M1–M5). Every item below is explicitly distinguished as an established constraint, a proposed direction, or an open decision.

### 2.1 Security & Access Control

1. **Registration Role Assignment**:
   - **CONFIRMED CONSTRAINT**: The public user registration endpoint must not allow unauthenticated clients to self-assign administrative roles.
   - **PROPOSED V2 DIRECTION**: The public registration DTO should omit the `role` attribute entirely, defaulting all public registrations to the standard user role. Administrative provisioning should be managed through explicit seed scripts, administrative management endpoints, or internal CLI tasks.

2. **Role-Based Access Control (RBAC)**:
   - **CONFIRMED CONSTRAINT**: Access to administrative endpoints (such as full user directory listing) must strictly require administrative authorization, not merely authentication.
   - **PROPOSED V2 DIRECTION**: Implement declarative NestJS authorization guards (e.g., combining `JwtAuthGuard` with a custom `RolesGuard` and `@Roles('admin')` metadata decorator).

3. **Purging Password Hashes from Token Payloads**:
   - **CONFIRMED CONSTRAINT**: Raw database user entities containing password hashes must never be passed to token generation routines or exposed to clients.
   - **PROPOSED V2 DIRECTION**: Define a strict `JwtPayload` contract containing only safe identity claims (e.g., subject ID, username, role).

4. **Password Policy Enforcement**:
   - **CONFIRMED CONSTRAINT**: Password validation rules must be strengthened beyond the 3-character V1 threshold to prevent trivial or easily guessed passwords.
   - **PROPOSED V2 DIRECTION**: Enforce validation rules (e.g., minimum 8 characters with complexity requirements) via class-validator DTO decorators.

5. **Token Storage & Transport Strategy**:
   - **CONFIRMED FACT**: V1 persists the JWT and user profile in client-side `localStorage`.
   - **PROPOSED V2 DIRECTION**: Evaluate whether to retain Bearer tokens with improved storage discipline or transition to HTTP-only, `SameSite=Strict`, `Secure` cookies to mitigate XSS token extraction risks.
   - **OPEN DECISION**: The final token transport and storage architecture (Bearer header vs HTTP-only cookies, single token vs access/refresh token pair) remains an open decision to be resolved during Milestone M2 (Authentication & Users) and M5 (Hardening & V2 Release).

6. **Configuration Validation**:
   - **CONFIRMED CONSTRAINT**: Core secrets (such as JWT secret) and configuration settings must be validated at application startup rather than relying on unvalidated environment assertions.
   - **PROPOSED V2 DIRECTION**: Leverage NestJS ConfigModule with validation schemas (Joi or Zod) to assert configuration validity at startup.

### 2.2 Domain & Model Decoupling

1. **Separation of Concerns**:
   - **CONFIRMED CONSTRAINT**: Persistence models must be strictly decoupled from public API transfer objects (DTOs) and client-facing interfaces.
   - **PROPOSED V2 DIRECTION**: Introduce isolated persistence entities and transfer DTOs with explicit data mapping.
   - **OPEN DECISION**: Selection of persistence framework / ORM (e.g. TypeORM, Prisma, Kysely, or MikroORM) will be evaluated and decided in Milestone M1 (NestJS + PostgreSQL Foundation).

### 2.3 Persistence Migration & Data Continuity

1. **Schema Management**:
   - **CONFIRMED CONSTRAINT**: Schema evolution in V2 must use versioned, managed database migrations rather than ad-hoc startup SQL execution (`CREATE TABLE IF NOT EXISTS`).
   - **OPEN DECISION**: The migration tooling will be chosen in accordance with the ORM/persistence library selected in Milestone M1.

2. **Timestamp Normalization**:
   - **CONFIRMED CONSTRAINT**: The migration pipeline must handle both verified V1 timestamp formats (ISO 8601 strings and SQLite `CURRENT_TIMESTAMP` strings) and convert them faithfully into PostgreSQL `TIMESTAMPTZ` without data loss or timezone shifts.

3. **Identity & Sequence Synchronization**:
   - **CONFIRMED CONSTRAINT**: Legacy numeric primary keys for users and entries must be preserved to maintain relational integrity, and PostgreSQL sequence counters must be updated post-import.

4. **Motivational Quotes Corpus**:
   - **CONFIRMED FACT**: Quotes in V1 are stored in text files (`quotes-pt.txt`, `quotes-eng.txt`) and served from memory, not persisted in SQLite.
   - **OPEN DECISION**: Whether quotes should be migrated into a managed PostgreSQL table or retained as static localized assets will be decided during M1/M4 planning.

### 2.4 Testing Infrastructure

1. **Test Baseline**:
   - **CONFIRMED FACT**: MindSpace V1 has zero automated test coverage across all packages.
   - **PROPOSED V2 DIRECTION**: Establish a modern test runner (such as Jest or Vitest) in Milestone M1 and implement end-to-end integration tests (using Supertest) for authentication, RBAC, and data ownership.

