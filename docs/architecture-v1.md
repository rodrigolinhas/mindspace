# MindSpace V1 — System Architecture

## 1. Overview & Architectural Goals

**MindSpace V1** is a full-stack web application designed for daily mood tracking, personal emotional reflection, and mental well-being analytics. The platform enables users to log their daily feelings, view aggregate mood distribution charts, inspect entry history, and read motivational quotes in multiple languages.

This document describes the **real, currently implemented architecture** of the V1 codebase as of the baseline commit (`23ce400f45971e48de30f30996914da24e2005b8`), establishing the baseline for migration to a NestJS + PostgreSQL architecture (V2).

---

## 2. Repository Structure & Monorepo Organization

The project is organized as a unified monorepo sharing a single root `package.json` for dependency management and script orchestration (rather than using npm/yarn/pnpm workspaces).

```text
mindspace/
├── client/                     # Frontend SPA application
│   ├── assets/                 # Static visual & audio media (logotipo, secret.jpg, secret.mp3)
│   ├── css/                    # Modular Vanilla CSS stylesheets
│   │   ├── App.css             # Main layout & component styles
│   │   ├── background.css      # Multi-layer ambient animated gradient
│   │   ├── index.css           # Global typography, resets, CSS custom properties
│   │   ├── LanguageToggle.css  # Language switcher styles
│   │   └── pages.css           # View-specific page styles
│   ├── src/
│   │   ├── auth/               # Authentication Context & state
│   │   │   └── AuthContext.tsx # React Context for JWT & user state
│   │   ├── components/         # Global shared UI components
│   │   │   ├── Background.tsx  # Dynamic interactive background canvas
│   │   │   └── LanguageToggle.tsx # Bilingual switch button
│   │   ├── lang/               # Internationalization (i18n)
│   │   │   ├── en.json         # English translation dictionary
│   │   │   ├── pt.json         # Portuguese translation dictionary
│   │   │   └── LanguageContext.tsx # React Context for locale state
│   │   ├── pages/              # Route view components
│   │   │   ├── Admin.tsx       # User management table & role elevation
│   │   │   ├── History.tsx     # Emotion log record feed with deletion
│   │   │   ├── Home.tsx        # Public landing screen with quote banner
│   │   │   ├── Login.tsx       # Auth portal (Login / Registration toggling)
│   │   │   ├── Profile.tsx     # User navigation hub & action tiles
│   │   │   ├── Quote.tsx       # Standalone daily quote card
│   │   │   ├── Secret.tsx      # Hidden Easter egg page for "RuiPaulo"
│   │   │   ├── Settings.tsx    # Profile editor & account deletion
│   │   │   └── Stats.tsx       # Dashboard with Chart.js doughnut & mood logger
│   │   ├── utils/              # Client utility helpers
│   │   │   ├── api.ts          # API base URL configuration
│   │   │   └── emojis.tsx      # Twemoji CDN mapper & renderer
│   │   ├── App.tsx             # Root router & layout wrapper
│   │   ├── main.tsx            # DOM root bootstrap
│   │   └── vite-env.d.ts       # Vite client types
│   ├── index.html              # HTML entrypoint
│   ├── tsconfig.json           # Client TypeScript configuration
│   ├── tsconfig.node.json      # Node config for Vite bundler
│   └── vite.config.ts          # Vite configuration with alias & assets setup
│
├── server/                     # Backend REST API
│   ├── data/                   # Data directory
│   │   ├── mindspace.db        # SQLite database file
│   │   ├── povoamento.txt      # Text-formatted seed dataset for users & entries
│   │   ├── quotes-eng.txt      # Raw text corpus of English motivational quotes
│   │   └── quotes-pt.txt       # Raw text corpus of Portuguese motivational quotes
│   ├── src/
│   │   ├── controllers/        # Request controllers
│   │   │   ├── entriesController.ts # CRUD for mood logs
│   │   │   ├── quotesController.ts  # Quote querying from in-memory cache
│   │   │   └── usersController.ts   # User registration, auth & profile management
│   │   ├── middlewares/        # Express middleware pipeline
│   │   │   ├── auth.ts         # JWT verification, hashing, token issuance
│   │   │   ├── rateLimiter.ts  # Global and auth rate limiters
│   │   │   └── validation.ts   # Zod request body schemas
│   │   ├── routes/             # Express Router modules
│   │   │   ├── entries.ts      # Mounts /api/entries
│   │   │   ├── quotes.ts       # Mounts /api/quotes
│   │   │   └── users.ts        # Mounts /api/users
│   │   ├── db.ts               # SQLite singleton connection & table initialization
│   │   ├── populate.ts         # Standalone database population script
│   │   └── server.ts           # Express HTTP server bootstrap & middleware wiring
│   └── tsconfig.json           # Server TypeScript configuration
│
├── shared/                     # Cross-tier contract interfaces
│   └── types/
│       ├── Entry.ts            # Entry interface
│       ├── Quote.ts            # Quote interface
│       ├── User.ts             # User entity interface
│       └── index.ts            # Central re-export
│
├── docs/                       # Project documentation & legacy assets
├── package.json                # Single root dependencies & script orchestration
├── package-lock.json           # Dependency lockfile
├── tsconfig.base.json          # Shared compiler options
├── setup.sh                    # Linux/macOS automated installation script
├── setup.bat                   # Windows automated installation script
└── README.md                   # Project overview & high-level documentation
```

