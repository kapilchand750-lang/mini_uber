# Mini Uber --- Backend Authentication Implementation & Debugging Guide

> **Project:** Mini Uber --- Ride-Sharing Management System\
> **Backend:** Node.js, Express, MySQL\
> **Authentication:** Joi validation, Argon2 password hashing, JWT
> access tokens, opaque refresh tokens\
> **Database:** `MINI_UBER`\
> **Backend directory:** `D:\codes\Project\mini_uber\backend`\
> **Status:** Core authentication flow implemented and manually tested
> by the developer; see verification notes and known caveats below.

## 1. Purpose

This README records the authentication work completed so far, file
responsibilities, API routes, request flows, Postman checks, debugging
problems encountered, and next steps.

It is a project handover and troubleshooting reference. It does **not**
claim the implementation is production-ready: a final code review and
repeatable automated tests are still recommended, especially for
refresh-token concurrency and transaction cleanup.

## 2. Implemented features

-   Registration request validation with Joi.
-   Password hashing and verification with Argon2id.
-   User and credential creation in MySQL.
-   Login with generic invalid-credentials responses.
-   JWT access-token generation using HS256.
-   Bearer-token middleware for protected routes.
-   Cryptographically random refresh tokens.
-   SHA-256 hashing of refresh tokens before database storage.
-   Refresh-token session persistence in `USER_SESSION`.
-   Refresh-token rotation using a database transaction.
-   Logout by revoking a refresh-token session.
-   Postman tests for valid/invalid credentials, token verification,
    rotation, token reuse, and logout, as reported during development.

## 3. Project structure

``` text
mini_uber/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── repositories/
│   │   ├── auth.repository.js
│   │   └── session.repository.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── password.service.js
│   │   ├── token.service.js
│   │   ├── refresh-token.service.js
│   │   └── session.service.js
│   ├── validators/
│   │   └── auth.validator.js
│   ├── server4.js
│   ├── package.json
│   └── .env
└── database/
    └── schema.sql
```

`server4.js` is the existing Express entry point. Do not assume the
entry file is `server.js`.

## 4. Architecture and separation of responsibilities

  --------------------------------------------------------------------------------------
  Layer                   File                                   Responsibility
  ----------------------- -------------------------------------- -----------------------
  Routes                  `routes/auth.routes.js`                Maps HTTP paths to
                                                                 validation middleware
                                                                 and controller methods

  Validation              `validators/auth.validator.js`         Validates and
                                                                 normalizes
                                                                 registration/login
                                                                 input

  Controller              `controllers/auth.controller.js`       Handles HTTP status
                                                                 codes and JSON
                                                                 responses

  Auth service            `services/auth.service.js`             Coordinates
                                                                 registration and
                                                                 credential verification

  Password service        `services/password.service.js`         Hashes and verifies
                                                                 passwords with Argon2

  JWT service             `services/token.service.js`            Signs and verifies
                                                                 access JWTs

  Refresh-token service   `services/refresh-token.service.js`    Generates opaque
                                                                 refresh tokens and
                                                                 hashes them

  Session service         `services/session.service.js`          Coordinates session
                                                                 creation, refresh
                                                                 rotation, and
                                                                 revocation

  Auth repository         `repositories/auth.repository.js`      Queries user and
                                                                 credential data

  Session repository      `repositories/session.repository.js`   Inserts, looks up,
                                                                 rotates, and revokes
                                                                 sessions

  DB config               `config/db.js`                         Creates the MySQL
                                                                 connection pool

  Middleware              `middleware/auth.middleware.js`        Validates Bearer JWTs
                                                                 and sets `req.user`
  --------------------------------------------------------------------------------------

This structure supports the Single Responsibility Principle (SRP): each
layer has a focused job.

## 5. Environment configuration

File: `backend/.env`

Required variables:

``` env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_NAME=MINI_UBER
DB_PORT=3306

JWT_ACCESS_SECRET=YOUR_RANDOM_SECRET
JWT_ACCESS_EXPIRES_IN=15m
```

-   Generate a strong access-token secret locally. Do not paste it into
    chat, commit it, or include it in README files.
-   Keep `.env` out of Git using `.gitignore`.
-   Provide `.env.example` with placeholders only.
-   `JWT_ACCESS_EXPIRES_IN` should be set exactly as named. During
    debugging, `Secret loaded: true` and `Expiry: undefined` showed that
    the secret was loading but the expiry variable was missing or
    misnamed.
