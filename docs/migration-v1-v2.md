# MindSpace V1 → V2 Migration

## 1. Migration Objective

The objective of the V2 migration is to transition MindSpace from an academic-prototype architecture (Express.js, SQLite, unmanaged database schemas, zero automated tests, and client/server coupled models) into a production-grade, enterprise-ready full-stack application built on **NestJS** and **PostgreSQL**. 

This document serves as the high-level migration contract and technical specification bridging the M0 discovery baseline to the implementation phases spanning Milestones M1 through M5.

---

## 2. Verified V1 Baseline

```text
CONFIRMED FACT
```
The exact historical repository baseline analyzed for this migration is:
- **Repository**: `https://github.com/rodrigolinhas/mindspace`
- **Branch**: `main`
- **Commit SHA**: `23ce400f45971e48de30f30996914da24e2005b8`
- **Commit Date**: `2026-07-23 12:03:15 +0100` (`Update README.md`)
- **Package Version**: `3.141592653589793`
- **Active Inspection Database (`server/data/mindspace.db`)**: Contains 23 user rows and 63 mood entry rows.
- **Automated Tests**: Zero automated tests (neither unit, integration, nor end-to-end).
- **Existing Tags / Releases**: None on remote origin or local clone.

---

## 3. Why V2 Exists

```text
CONFIRMED FACT
```
The V1 implementation exhibits fundamental structural and architectural limitations that prevent scalable, secure operations:
1. **Critical Security Vulnerabilities**: Unauthenticated privilege escalation during signup, password hashes leaked in JWT tokens, and lack of RBAC authorization on user listing.
2. **Persistence Limitations**: SQLite's concurrency limits, absence of managed schema migrations, and mixed timestamp string encodings.
3. **Domain Coupling**: Shared interfaces in `shared/types/` tightly couple the database schema, backend request/session objects, and frontend clients.
4. **Zero Test Automation**: No testing harness or CI pipelines exist to safeguard regressions.

---

## 4. Migration Principles

1. **Evidence-Based Engineering**: No V1 behavior or requirement will be assumed without source code evidence.
2. **Preserve Legacy Data**: All legitimate user accounts, credentials, and emotional history records from the V1 database must be migrated without loss.
3. **Decoupled Evolution**: The backend will be migrated to NestJS and PostgreSQL incrementally without necessitating a simultaneous rewrite of the React frontend.
4. **Explicit Classification**: Distinguish confirmed baseline facts from proposed directions and open decisions throughout all migration specifications.
5. **Zero Downtime / Phased Cutover**: The cutover will occur through verified data migration and validation scripts in Milestone M4 prior to final release in M5.

---

## 5. V1 Behaviors That Must Be Preserved

```text
CONFIRMED FACT
```
The following functional behaviors and business rules in V1 are verified and must continue functioning seamlessly in V2:
- **Core Mood Logging**: Users can select emotional states (e.g. `Feliz`, `Triste`, `Ansioso`, `Calmo`, `Irritado`, `Esperançoso`, `Motivado`, `Cansado`, `Nervoso`, `Pensativo`) and persist them.
- **Ownership Scoping**: Users can only query and delete their own logged entries (`WHERE user_id = ?`).
- **User Self-Management**: Users can update their profile information (username, email, password) and delete their own account.
- **Administrative Account Protection**: An administrator cannot delete their own account (ensuring at least one administrator remains).
- **Daily Motivational Quotes**: The platform must continue providing random and filtered quotes in English and Portuguese.
- **Relational Integrity**: Deleting a user account must cascade and remove all associated mood logs.

---

## 6. V1 Behaviors That Must Not Be Preserved

```text
CONFIRMED FACT
```
The following defective, insecure, or substandard behaviors in V1 must be explicitly eliminated in V2:
- **Self-Assigned Admin Role**: Public registration accepting `role: "admin"` in the request body.
- **Unrestricted User Directory Access**: `GET /api/users` allowing non-administrative authenticated users to view all registered users.
- **Credential Leak in JWT**: Encoding the BCrypt password hash into JWT payloads.
- **Permissive Password Length**: Allowing passwords as short as 3 characters.
- **Unmanaged Schemas**: Using `CREATE TABLE IF NOT EXISTS` at application startup instead of managed, reversible migrations.
- **Silent Date Inventions**: Permitting ambiguous timestamp strings without timezone awareness.

---

## 7. API Compatibility Constraints

