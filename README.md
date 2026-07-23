# 🧘 MindSpace — Full-Stack Emotional Well-Being Platform

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)

**MindSpace** is a modern, responsive, and privacy-conscious full-stack web application designed for daily emotional self-reflection, mood tracking, and mental well-being analytics. Built with end-to-end type safety using TypeScript, React 19, Express, and SQLite, MindSpace delivers a seamless user experience paired with robust backend engineering.

---

## 🌟 Key Features

### 🎨 Modern Frontend & UI/UX
- **Glassmorphic Design System**: Custom fluid layout featuring animated ambient gradient backgrounds, glowing UI elements, and sleek translucent cards.
- **Interactive Emotional Analytics**: Visual mood balance distribution and metrics powered by **Chart.js** and `react-chartjs-2`.
- **Internationalization (i18n)**: Native bilingual support (**English** & **Portuguese**) with persistent language toggling stored in `localStorage`.
- **Responsive & Dynamic Pages**: 
  - 🏠 **Home**: Inspirational quote of the day with instant language translation.
  - 🔐 **Authentication**: Secure registration and login flows with client-side & server-side validation.
  - 👤 **Profile & Mood Logging**: Daily emotional status entries with mood tag selection and personal journaling notes.
  - 📊 **Analytics (Stats)**: Real-time visual data breakdowns of logged moods and emotional trends.
  - 📜 **History**: Filterable, paginated record table with entry deletion capabilities.
  - ⚙️ **Settings & Admin**: Account profile management, password updates, and administrative overview.

### 🛡️ Backend Engineering & Security
- **End-to-End Type Safety**: Shared TypeScript interfaces between backend routes and frontend clients (`/shared/types`).
- **Authentication & Authorization**: Stateless JWT authentication with salted password hashing powered by **BCrypt**.
- **Security Hardening**: Hardened HTTP security headers via **Helmet**, explicit **CORS** origin policies, and API abuse prevention using **Express Rate Limit**.
- **Relational Storage**: Promise-driven SQLite database operations with auto-initialization and seed data management.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, React Router 7, TypeScript, Vite 5, Chart.js, Vanilla CSS Glassmorphism |
| **Backend** | Node.js, Express.js, TypeScript, ts-node-dev |
| **Database** | SQLite3, `sqlite` (Promise-based API driver) |
| **Security & Auth** | JSON Web Tokens (JWT), BCrypt, Helmet, Express Rate Limit, Zod |
| **Tooling & Setup** | npm scripts, Concurrently, ESLint, Prettier |

---

## 📁 Repository Architecture

```text
mindspace/
├── client/                     # Frontend Application (Vite + React)
│   ├── assets/                 # Static visual & audio media assets
│   ├── css/                    # Modular CSS stylesheets & design tokens
│   ├── src/
│   │   ├── auth/               # AuthContext provider & JWT token handler
│   │   ├── components/         # Reusable UI components (Background, LanguageToggle)
│   │   ├── lang/               # i18n translation dictionaries (en.json, pt.json)
│   │   ├── pages/              # View pages (Home, Login, Profile, Stats, History, etc.)
│   │   ├── utils/              # API HTTP wrapper & helper utilities
│   │   ├── App.tsx             # Route configuration & Provider wrappers
│   │   └── main.tsx            # Application entry point
│   ├── index.html              # Single Page Application HTML root
│   └── vite.config.ts          # Vite bundler configuration
│
├── server/                     # Backend Application (Node + Express REST API)
│   ├── data/                   # SQLite database file (`mindspace.db`) & quote seeds
│   ├── src/
│   │   ├── controllers/        # Request handlers (users, entries, quotes)
│   │   ├── middlewares/        # Auth verification, rate-limiting & validation
│   │   ├── routes/             # Express API router modules
│   │   ├── db.ts               # Database connection & schema migration bootstrap
│   │   ├── populate.ts         # Automated database seeder utility
│   │   └── server.ts           # Express HTTP server setup & initialization
│   └── tsconfig.json           # Server TypeScript config
│
├── shared/                     # Shared Monorepo Code
│   └── types/                  # Shared TypeScript interfaces (User, Entry, Quote)
│
├── package.json                # Project root dependencies & script orchestration
└── tsconfig.base.json          # Root TypeScript configuration base
```

---

## 🔌 API Endpoint Documentation

### 🔑 Authentication & User Management (`/api/users`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/users/signup` | ❌ | Register a new user account (rate-limited) |
| `POST` | `/api/users/login` | ❌ | Authenticate user credentials & return JWT token |
| `GET` | `/api/users` | 🔒 Yes | List all registered users (Admin access) |
| `PUT` | `/api/users/:id` | 🔒 Yes | Update user profile details / password |
| `DELETE` | `/api/users/:id` | 🔒 Yes | Delete user account |

### 📝 Mood Entries (`/api/entries`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/entries` | 🔒 Yes | Fetch all emotional entries logged by the current user |
| `POST` | `/api/entries` | 🔒 Yes | Create a new mood entry with sentiment tag & reflection note |
| `DELETE` | `/api/entries/:id` | 🔒 Yes | Remove a mood entry by ID |

### 💬 Motivational Quotes (`/api/quotes`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/quotes` | ❌ | List all available inspirational quotes |
| `GET` | `/api/quotes/random?lang=en` | ❌ | Fetch a random daily quote filtered by language (`en` \| `pt`) |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`

### 1. Installation

Clone the repository and install root dependencies:

```bash
git clone https://github.com/rodrigolinhas/mindspace.git
cd mindspace
npm install
```

> **Note (Node 23/26+ users)**: If npm prompts regarding native install scripts for `sqlite3` or `bcrypt`, run:
> ```bash
> npm install-scripts approve sqlite3 bcrypt esbuild
> npm rebuild
> ```

### 2. Seed Database

Initialize the SQLite schema and populate sample data (users & quotes):

```bash
npm run populate
```

### 3. Start Development Server

Run both frontend (Vite) and backend (Express) concurrently with hot-reloading:

```bash
npm run dev
```

- **Client App**: [http://localhost:5173](http://localhost:5173) (or `http://localhost:5174` if port is occupied)
- **API Server**: [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

Compile both server TypeScript code and client production bundle:

```bash
npm run build
npm start
```

---

## 💻 Engineering Decisions & Highlights

1. **Shared Type System**: By maintaining a `/shared/types` module, API contracts between client requests and server responses stay synchronized, eliminating runtime type errors.
2. **Context-Driven State Management**: Auth state (`AuthContext`) and locale state (`LanguageContext`) leverage React Context with local storage persistence, delivering instant UI updates across routes without external heavy state libraries.
3. **Defense-In-Depth Security**: Password strings are hashed using salt rounds via BCrypt prior to storage. Incoming requests are sanitized and rate-limited to mitigate brute-force authentication attacks.
4. **Clean Code Structure**: Adheres to strict separation of concerns with dedicated controllers, middleware pipelines, and declarative React components.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