-   `config/db.js` calls `require("dotenv").config()`. Loading dotenv
    once near the top of `server4.js` is also a reasonable way to make
    configuration initialization explicit.

Safe configuration check, run from `backend`:

``` powershell
node -e "require('dotenv').config(); console.log('Secret loaded:', Boolean(process.env.JWT_ACCESS_SECRET)); console.log('Expiry:', process.env.JWT_ACCESS_EXPIRES_IN)"
```

Expected output:

``` text
Secret loaded: true
Expiry: 15m
```

Never print the secret itself.

## 6. Database: `USER_SESSION`

The table was inspected with `DESC USER_SESSION` and
`SHOW CREATE TABLE USER_SESSION`. Its confirmed columns are:

  -----------------------------------------------------------------------
  Column                  Type                    Purpose
  ----------------------- ----------------------- -----------------------
  `session_id`            `BIGINT UNSIGNED`, PK,  Session identifier
                          auto increment          

  `user_id`               `INT UNSIGNED`, FK to   Session owner
                          `USER.user_id`          

  `refresh_token_hash`    `VARCHAR(255)`, unique, SHA-256 hash of the
                          not null                refresh token

  `expires_at`            `DATETIME`, not null    Refresh-token expiry

  `created_at`            `TIMESTAMP`, default    Session creation time
                          current timestamp       

  `revoked_at`            `DATETIME`, nullable    `NULL` means not
                                                  revoked
  -----------------------------------------------------------------------

The foreign key references `USER(user_id)` with `ON DELETE CASCADE`. No
schema changes were needed for the refresh-token work.

Useful inspection query:

``` sql
SELECT
    session_id,
    user_id,
    expires_at,
    created_at,
    revoked_at
FROM USER_SESSION
ORDER BY session_id DESC
LIMIT 10;
```

Do not select or share real refresh-token hashes in screenshots or logs
unless strictly necessary.

## 7. Registration flow

``` mermaid
flowchart TD
    A[POST /api/auth/register] --> B{Joi validation passes?}
    B -- No --> C[400 VALIDATION_ERROR]
    B -- Yes --> D[Auth controller]
    D --> E[Auth service]
    E --> F[Argon2id hashes password]
    F --> G[Begin MySQL transaction]
    G --> H[Insert USER row]
    H --> I[Insert USER_CREDENTIAL row]
    I --> J{All inserts succeed?}
    J -- Yes --> K[Commit transaction]
    K --> L[201 Created with safe user data]
    J -- No --> M[Rollback transaction]
    M --> N{Duplicate key?}
    N -- Yes --> O[409 DUPLICATE_ENTRY]
    N -- No --> P[500 generic registration error]
```

Important behavior: - Passwords are never stored in plain text. - The
response must not include `password_hash`. - Duplicate
username/email/other unique values should produce a conflict response
rather than a generic success. - `CREATE TABLE IF NOT EXISTS` does not
modify an existing table definition.

## 8. Login and token issuance flow

``` mermaid
flowchart TD
    A[POST /api/auth/login] --> B{Joi login validation passes?}
    B -- No --> C[400 VALIDATION_ERROR]
    B -- Yes --> D[Find user by username]
    D --> E{User exists?}
    E -- No --> X[401 INVALID_CREDENTIALS]
    E -- Yes --> F[Argon2 verify password]
    F --> G{Password matches?}
    G -- No --> X
    G -- Yes --> H[Sign short-lived JWT access token]
    H --> I[Generate random refresh token]
    I --> J[SHA-256 hash refresh token]
    J --> K[Insert hash and expiry into USER_SESSION]
    K --> L[200 with user + accessToken + refreshToken]
```

Current intended token settings: - Access JWT lifetime: `15m`. - JWT
algorithm: `HS256`. - Refresh token: cryptographically random 32 bytes
represented as 64 hexadecimal characters. - Refresh-token lifetime in
the service: 7 days. - Only the refresh-token hash is stored in MySQL.

If the session insert fails, login should fail rather than returning a
refresh token that cannot be used. Review this behavior when auditing
the controller.

## 9. Protected endpoint flow

Example endpoint currently used for testing:

`GET http://localhost:4000/api/test-protected`

