# Lab 4: Registration, Login and JWT Authentication

[![Node.js](https://img.shields.io/badge/Node.js-v24.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.3.0-lightgrey.svg)](https://expressjs.com/)
[![SQLite3](https://img.shields.io/badge/SQLite-v3-blue.svg)](https://www.sqlite.org/)
[![JWT](https://img.shields.io/badge/JWT-jsonwebtoken_v9-orange.svg)](https://jwt.io/)
[![bcrypt](https://img.shields.io/badge/Security-bcrypt_v5-red.svg)](https://github.com/kelektiv/node.bcrypt.js)

---

## Student Details

- **Name:** Reddi Leela Syamala
- **Registration Number:** 252U1R3078
- **Section:** CSE(DS)-2B
- **Faculty:** Joel Prashanth D
- **Course:** Backend Development Fundamentals
- **Lab Number:** 04
- **Repository:** [https://github.com/reddileelasyamala-creator/BDF](https://github.com/reddileelasyamala-creator/BDF)
- **Lab Directory:** [https://github.com/reddileelasyamala-creator/BDF/tree/main/lab-04](https://github.com/reddileelasyamala-creator/BDF/tree/main/lab-04)
- **Live Render Deployment:** [https://bdf-lab-04.onrender.com](https://bdf-lab-04.onrender.com) *(Configured Web Service)*

---

## Table of Contents

1. [Objective](#objective)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Database Schema & Architecture](#database-schema--architecture)
5. [Installation & Setup Instructions](#installation--setup-instructions)
6. [Database Initialization](#database-initialization)
7. [Running the Application](#running-the-application)
8. [API Endpoint Documentation](#api-endpoint-documentation)
9. [Sample Requests & Responses](#sample-requests--responses)
10. [Password Hashing with bcrypt](#password-hashing-with-bcrypt)
11. [JSON Web Token (JWT) Architecture](#json-web-token-jwt-architecture)
12. [Postman Testing & Verified Test Cases](#postman-testing--verified-test-cases)
13. [SQLite Verification](#sqlite-verification)
14. [Screenshots Gallery](#screenshots-gallery)
15. [Problems Faced & Engineering Solutions](#problems-faced--engineering-solutions)
16. [Render Deployment Guide](#render-deployment-guide)
17. [Viva Questions & In-Depth Answers](#viva-questions--in-depth-answers)

---

## Objective

The objective of this laboratory assignment is to design and implement a secure user registration, authentication, and session authorization backend service using **Node.js**, **Express.js**, **SQLite**, **bcrypt**, and **jsonwebtoken (JWT)**.

Key engineering goals:
1. **Secure Credential Storage:** Enforce one-way cryptographic hashing of passwords using `bcrypt` with adaptive salt rounds before saving to the database, ensuring zero plain-text password exposure.
2. **Stateless Authentication:** Issue tamper-evident JSON Web Tokens (JWT) upon successful credential verification.
3. **Payload Sanitization:** Restrict the JWT payload exclusively to non-sensitive identification claims (`username`), strictly prohibiting credentials or hashes in token claims.
4. **Resilient Validation & Error Handling:** Validate input payloads, prevent duplicate user creation via database constraints, and return consistent, standards-compliant HTTP status codes (`201`, `200`, `400`, `500`).
5. **Environment-Independent Portability:** Ensure robust SQLite path resolution based on `__dirname` to prevent directory-dependent failures and ensure seamless cloud deployment on Render.

---

## Technologies Used

| Technology | Version / Module | Role in Project |
|---|---|---|
| **Node.js** | v24.20.0 (LTS runtime) | Server-side JavaScript execution environment |
| **Express.js** | v5.3.0 | REST API routing and HTTP request/response middleware |
| **SQLite3** | v6.0.1 | Embedded SQL relational database engine |
| **sqlite** | v5.1.1 | Promise-based SQLite client wrapper for `async/await` |
| **bcrypt** | v5.1.1 | Adaptive Blowfish cryptographic password hashing algorithm |
| **jsonwebtoken** | v9.0.2 | RFC 7519 JSON Web Token signing and verification |
| **nodemon** | v3.1.14 (dev) | File watching and automatic server restart for development |

---

## Project Structure

```text
lab-04/
├── database/
│   └── users.db                           # Dedicated Lab 4 SQLite database file
├── screenshots/
│   ├── 01-register-success.png            # Postman: Register valid user (201 Created)
│   ├── 02-register-duplicate.png          # Postman: Duplicate username rejected (400 Bad Request)
│   ├── 03-register-missing-username.png   # Postman: Missing username rejected (400 Bad Request)
│   ├── 04-register-missing-name.png       # Postman: Missing name rejected (400 Bad Request)
│   ├── 05-register-missing-password.png   # Postman: Missing password rejected (400 Bad Request)
│   ├── 06-login-success.png               # Postman: Login successful, returns JWT (200 OK)
│   ├── 07-login-unknown-user.png          # Postman: Non-existent username rejected (400 Bad Request)
│   ├── 08-login-wrong-password.png        # Postman: Incorrect password rejected (400 Bad Request)
│   └── 09-login-missing-credentials.png   # Postman: Missing login credentials (400 Bad Request)
├── .gitignore                             # Excludes node_modules, .env, and debug logs
├── demo_debugging.js                      # Demonstration of common bugs and security checks
├── init_db.sql                            # SQL DDL initialization script for users table
├── Lab-04-Postman-Collection.json         # Complete Postman v2.1.0 test suite (9 test cases)
├── package.json                           # Project dependencies and execution scripts
├── package-lock.json                      # Deterministic dependency lockfile
├── README.md                              # Comprehensive laboratory report and viva guide
└── server.js                              # Express application server and authentication routes
```

---

## Database Schema & Architecture

The Lab 4 database is isolated in `database/users.db`. It never reuses or interferes with Lab 2 or Lab 3 databases.

### Schema Definition (`users` table)

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
```

### Column Specifications & Constraints

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique auto-incrementing numerical user identifier |
| `username` | `TEXT` | `NOT NULL UNIQUE` | Unique login handle; prevents duplicate user signups |
| `name` | `TEXT` | `NOT NULL` | Full display name of the registered student/user |
| `password` | `TEXT` | `NOT NULL` | Cryptographic bcrypt hash (60 characters); **never plain-text** |

---

## Installation & Setup Instructions

### 1. Prerequisites
Ensure Node.js and npm are installed:
```bash
node -v
npm.cmd -v
```

### 2. Navigate to Lab 4 Directory
```bash
cd lab-04
```

### 3. Install Dependencies
```bash
npm.cmd install
```
*(On standard Bash / Linux / macOS shells, execute `npm install`)*

---

## Database Initialization

The application automatically verifies and initializes `database/users.db` and the `users` table upon server startup via `CREATE TABLE IF NOT EXISTS`.

Alternatively, manual initialization can be executed using the SQLite CLI:
```bash
sqlite3 database/users.db < init_db.sql
```

---

## Running the Application

### 1. Production Mode
```bash
npm start
```
*Equivalent command:* `node server.js`

### 2. Development Mode (with automatic restart via Nodemon)
```bash
npm run dev
```

### 3. Server Initialization Output
```text
Server is running at http://localhost:3000/
Database connected at: C:\Users\anura\.gemini\antigravity\scratch\BDF\lab-04\database\users.db
```

### 4. Port Configuration
The server dynamically binds to `process.env.PORT || 3000` and listens on `0.0.0.0` for full cloud compatibility.

---

## API Endpoint Documentation

| HTTP Method | Route Endpoint | Request Body | Expected Status | Description |
|---|---|---|:---:|---|
| `GET` | `/` | None | `200 OK` | Health check endpoint returning API metadata and route list |
| `POST` | `/register/` or `/register` | JSON (`username`, `name`, `password`) | `201 Created` | Registers a new user, hashes password with bcrypt |
| `POST` | `/register/` or `/register` | JSON (duplicate `username`) | `400 Bad Request` | Rejects signup if username already exists |
| `POST` | `/register/` or `/register` | JSON (missing required field) | `400 Bad Request` | Rejects registration with missing username, name, or password |
| `POST` | `/login/` or `/login` | JSON (`username`, `password`) | `200 OK` | Verifies credentials and generates signed JWT token |
| `POST` | `/login/` or `/login` | JSON (non-existent `username`) | `400 Bad Request` | Rejects login if user is not registered |
| `POST` | `/login/` or `/login` | JSON (incorrect `password`) | `400 Bad Request` | Rejects login if password does not match hash |
| `POST` | `/login/` or `/login` | JSON (missing credentials) | `400 Bad Request` | Rejects login if username or password is missing |

---

## Sample Requests & Responses

### 1. Registration (`POST /register/`)

#### Request:
```http
POST /register/ HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "username": "leela123",
  "name": "Leela Syamala",
  "password": "SecurePass123"
}
```

#### Successful Response (`201 Created`):
```json
{
  "message": "User registered successfully"
}
```

#### Duplicate Username Response (`400 Bad Request`):
```json
{
  "error": "Username already exists"
}
```

#### Missing Input Response (`400 Bad Request`):
```json
{
  "error": "Username, name, and password are required"
}
```

---

### 2. Login (`POST /login/`)

#### Request:
```http
POST /login/ HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "username": "leela123",
  "password": "SecurePass123"
}
```

#### Successful Response (`200 OK`):
```json
{
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImxlZWxhMTIzIiwiaWF0IjoxNzk0NjMxNzY5LCJleHAiOjE3OTQ2MzUzNjl9.IjWSlPF4EFFXJ4aPm4lo3wek_-8OHTIWG8OqT9BrMYc"
}
```

#### Unknown Username Response (`400 Bad Request`):
```json
{
  "error": "Invalid user"
}
```

#### Incorrect Password Response (`400 Bad Request`):
```json
{
  "error": "Invalid password"
}
```

#### Missing Credentials Response (`400 Bad Request`):
```json
{
  "error": "Username and password are required"
}
```

---

## Password Hashing with bcrypt

### Why Never Store Plaintext Passwords?
Storing plain-text passwords is the single most catastrophic database vulnerability. In the event of a database dump or unauthorized SQL injection read, attacker access immediately compromises every user's raw password across services where credentials are reused.

### How bcrypt Protects Passwords
`bcrypt` is an adaptive one-way cryptographic hashing function designed by Niels Provos and David Mazières, based on the Blowfish cipher:

```text
                  +--------------------------------+
                  |  Plaintext: "SecurePass123"    |
                  +--------------------------------+
                                  |
                                  v
+------------------+     +------------------+
| 10 Salt Rounds   | --> | bcrypt.hash()    |
| (Random Salt)    |     +------------------+
+------------------+              |
                                  v
+------------------------------------------------------------------+
| $2b$10$lnoIYVxD/IfMfhmKflOvkuzefTZmmm390TJXoqCKn33jNjsS1qOM6     |
+------------------------------------------------------------------+
   |   |   |                                          |
   |   |   +-- 22-char Salt (Base64)                  +-- 31-char Hash
   |   +-- Cost factor / Salt rounds: 2^10 iterations
   +-- Algorithm identifier ($2b = modern bcrypt)
```

1. **One-Way Function:** Mathematically impossible to reverse engineer the plaintext password from the generated hash.
2. **Cryptographic Salt:** bcrypt generates a unique cryptographically random salt for each hash. Even if two users choose the exact same password (`"SecurePass123"`), their resulting bcrypt hashes will be completely different, defeating precomputed **Rainbow Table attacks**.
3. **Adaptive Cost Factor (Salt Rounds):** We specify `10` salt rounds ($2^{10} = 1024$ key expansion rounds). This deliberate computational workload renders offline brute-force and dictionary attacks computationally infeasible while taking only ~100ms on the backend server.
4. **Verification via `bcrypt.compare()`:** When logging in, the server passes the candidate password and the stored database hash to `bcrypt.compare()`. The function extracts the salt and cost factor embedded in the hash, hashes the candidate password using those exact parameters, and performs a constant-time comparison to prevent timing attacks.

---

## JSON Web Token (JWT) Architecture

### What is a JWT?
JSON Web Token (RFC 7519) is a compact, URL-safe means of representing claims to be transferred between two parties. In stateless authentication, the server generates a signed token upon login and transmits it to the client; the client includes this token in subsequent requests.

### Anatomy of our Lab 4 JWT

A JWT consists of three parts separated by periods (`.`):
$$\text{JWT} = \text{Header}.\text{Payload}.\text{Signature}$$

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImxlZWxhMTIzIiwiaWF0IjoxNzk0NjMxNzY5LCJleHAiOjE3OTQ2MzUzNjl9.IjWSlPF4EFFXJ4aPm4lo3wek_-8OHTIWG8OqT9BrMYc
\___________________________________/ \_________________________________________________________________________/ \____________________________________________/
             1. Header                                                2. Payload                                                    3. Signature
```

#### 1. Header
Identifies the token type and cryptographic signing algorithm:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### 2. Payload (Claims)
Contains user claims. In compliance with the Lab 4 security specifications, the payload contains **strictly the username** along with standard timestamp claims (`iat` and `exp`):
```json
{
  "username": "leela123",
  "iat": 1794631769,
  "exp": 1794635369
}
```
> **Security Mandate:** Never include passwords, password hashes, or confidential keys in the payload. JWT payloads are Base64Url encoded, NOT encrypted. Anyone can decode and inspect the payload!

#### 3. Signature
The signature is created by hashing the Base64Url-encoded header and payload with the secret key using the specified algorithm:
```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

### Decoding vs. Verifying
- **Decoding (e.g., jwt.io):** Simply converts Base64Url strings back into readable JSON. It does **not** check whether the token was issued by a trusted server or if it has been tampered with.
- **Verification (`jwt.verify(token, secret)`):** Re-computes the HMAC-SHA256 signature using the server's private secret and compares it with the token's signature. If an attacker modifies even a single character in the header or payload, the signatures mismatch and the token is instantly rejected.

---

## Postman Testing & Verified Test Cases

The included Postman collection [`Lab-04-Postman-Collection.json`](./Lab-04-Postman-Collection.json) contains all 9 required test cases.

### Test Execution Summary Table

| Test # | Request Name | Endpoint & Method | Input Payload | Expected Status | Actual Status | Result |
|:---:|---|---|---|:---:|:---:|:---:|
| **1** | Register Valid User | `POST /register/` | `{"username":"leela123", "name":"Leela Syamala", "password":"SecurePass123"}` | `201 Created` | `201 Created` | **PASS** |
| **2** | Register Duplicate Username | `POST /register/` | `{"username":"leela123", "name":"Leela Syamala", "password":"SecurePass123"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **3** | Missing Username | `POST /register/` | `{"name":"Leela Syamala", "password":"SecurePass123"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **4** | Missing Name | `POST /register/` | `{"username":"leela456", "password":"SecurePass123"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **5** | Missing Password | `POST /register/` | `{"username":"leela789", "name":"Leela Syamala"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **6** | Login with Correct Credentials | `POST /login/` | `{"username":"leela123", "password":"SecurePass123"}` | `200 OK` | `200 OK` | **PASS** |
| **7** | Login Unknown Username | `POST /login/` | `{"username":"unknownuser999", "password":"SecurePass123"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **8** | Login Incorrect Password | `POST /login/` | `{"username":"leela123", "password":"WrongPassword999"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **9** | Login Missing Credentials | `POST /login/` | `{"username":"leela123"}` | `400 Bad Request` | `400 Bad Request` | **PASS** |

---

## SQLite Verification

Verification was executed directly against `database/users.db` to confirm schema integrity, record creation, and password hashing.

### SQLite CLI Command
```bash
sqlite3 database/users.db "SELECT id, username, name, password FROM users;"
```

### Table Output
```text
┌────┬────────────┬─────────────────┬────────────────────────────────────────────────────────────────┐
│ id │ username   │ name            │ password                                                       │
├────┼────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ 1  │ leela123   │ Leela Syamala   │ $2b$10$lnoIYVxD/IfMfhmKflOvkuzefTZmmm390TJXoqCKn33jNjsS1qOM6 │
└────┴────────────┴─────────────────┴────────────────────────────────────────────────────────────────┘
```

### Security Verification Checklist
- [x] **Users table exists:** Confirmed with primary key `id`.
- [x] **Username stored correctly:** `"leela123"` matches request.
- [x] **Name stored correctly:** `"Leela Syamala"` matches request.
- [x] **Zero plaintext exposure:** The password `"SecurePass123"` appears nowhere in the database.
- [x] **bcrypt hash structure:** Value begins with `$2b$10$`, confirming Blowfish cipher with 10 salt rounds and 60-character output length.

---

## Screenshots Gallery (9 Verified Postman Test Cases)

### 1. Successful User Registration (`POST /register/` - 201 Created)
![Successful Registration](screenshots/01-register-success.png)
*Registers new user `leela2026` with valid payload (`username`, `name`, `password`) and receives HTTP 201 Created with message `User registered successfully`.*

---

### 2. Duplicate Username Registration Error (`POST /register/` - 400 Bad Request)
![Duplicate Username Error](screenshots/02-register-duplicate.png)
*Rejects duplicate registration of existing username `leela2026` with HTTP 400 Bad Request and error `Username already exists`.*

---

### 3. Register with Missing Username Error (`POST /register/` - 400 Bad Request)
![Register Missing Username Error](screenshots/03-register-missing-username.png)
*Rejects registration attempt when the `username` field is omitted from the request body with HTTP 400 Bad Request and error `Username, name, and password are required`.*

---

### 4. Register with Missing Name Error (`POST /register/` - 400 Bad Request)
![Register Missing Name Error](screenshots/04-register-missing-name.png)
*Rejects registration attempt when the `name` field is omitted with HTTP 400 Bad Request and error `Username, name, and password are required`.*

---

### 5. Register with Missing Password Error (`POST /register/` - 400 Bad Request)
![Register Missing Password Error](screenshots/05-register-missing-password.png)
*Rejects registration attempt when the `password` field is omitted with HTTP 400 Bad Request and error `Username, name, and password are required`.*

---

### 6. Successful Login Returning Signed JWT (`POST /login/` - 200 OK)
![Successful Login](screenshots/06-login-success.png)
*Authenticates `leela123` with correct password and returns HTTP 200 OK with signed `jwt_token` containing user claims.*

---

### 7. Unknown Username Login Error (`POST /login/` - 400 Bad Request)
![Unknown Username Login Error](screenshots/07-login-unknown-user.png)
*Rejects login attempt for unregistered username `unknownuser999` with HTTP 400 Bad Request and error `Invalid user`.*

---

### 8. Incorrect Password Login Error (`POST /login/` - 400 Bad Request)
![Incorrect Password Login Error](screenshots/08-login-wrong-password.png)
*Rejects login attempt when password `WrongPassword999` does not match the stored bcrypt hash, returning HTTP 400 Bad Request and error `Invalid password`.*

---

### 9. Missing Login Credentials Error (`POST /login/` - 400 Bad Request)
![Missing Login Credentials Error](screenshots/09-login-missing-credentials.png)
*Rejects login attempt when password is omitted from the request body, returning HTTP 400 Bad Request and error `Username and password are required`.*

---

## Problems Faced & Engineering Solutions

### Problem 1: Unawaited `bcrypt.hash()` Storing `[object Promise]`
- **Cause:** `bcrypt.hash()` is an asynchronous function that returns a Promise. When written without `await` (`const hash = bcrypt.hash(password, 10)`), JavaScript passes the unresolved Promise object to SQLite. When converted to a string, it inserts `"[object Promise]"` into the database.
- **Solution:** Always `await` asynchronous cryptographic calls: `const hashedPassword = await bcrypt.hash(rawPassword, 10);`.

### Problem 2: Port Collision (`EADDRINUSE`) on Port 3000
- **Cause:** Previous background test processes or zombie Node instances remained bound to TCP port 3000.
- **Solution:** Configured dynamic port resolution `const PORT = process.env.PORT || 3000;` and used PowerShell command `Get-Process node | Stop-Process -Force` to cleanly terminate dangling instances before binding.

### Problem 3: Malformed JSON Payloads Crashing Server
- **Cause:** Sending unparseable or truncated JSON in the request body caused `express.json()` to throw an unhandled `SyntaxError`, returning default HTML 500 error pages.
- **Solution:** Added error-handling middleware immediately following `app.use(express.json())`:
  ```javascript
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ error: "Malformed JSON payload in request body" });
    }
    next(err);
  });
  ```

### Problem 4: Ephemeral Database Path Disconnects
- **Cause:** Using relative paths like `./users.db` causes the application to create databases in whatever current directory the terminal happens to be in, leading to missing tables when launched from root or during deployment.
- **Solution:** Anchored the database path using `path.join(__dirname, "database", "users.db")` and ensured auto-creation of the `database/` directory if missing.

---

## Render Deployment Guide

The application is structured for instant deployment on [Render](https://render.com) as a Web Service:

### Render Configuration Settings
- **Service Type:** Web Service
- **Runtime:** Node
- **Root Directory:** `lab-04`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `PORT`: Automatically set by Render (the server reads `process.env.PORT`)
  - `NODE_ENV`: `production`

### SQLite Persistence on Render Free Tier
> **Note on Free Instance Disk Ephemerality:** Render's free tier web services utilize ephemeral container disks. When a free instance spins down due to inactivity or restarts during a new deploy, the local filesystem resets. To retain registered user data across restarts in production environments, attach a **Render Persistent Disk** mounted at `/var/data` and configure `DB_PATH=/var/data/users.db`. For this lab assignment, `server.js` automatically creates the table schema on every cold start.

---

## Viva Questions & In-Depth Answers

### 1. What is the fundamental difference between authentication and authorization?
**Answer:**
- **Authentication (AuthN):** The process of verifying *who* a user is (e.g., verifying `username` and `password` via `POST /login/`).
- **Authorization (AuthZ):** The process of determining *what permissions* the authenticated user possesses (e.g., whether the user's role grants permission to read, edit, or delete specific resources). Authentication always precedes authorization.

### 2. Why should passwords never be stored in plain text or encrypted with two-way encryption?
**Answer:**
- **Plain text:** Any database compromise, SQL injection vulnerability, or rogue internal employee immediately exposes raw passwords, compromising accounts everywhere that user reuses that password.
- **Two-way encryption (AES/DES):** Requires storing an encryption key. If an attacker breaches the server and finds the key, they can decrypt all passwords back to plain text.
- **One-way hashing (bcrypt):** Irreversible mathematical transformation. The original password can never be recovered from the hash, even by the database administrator.

### 3. What is a "Salt" in password hashing, and how does it prevent Rainbow Table attacks?
**Answer:**
A salt is a cryptographically strong random sequence of bytes generated per password and prepended/appended before hashing.
- A **Rainbow Table** is a precomputed lookup table of millions of plaintext passwords and their corresponding hash values.
- With salting, identical passwords produce completely different hash values because their salts differ. An attacker cannot use a precomputed table and must generate a brand-new rainbow table for every single user, rendering the attack computationally impossible.

### 4. What are "Salt Rounds" in bcrypt, and why is bcrypt called an "adaptive" hash function?
**Answer:**
Salt rounds represent the cost factor ($2^{\text{rounds}}$ iterations) of the key derivation function. At 10 rounds, the algorithm runs $2^{10} = 1024$ iterations.
- It is "adaptive" because as computer hardware, CPUs, and GPUs become faster over time, developers can increment the salt rounds (e.g., to 12 or 14) to slow down the computation and maintain resistance against brute-force attacks without changing the fundamental hashing algorithm.

### 5. What are the three components of a JSON Web Token (JWT)?
**Answer:**
1. **Header:** Contains metadata including the signing algorithm (e.g., `HS256`) and the token type (`JWT`).
2. **Payload:** Contains claims such as user identity (`username`) and standard expiration timestamps (`exp`, `iat`).
3. **Signature:** The cryptographic hash formed by taking the Base64Url-encoded header and payload, hashing them with a secret key using the specified algorithm (`HMACSHA256`).

### 6. Is a JWT encrypted by default? Can someone read the payload?
**Answer:**
No, standard JWTs (JWS) are **encoded and signed, NOT encrypted**.
- The payload is encoded using Base64Url, which can be trivially decoded by anyone using tools like `jwt.io` or `Buffer.from(payload, 'base64')`.
- For this reason, sensitive information like passwords, credit card numbers, or secret keys must **never** be placed in a JWT payload. The signature only guarantees integrity and authenticity, not confidentiality.

### 7. What is the difference between decoding a JWT and verifying a JWT?
**Answer:**
- **Decoding:** Parsing the Base64Url string to inspect header and payload JSON without cryptographic checks. Anyone can decode a JWT.
- **Verifying (`jwt.verify`):** Cryptographically recalculates the signature using the server's private secret key and compares it against the third part of the token. It also asserts that the token has not expired (`exp`). If the token was altered or signed with a different key, verification throws an error.

### 8. What is the purpose of the `expiresIn` option when signing a JWT?
**Answer:**
`expiresIn` defines the token's lifetime (e.g., `"1h"`, `"24h"`). Because JWTs are stateless and the server does not store active sessions in a database, an issued token remains valid until it expires. Short expiration limits the window of opportunity for an attacker if a token is intercepted or leaked.

### 9. Why is `await` necessary when calling `bcrypt.hash()` and `bcrypt.compare()`?
**Answer:**
Both functions perform computationally heavy, non-blocking asynchronous operations handled by the libuv worker thread pool.
- Omitting `await` returns an unresolved `Promise` object immediately instead of the hash string or boolean result.
- Passing an unawaited Promise to SQLite stores `"[object Promise]"` in the database.
- Checking `if (bcrypt.compare(...))` without `await` evaluates the Promise object itself as truthy, creating a critical authentication bypass bug where any wrong password would be accepted!

### 10. How does the unique constraint in SQLite prevent race conditions during registration?
**Answer:**
By declaring `username TEXT NOT NULL UNIQUE` and maintaining an index (`idx_users_username`), the SQLite database engine enforces uniqueness at the storage engine level. Even if two identical registration requests arrive simultaneously, SQLite will atomicly allow the first insert and reject the second with `SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username`.

---

## Submission Checklist

- [x] All Lab 4 files isolated inside `lab-04/`.
- [x] Lab 1, Lab 2, and Lab 3 are completely untouched.
- [x] `.gitignore` verified to exclude `node_modules/` and `.env`.
- [x] Database path uses `path.join(__dirname, ...)` for portability.
- [x] Password hashing verified via `bcrypt` with 10 salt rounds.
- [x] JWT payload verified to contain only `username`.
- [x] All 9 Postman test cases executed and verified with 100% pass rate.
- [x] All 9 genuine Postman test screenshots organized in screenshots/ and referenced in README.
- [x] `demo_debugging.js` implemented and tested for viva defense.
- [x] Git remote verified to point to `https://github.com/reddileelasyamala-creator/BDF.git`.
- [x] Project committed and pushed to GitHub main branch.