---

## 3. Frontend Architecture

### 3.1 Framework & Bundler
- **Core**: React 19.0.0 with TypeScript 5.5.
- **Routing**: `react-router-dom` 7.10.1 (`BrowserRouter`, `Routes`, `Route`, `Navigate`).
- **Bundler**: Vite 5.2.0 configured via `client/vite.config.ts`.
  - `@` alias maps to `./client/src`.
  - Static asset inclusion for `.jpg` and `.mp3` files.
  - Builds to `../dist/client`.
  - Dev server configured on port `5173`.

### 3.2 State Management
State is managed entirely using React Context API with persistent browser storage synchronization:
1. **`AuthContext` (`client/src/auth/AuthContext.tsx`)**:
   - Manages `user: AuthUser | null`, `token: string | null`, and `isAdmin: boolean`.
   - On initialization, reads `user` and `token` directly from `localStorage`.
   - `login()` sets state and serializes `user` and `token` to `localStorage`.
   - `logout()` clears React state and removes keys from `localStorage`.
2. **`LanguageContext` (`client/src/lang/LanguageContext.tsx`)**:
   - Manages `language: 'pt' | 'en'` state.
   - Loads translations synchronously from `pt.json` and `en.json`.
   - Persists user choice in `localStorage.getItem('language')`.
   - Provides translation helper `t(key: string): string`.

### 3.3 Routing & Protected Routes
Defined in `client/src/App.tsx`:
- **Public Routes**:
  - `/` -> `Home`: Displays branding, random quote banner, and link to `/login`.
  - `/login` -> `Login`: Multi-mode login/signup form.
- **Protected Routes** (wrapped with `<ProtectedRoute>` checking `useAuth().user`):
  - `/profile` -> `Profile`: Central navigation hub.
  - `/quote` -> `Quote`: Daily quote inspection and manual refresh.
  - `/stats` -> `Stats`: Main user dashboard (Chart.js doughnut graph, sentiment logger, recent entries).
  - `/history` -> `History`: Full list of user emotional records with deletion modal.
  - `/settings` -> `Settings`: Profile modification and account deletion.
  - `/secret` -> `Secret`: Easter egg page (conditionally shown in profile when `user.username === 'RuiPaulo'`).
  - `/admin` -> `Admin`: User administration table with role promotion/demotion and user deletion.
    - *Note*: Protected route wrapper in `App.tsx` only checks for presence of `user`, not `role === 'admin'`. The `Admin.tsx` component performs a secondary redirect if `user.role !== 'admin'`.

### 3.4 UI & Styling System
- **Vanilla CSS Glassmorphism**: Translucent cards (`rgba(255, 255, 255, 0.1)`), CSS backdrop blur (`backdrop-filter: blur(10px)`), glowing borders, and rounded radii.
- **Dynamic Background (`client/src/components/Background.tsx`)**:
  - 5-layer radial gradient composition animated via CSS keyframes.
  - Mouse-tracking illumination overlay following cursor coordinates.
  - Runtime performance monitor: Uses `requestAnimationFrame` to measure frame rate; if FPS drops below 30, automatically enables low-power mode to simplify animations.
- **Visualizations**: `chart.js` 4.5.1 and `react-chartjs-2` 5.3.1 render sentiment distribution doughnuts.
- **Emoji Rendering**: `client/src/utils/emojis.tsx` maps sentiment keys to Twitter Twemoji assets hosted on Cloudflare CDN (`https://cdnjs.cloudflare.com/ajax/libs/twemoji/...`).

---

## 4. Backend Architecture

### 4.1 Server Runtime & Bootstrap
- **Engine**: Node.js with Express 4.19.2, executed via `ts-node-dev` (development) or `ts-node` (production).
- **Entrypoint**: `server/src/server.ts`.
- **Port**: Configured via `process.env.PORT` with fallback to `3000`.