``` mermaid
flowchart TD
    A[Request to protected endpoint] --> B{Authorization header present?}
    B -- No --> C[401 ACCESS_TOKEN_REQUIRED]
    B -- Yes --> D{Header is Bearer token?}
    D -- No --> E[401 INVALID_AUTHORIZATION_HEADER]
    D -- Yes --> F[Verify JWT signature, algorithm and expiry]
    F --> G{JWT valid?}
    G -- No --> H[401 INVALID_OR_EXPIRED_TOKEN]
    G -- Yes --> I[Set req.user from JWT claims]
    I --> J[Call next middleware/controller]
    J --> K[200 protected response]
```

Postman: 1. Call login. 2. Copy the returned `accessToken`. 3. Open the
protected request. 4. Select **Authorization → Bearer Token**. 5. Paste
the access token and send. 6. Without a token, expect `401`; with a
valid token, expect `200`.

Do not use the refresh token as a Bearer access token.

## 10. Refresh-token generation and hashing

File: `services/refresh-token.service.js`

-   `generateRefreshToken()` uses Node's
    `crypto.randomBytes(32).toString("hex")`.
-   `hashRefreshToken(token)` uses SHA-256.
-   The original refresh token is returned once to the client.
-   The database stores only its hash.
-   A deterministic hash allows the server to hash a presented token and
    compare it with the stored value.

A safe local smoke test:

``` powershell
node -e "const s = require('./services/refresh-token.service'); const t = s.generateRefreshToken(); console.log('Token length:', t.length); console.log('Hash length:', s.hashRefreshToken(t).length); console.log('Hash deterministic:', s.hashRefreshToken(t) === s.hashRefreshToken(t));"
```

Expected:

``` text
Token length: 64
Hash length: 64
Hash deterministic: true
```

This command intentionally does not print the token or hash.

## 11. Refresh-token rotation flow

Endpoint:

`POST http://localhost:4000/api/auth/refresh`

Request body:

``` json
{
  "refreshToken": "PASTE_REFRESH_TOKEN_LOCALLY"
}
```

``` mermaid
flowchart TD
    A[POST /api/auth/refresh] --> B{Refresh token supplied?}
    B -- No --> C[400 REFRESH_TOKEN_REQUIRED]
    B -- Yes --> D[Hash supplied token]
    D --> E[Find matching active, unexpired session]
    E --> F{Session found?}
    F -- No --> G[401 INVALID_REFRESH_TOKEN]
    F -- Yes --> H[Find user by session user_id]
    H --> I{User found?}
    I -- No --> G
    I -- Yes --> J[Generate replacement refresh token and hash]
    J --> K[Transaction: revoke old session]
    K --> L{Exactly one active row revoked?}
    L -- No --> M[Rollback; reject reuse/concurrency]
    L -- Yes --> N[Insert replacement session]
    N --> O{Insert succeeds?}
    O -- No --> P[Rollback]
    O -- Yes --> Q[Commit transaction]
    Q --> R[Sign new access token]
    R --> S[200 with new accessToken + refreshToken]
```

The transaction exists because revoking the old session and inserting
the new one must be atomic. If insertion fails, rollback should restore
the old session rather than leaving the user without a usable refresh
token.

### Expected rotation tests

  -----------------------------------------------------------------------
  Test                                Expected result
  ----------------------------------- -----------------------------------
  Valid active refresh token          `200 OK`; returns a new access
                                      token and a different refresh token

  Reuse old token after successful    `401 Unauthorized`
  rotation                            

  Random/malformed refresh token      `401 Unauthorized`

  Expired or revoked refresh token    `401 Unauthorized`

  Two concurrent requests using same  Exactly one should succeed; the
  token                               losing request should be handled as
                                      an invalid/reused token, ideally
                                      `401`, not `500`

  Database outage or unexpected SQL   Generic `500` response; useful
  error                               server-side diagnostic without
                                      leaking tokens
  -----------------------------------------------------------------------

The developer reported running rotation and reuse tests. Re-run the
cases after any transaction-code change.

## 12. Logout flow

Endpoint:

`POST http://localhost:4000/api/auth/logout`

Request body:

``` json
{
  "refreshToken": "PASTE_REFRESH_TOKEN_LOCALLY"
}
```

``` mermaid
flowchart TD
    A[POST /api/auth/logout] --> B{Refresh token supplied?}
    B -- No --> C[400 REFRESH_TOKEN_REQUIRED]
    B -- Yes --> D[Hash token and find active session]
    D --> E{Active session found?}
    E -- No --> F[401 INVALID_REFRESH_TOKEN]
    E -- Yes --> G[Set revoked_at on active session]
    G --> H{A row was revoked?}
    H -- No --> I[401 SESSION_ALREADY_REVOKED]
    H -- Yes --> J[200 Logout successful]
```