```text
CONFIRMED FACT
```
The existing React frontend relies on the following HTTP endpoints and payload structures:
- `POST /api/users/signup` -> Expects `{ token, id, username, email, role, created_at }` with status `201`.
- `POST /api/users/login` -> Expects `{ token, role, username, id }` with status `200`.
- `GET /api/users` -> Expects JSON array of user objects (used by the Admin dashboard).
- `PUT /api/users/:id` -> Expects updated user object with status `200`.
- `DELETE /api/users/:id` -> Expects `{ message: "User deleted successfully" }` with status `200`.
- `GET /api/entries` -> Expects JSON array of entries sorted by date descending.
- `POST /api/entries` -> Accepts `{ sentimento: string }` and returns created entry with status `201`.
- `DELETE /api/entries/:id` -> Expects `{ message: "Entry deleted successfully" }` with status `200`.
- `GET /api/quotes` and `GET /api/quotes/random?lang=pt|en` -> Expects `{ texto: string, autor: string }`.

```text
PROPOSED V2 DIRECTION
```
V2 should maintain wire compatibility with these routes during initial backend replacement so that the frontend continues to operate without breaking changes.

---

## 8. Authentication and Authorization Constraints

```text
CONFIRMED FACT
```
In V1:
- Authentication uses stateless JWTs signed with `process.env.JWT_SECRET` expiring in 1 hour.
- Password hashing uses BCrypt with 10 salt rounds.
- The frontend persists the JWT and user profile in `localStorage`.

```text
PROPOSED V2 DIRECTION
```
- In V2, NestJS Passport (`JwtStrategy`) will authenticate requests via the standard `Authorization: Bearer <token>` header or cookies.
- BCrypt with at least 10 rounds must be retained for credential verification so that legacy user hashes can authenticate without requiring password resets.
- Administrative authorization must be enforced via NestJS `RolesGuard`.

```text
OPEN DECISION
```
- Whether to retain `localStorage` Bearer token storage in the frontend, transition to HTTP-only `SameSite=Strict` cookies, or introduce an access/refresh token pattern will be evaluated and decided during Milestones M2 and M5.

---

## 9. SQLite → PostgreSQL Data Migration Constraints

```text
CONFIRMED FACT
```
At the baseline inspection of `./server/data/mindspace.db`:
- Table `users` contains **23 rows**.
- Table `entries` contains **63 rows**.
- Table `sqlite_sequence` tracks autoincrement counters (`users: 23`, `entries: 63`).

```text
CONFIRMED FACT
```
Data elements that must survive SQLite → PostgreSQL migration:
1. **User Accounts**: `id`, `username`, `email`, `password` (BCrypt hash), `role`, `created_at`.
2. **Mood Entries**: `id`, `user_id` (foreign key relationship), `sentimento`, `data`.
3. **Relational Consistency**: User-to-entry foreign key associations must be preserved exactly.

---

## 10. Timestamp Normalization

```text
CONFIRMED FACT
```
The V1 database contains mixed timestamp string representations:
1. ISO 8601 strings inserted by `populate.ts` (e.g. `'2024-01-14T09:30:00Z'`).
2. SQLite `CURRENT_TIMESTAMP` strings inserted by default table constraints or Express runtime (e.g. `'2024-01-15 14:30:00'`).

```text
CONFIRMED CONSTRAINT
```
A future migration script in Milestone M4 must:
1. Parse both verified legacy representations (`ISO 8601` and `YYYY-MM-DD HH:MM:SS`).
2. Define explicit UTC timezone assumptions for SQLite datetimes that lack timezone offsets.
3. Normalize all values into PostgreSQL `TIMESTAMPTZ` columns.
4. Faithfully preserve the original semantic timestamp.
5. Report or reject unparseable values rather than inventing synthetic dates.

---

## 11. Identity and Sequence Preservation

```text
CONFIRMED FACT
```
V1 relies on integer primary keys generated via SQLite `AUTOINCREMENT`. Foreign keys in `entries.user_id` reference `users.id`.

```text
CONFIRMED CONSTRAINT
```
When migrating to PostgreSQL in Milestone M4:
1. Legacy IDs (`users.id` and `entries.id`) must be explicitly inserted into PostgreSQL to preserve relational links and historical client bookmarks.
2. PostgreSQL sequences (associated with `BIGSERIAL` or `IDENTITY` columns) must be explicitly resynchronized post-import via:
   ```sql
   SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
   SELECT setval(pg_get_serial_sequence('entries', 'id'), COALESCE(MAX(id), 1)) FROM entries;
   ```
   This prevents duplicate key violations on subsequent insertions.

---

## 12. Security Findings Affecting V2