### 4.2 Middleware Pipeline
In incoming request order (`server/src/server.ts`):
1. `helmet()`: Sets protective HTTP headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
2. `globalLimiter`: `express-rate-limit` allowing 100 requests per minute per IP.
3. `cors()`: Validates request origin against allowed list:
   - `http://localhost:5174`
   - `http://localhost:3000`
   - `process.env.CLIENT_URL`
   - *Note*: Port `http://localhost:5173` (Vite's default port) is not in the hardcoded list.
4. `express.json({ limit: "10kb" })`: Parses JSON request bodies with a 10KB payload ceiling.
5. Route Handlers:
   - `/api/users` -> `usersRouter`
   - `/api/entries` -> `entriesRouter`
   - `/api/quotes` -> `quotesRouter`
6. `GET /`: Health check endpoint returning `"Mindspace API running (secured)"`.

### 4.3 Database Architecture & Data Access Pattern
- **Database Engine**: SQLite 3 accessed via the promise-based `sqlite` wrapper (`sqlite` 5.1.1 + `sqlite3` 5.1.7).
- **Data File**: Stored on disk at `./server/data/mindspace.db`.
- **Singleton Pattern (`server/src/db.ts`)**:
  - `getDB()` holds a module-level variable `dbInstance: Database | null`.
  - If null, delegates to `initDB()`.
  - `initDB()` opens the database file, executes `PRAGMA foreign_keys = ON;`, and creates tables `users` and `entries` if they do not exist.
- **Concurrency & Locking**: Relies on SQLite's default file-locking mechanism. No connection pool or multi-writer configuration.

### 4.4 Data Population / Seeder (`server/src/populate.ts`)
- Standalone CLI script invoked via `npm run populate`.
- Parses custom key-value text syntax from `./server/data/povoamento.txt`:
  - `username: ...; email: ...; password: ...; role: ...; created_at: ...;`
- Clears existing data:
  ```sql
  DELETE FROM entries;
  DELETE FROM users;
  DELETE FROM sqlite_sequence;
  ```
- Hashes plaintext passwords using `bcrypt.hash(password, 10)` before insertion.
- Inserts 23 user accounts and 63 mood entries.
- *Note*: Quotes are **not** populated into SQLite.

### 4.5 In-Memory Quotes Subsystem (`server/src/controllers/quotesController.ts`)
- Quotes are completely decoupled from SQLite.
- Loaded at module evaluation from:
  - `server/data/quotes-pt.txt` (Portuguese text corpus)
  - `server/data/quotes-eng.txt` (English text corpus)
- Parsed synchronously using `fs.readFileSync()` into an in-memory dictionary:
  `quotesCache: Record<'pt' | 'en', Quote[]>`.
- Handlers `getAllQuotes` and `getRandomQuote` serve directly from this memory structure.

---

## 5. Shared Type Contracts (`shared/types/`)

The repository maintains shared TypeScript interfaces in `shared/types/`:

```typescript
// shared/types/User.ts
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at?: string;
  role: "admin" | "user";
}

// shared/types/Entry.ts
export interface Entry {
  id: number;
  user_id: number;
  sentimento: string;
  data: string;
}

// shared/types/Quote.ts
export interface Quote {
  texto: string;
  autor: string;
}
```

### Coupling Observations
- The `User` interface includes `password: string`. This single interface is imported and used across:
  - Database entity representation (`server/src/db.ts`, `server/src/controllers/usersController.ts`).
  - Express request decorator (`Express.Request.user: User` in `server/src/middlewares/auth.ts`).
  - Client-side auth definitions (`Pick<User, "username" | "role">` in `AuthContext.tsx`).
- There are no decoupled Data Transfer Objects (DTOs) or domain entity layers in V1.

---

## 6. Testing Baseline

An exhaustive audit of the codebase confirms:
- **Test Frameworks**: Neither Jest, Vitest, Mocha, Supertest, Cypress, Playwright, nor React Testing Library are installed or configured.
- **Test Files**: Zero `.test.ts`, `.spec.ts`, `.test.tsx`, or `.spec.tsx` files exist.
- **Test Scripts**: No `test` script is present in `package.json`.
- **CI/CD**: No `.github/workflows` directory or automated test execution pipelines exist.

**Conclusion**: MindSpace V1 currently operates with **zero automated test coverage**.

---

## 7. Build & Development Workflows

### Package Configuration
Single root `package.json` with configuration:
- `"name": "mindspace"`
- `"version": "3.141592653589793"`
- `"private": true`

### npm Scripts
| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `concurrently "npm run dev:server" "npm run dev:client"` | Runs server (ts-node-dev) and client (vite) with hot reload |
| `dev:server` | `ts-node-dev --project server/tsconfig.json --respawn --transpile-only server/src/server.ts` | Backend live-reloading on port 3000 |
| `dev:client` | `vite --config client/vite.config.ts` | Frontend dev server on port 5173 |
| `build` | `npm run build:server && npm run build:client` | Production compile |
| `build:server` | `tsc -p server/tsconfig.json` | Emits server JS to `dist/server` |
| `build:client` | `vite build --config client/vite.config.ts` | Bundles client to `dist/client` |
| `start` | `concurrently "npm run start:server" "npm run start:client"` | Runs compiled server via ts-node and client via vite preview |
| `populate` | `ts-node --project server/tsconfig.json server/src/populate.ts` | Seeds SQLite database from text file |

### Setup Scripts
- `setup.sh` (Linux/macOS) and `setup.bat` (Windows) provide scripted convenience runners that verify Node.js presence, execute `npm install`, and trigger `npm run build`.