After logout, the refresh token should fail at `/api/auth/refresh`.
Confirm `revoked_at` is non-`NULL` for that session.

**Access-token caveat:** current logout revokes the refresh-token
session only. A previously issued access JWT generally remains valid
until its expiry (currently 15 minutes), because the protected
middleware verifies JWT signature/expiry and does not consult the
session table. This is expected for a stateless access-token design, but
it should be documented.

## 13. API summary

Base URL for local development: `http://localhost:4000`

  -----------------------------------------------------------------------------
  Method            Endpoint                Auth required?    Purpose
  ----------------- ----------------------- ----------------- -----------------
  `POST`            `/api/auth/register`    No                Register a user

  `POST`            `/api/auth/login`       No                Verify
                                                              credentials and
                                                              issue tokens

  `POST`            `/api/auth/refresh`     No access JWT;    Rotate refresh
                                            refresh token     token and issue
                                            required in body  new access token

  `POST`            `/api/auth/logout`      Refresh token     Revoke
                                            required in body  refresh-token
                                                              session

  `GET`             `/api/test-protected`   Bearer access     Verify
                                            token             access-token
                                                              middleware

  `GET`             `/api/db-test`          No (development   Check DB
                                            test)             connection

  `GET`             `/api/test`             No (development   Basic API check
                                            test)             
  -----------------------------------------------------------------------------

`/api/test` and `/api/db-test` are development utilities; remove or
restrict them before production if they are not needed.

## 14. Debugging diary --- problems encountered and resolutions

### A. `Cannot find module './services/token.service'`

**Symptom:** Node could not load the module.

**Cause:** The file was missing, saved in a different folder, or saved
with an unexpected extension.

**Fix/check:**

``` powershell
Test-Path .\services\token.service.js
node -e "console.log(Object.keys(require('./services/token.service')))"
```

Run commands from the `backend` directory. Expected exports:
`generateAccessToken`, `verifyAccessToken`.

### B. JWT expiry variable showed `undefined`

**Symptom:**

``` text
Secret loaded: true
Expiry: undefined
```

**Cause:** `JWT_ACCESS_EXPIRES_IN` was missing, misspelled, or not saved
in `backend/.env`.

**Fix/check:** ensure the `.env` contains `JWT_ACCESS_EXPIRES_IN=15m`,
then restart Node. Do not print the secret itself.

### C. Valid token returned `INVALID_OR_EXPIRED_TOKEN`

**Potential causes:** token copied incorrectly, stale token in Postman,
secret mismatch between signing and verification, environment not
loaded, invalid signature, wrong algorithm, or expiry.

**Debug procedure:** 1. Log in again and copy the newest `accessToken`.
2. In Postman, choose Authorization → Bearer Token; paste only the
token, not the word `Bearer` into the token field. 3. Verify signing and
verification use the same `JWT_ACCESS_SECRET` and `HS256`. 4. Check
server-side error name/message, e.g. `JsonWebTokenError` or
`TokenExpiredError`. 5. Keep the API response generic and never log or
return the raw token or secret.

The developer later reported that token verification succeeded.

### D. Typo in password service (`passowrd`)

**Symptom:** Login failed with a reference error.

**Cause:** A variable name was misspelled.

**Fix:** use the same parameter name throughout
`verifyPassword(passwordHash, password)` and call
`argon2.verify(passwordHash, password)`. Login was later reported
successful.

### E. Session repository typos

The pasted repository contained several typos: - `seesion_id` instead of
`session_id`. - `dql` instead of `sql`. - `affectRows` instead of
`affectedRows`.

These were corrected. A module-load check verifies syntax/export names
but does not test the SQL against MySQL.

### F. `Lock wait timeout exceeded; try restarting transaction`

**Symptom:** Refresh request returned a lock wait timeout.

**Investigation performed:** 1. `information_schema.innodb_trx` showed
an active transaction on MySQL thread `38`. 2. `SHOW FULL PROCESSLIST`
showed thread `38` sleeping. 3. `performance_schema.threads` showed a
foreground connection for MySQL user `root`, database `mini_uber`. 4. It
showed one table lock and one row lock. 5. `KILL CONNECTION 38` returned
`Unknown thread id: 38` because that connection had disappeared by then.
6. A later `information_schema.innodb_trx` query returned `Empty set`,
confirming the active transaction had cleared.

**Likely explanation:** an open transaction had been left idle while
holding a row/table lock. The exact originating code path was not
conclusively established.