```text
CONFIRMED FACT
```
The following verified security findings from M0 dictate mandatory fixes during V2 development:
- **Privilege Escalation**: `POST /api/users/signup` accepts `role: "admin"` -> **Fix in M2**: Hardcode new registrations to `'user'`.
- **Missing Admin Gate**: `GET /api/users` has no role check -> **Fix in M2**: Gate with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles('admin')`.
- **JWT Password Hash Leak**: `loginUser` passes full DB row to `jwt.sign` -> **Fix in M2**: Construct a minimal, safe `JwtPayload` object.
- **Weak Password Validation**: Minimum 3 characters accepted -> **Fix in M2**: Enforce minimum 8 characters with complexity rules.
- **Unvalidated Configuration**: `process.env.JWT_SECRET!` used without startup validation -> **Fix in M1**: Enforce configuration validation via `@nestjs/config`.
- **CORS Development Origin**: Port 5173 omitted from default allowed origins -> **Fix in M1**: Classify as operational/developer-experience debt and configure development origins comprehensively.

---

## 13. Incremental Migration Strategy

To avoid high-risk "big-bang" rewrites, the migration proceeds through the established repository milestones:

```text
M0 — Preserve V1 Baseline (Current)
     Baseline analysis, security audit, API/schema inventory, migration contract
     ↓
M1 — NestJS + PostgreSQL Foundation
     NestJS scaffolding, PostgreSQL database setup, ORM & migration framework, testing harness
     ↓
M2 — Authentication & Users
     User entities, registration, secure login, JWT issuance, RBAC guards, user profile management
     ↓
M3 — Mood Entries
     Entry entities, CRUD operations, ownership verification, analytics/stats aggregations
     ↓
M4 — V1 Data Migration & Cutover
     SQLite data extraction, timestamp normalization, PostgreSQL sequence resync, verification scripts
     ↓
M5 — Hardening & V2 Release
     Security review, performance audit, end-to-end regression validation, production cutover
```

The existing React frontend remains intact and functional against the Express API until the NestJS API is operational and verified for wire compatibility.

---

## 14. Proposed V2 Directions

```text
PROPOSED V2 DIRECTION
```
- **NestJS Modular Architecture**: Separate into `AuthModule`, `UsersModule`, `EntriesModule`, `QuotesModule`, and `ConfigModule`.
- **Decoupled Data Layer**: Use separate persistence entities and public Data Transfer Objects (DTOs) with `class-validator` and `class-transformer`.
- **Automated Testing Suite**: Establish unit and integration tests using Jest and Supertest in M1.
- **Centralized Error Handling**: Implement NestJS `ExceptionFilter` to provide uniform error envelopes (`{ statusCode, message, error, timestamp }`).

---

## 15. Open Decisions

```text
OPEN DECISION
```
The following technical decisions are intentionally deferred to their respective milestones:
1. **Persistence Framework**: Selection between TypeORM, Prisma, Kysely, or MikroORM for PostgreSQL management (Decision in **M1**).
2. **Token Transport & Storage**: Choosing between Bearer token in headers, HTTP-only cookies, or an access/refresh token architecture (Decision in **M2/M5**).
3. **Motivational Quotes Architecture**: Choosing between migrating quotes into a PostgreSQL table (`quotes` with language discriminators) or retaining static localized JSON/text assets (Decision in **M1/M4**).
4. **API Versioning Scheme**: Determining whether to introduce URI prefixing (e.g. `/api/v2/`) or maintain `/api/` in-place during frontend cutover (Decision in **M1**).

---

## 16. Cutover Validation Requirements

Prior to declaring the V2 migration complete in Milestone M4/M5, the following cutover validation criteria must be satisfied:
1. **Data Completeness**: All 23 user accounts and 63 entries from the baseline SQLite database exist in PostgreSQL with matching IDs and valid references.
2. **Credential Compatibility**: Users with legacy BCrypt hashes can authenticate successfully without password reset.
3. **Sequence Sanity**: New users and entries can be created post-migration without primary key collision.
4. **Timestamp Integrity**: All migrated timestamps accurately reflect their original UTC epoch representation.
5. **Authorization Verification**: Automated integration tests confirm that normal users cannot access admin endpoints or other users' mood records.
6. **Frontend End-to-End Operation**: The React client operates against the NestJS backend with zero functional regressions across Home, Login, Profile, Stats, History, and Settings.

---

## 17. Related V1 Documentation

This migration contract is supported by the full M0 technical analysis suite:
- [MindSpace V1 Architecture](file:///home/rodrigo/%C3%81rea%20de%20Trabalho/uni/mindspace/docs/architecture-v1.md) (`docs/architecture-v1.md`)
- [V1 API & SQLite Schema](file:///home/rodrigo/%C3%81rea%20de%20Trabalho/uni/mindspace/docs/api-sqlite-schema.md) (`docs/api-sqlite-schema.md`)
- [Security & Migration Constraints](file:///home/rodrigo/%C3%81rea%20de%20Trabalho/uni/mindspace/docs/security-migration-constraints.md) (`docs/security-migration-constraints.md`)
- [Release Baseline Reference](file:///home/rodrigo/%C3%81rea%20de%20Trabalho/uni/mindspace/docs/release-baseline-v1.md) (`docs/release-baseline-v1.md`)