**Response:** `rotateSession()` was revised to use a dedicated
connection, transaction-bound queries, rollback on errors, and
connection release.

**Important:** The revised implementation still needs code review and
repeated tests. Ensure every path---`beginTransaction`, revoke query,
insert query, commit, rollback---settles the promise and releases the
connection exactly once. Avoid repeatedly retrying refresh requests
during a lock issue.

Useful diagnostics:

``` sql
SELECT
    trx_id,
    trx_mysql_thread_id,
    trx_started,
    trx_state,
    trx_query,
    trx_tables_locked,
    trx_rows_locked
FROM information_schema.innodb_trx;
```

``` sql
SHOW FULL PROCESSLIST;
```

Only terminate a connection after identifying it as stale and confirming
it is safe to interrupt. `ROLLBACK` affects the current MySQL connection
only; it does not roll back another session's transaction.

### G. Concurrent refresh behavior

**Expected security behavior:** only one request can rotate a particular
active refresh token. The transaction's conditional update should ensure
only one request changes the old active row.

**Remaining review point:** if the losing request encounters a deadlock,
lock timeout, or stale-session condition, translate the expected
concurrency/reuse failure to `401` (or a documented `409`) rather than
returning `500`. Unexpected database failures should remain `500`. Add a
test that sends two requests in parallel and verifies exactly one
success.

## 15. Standard local development workflow

Open PowerShell or the VS Code terminal:

``` powershell
cd D:\codes\Project\mini_uber\backend
```

Start server:

``` powershell
node server4.js
```

Stop server with `Ctrl + C`.

Verify exports (module-load checks only):

``` powershell
node -e "console.log(Object.keys(require('./controllers/auth.controller')))"
node -e "console.log(Object.keys(require('./routes/auth.routes')))"
node -e "console.log(Object.keys(require('./repositories/session.repository')))"
node -e "console.log(Object.keys(require('./services/session.service')))"
```

A module-load check does not prove the endpoint or database query works.
Always follow it with an API/DB test.

## 16. Security and production-readiness checklist

-   [ ] Confirm `.env` is in `.gitignore`; rotate any secret
    accidentally committed or shared.
-   [ ] Use HTTPS in production.
-   [ ] Never log access tokens, refresh tokens, passwords, password
    hashes, or JWT secrets.
-   [ ] Keep generic authentication error messages to avoid account
    enumeration.
-   [ ] Review refresh rotation and transaction cleanup for every error
    path.
-   [ ] Test simultaneous refresh calls repeatedly.
-   [ ] Consider rate limiting login, refresh, registration, and logout
    endpoints.
-   [ ] Decide on a secure client storage strategy for refresh tokens.
    For browser apps, consider an `HttpOnly`, `Secure`, appropriately
    `SameSite` cookie and CSRF protections rather than
    JavaScript-readable long-lived tokens.
-   [ ] Validate refresh-token request size and type.
-   [ ] Consider cleanup of expired/revoked session rows.
-   [ ] Review whether logout should revoke all sessions or only the
    supplied session.
-   [ ] Decide whether immediate access-token invalidation is needed;
    current access tokens remain valid until expiry.
-   [ ] Remove or protect development-only test routes.
-   [ ] Add automated tests for success and failure paths.
-   [ ] Use least-privilege database credentials in production instead
    of a root account.
-   [ ] Configure production logging, monitoring, backups, and secrets
    management.

## 17. Current status and next steps

### Completed or implemented and tested during development

-   Registration validation and insertion.
-   Argon2 password hashing and verification.
-   Login and access-token issuance.
-   Bearer JWT middleware and protected test route.
-   Refresh-token generation, hashing, and database storage.
-   Refresh-token rotation and logout routes.
-   Manual Postman tests reported by the developer.

### Needs a final review

-   Concurrent refresh result/status mapping.
-   Complete transaction cleanup and pool connection release.
-   Re-test after the lock-timeout fix.
-   Automated integration tests.
-   README consistency with the exact current code.

### Next application feature

Once authentication passes the final repeatable test suite, proceed to
**user and driver profiles**, then vehicle management, ride
requests/matching, payments, ratings, and notifications.

## 18. Safe sharing reminder

Do not commit or send: - `.env` - real passwords - `JWT_ACCESS_SECRET` -
access tokens - refresh tokens - refresh-token hashes - production
database credentials

When asking for debugging help, share error names/messages and redacted
SQL/schema details instead.
