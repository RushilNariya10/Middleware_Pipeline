# Task Manager REST API (Practicals 4–7)

**Charotar University of Science and Technology (CHARUSAT)**  
**Faculty of Technology and Engineering (FTE)**  
**Department of Information Technology**  
**Subject:** Advanced Web Development Frameworks (`ITUE301`) | **Semester:** 5th  

- **Student Name:** Rushil Nariya  
- **Student ID:** 24IT055  
- **GitHub Repository:** [https://github.com/RushilNariya10/Task_Manager_API](https://github.com/RushilNariya10/Task_Manager_API)  
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose ODM, bcryptjs, JSON Web Tokens, React, Vite, JavaScript (ES6+)  

---

## 📌 Repository Evolution Overview

1. **Practical 4** – In-Memory REST API & Middleware Pipeline  
2. **Practical 5** – MongoDB Integration & Schema Design with Mongoose  
3. **Practical 6** – Full Stack Integration (React Frontend + Express Backend)  
4. **Practical 7** – Authentication & Middleware Pipeline (JWT, bcrypt, validation)  

---

## 🏗️ Architecture — Authentication & Middleware Pipeline (Practical 7)

```text
  +─────────────────────────────────────────────────────────────────+
  │                   Client (React / Postman)                      │
  │  - Stores JWT in localStorage                                   │
  │  - Sends Authorization: Bearer <token> on every request         │
  +─────────────────────────────────────────────────────────────────+
                                 │ HTTP Request
                                 ▼
  +─────────────────────────────────────────────────────────────────+
  │                      Express Application                        │
  │                                                                 │
  │  ┌────────────┐   ┌──────────────┐   ┌──────────────────────┐  │
  │  │ CORS + JSON│──▶│Auth Middleware│──▶│Validation Middleware │  │
  │  │  Parsing   │   │ (JWT verify) │   │ (sanitize + check)   │  │
  │  └────────────┘   └──────────────┘   └──────────────────────┘  │
  │                                              │                  │
  │                                              ▼                  │
  │                                     ┌────────────────┐         │
  │                                     │   Controller   │         │
  │                                     │  (Route Logic) │         │
  │                                     └────────────────┘         │
  +─────────────────────────────────────────────────────────────────+
                                 │
                                 ▼
  +─────────────────────────────────────────────────────────────────+
  │                       Mongoose ODM                              │
  │  - User Schema (email, hashed password, timestamps)             │
  │  - Task Schema (title, description, completed, priority)        │
  │  - Pre-save hook: bcrypt password hashing                       │
  │  - toJSON transform: strips password from all responses         │
  +─────────────────────────────────────────────────────────────────+
                                 │
                                 ▼
  +─────────────────────────────────────────────────────────────────+
  │                       MongoDB Database                          │
  │   └── users collection   { _id, email, password, timestamps }  │
  │   └── tasks collection   { _id, title, description, ...     }  │
  +─────────────────────────────────────────────────────────────────+
```

---

## 🔐 Environment Variables

Create a `.env` file in the `task-api/` directory with the following variables (see `.env.example`):

| Variable     | Description                        | Example                                |
|--------------|------------------------------------|----------------------------------------|
| `MONGO_URI`  | MongoDB connection string          | `mongodb+srv://user:pass@cluster/db`   |
| `PORT`       | Server port                        | `3000`                                 |
| `JWT_SECRET` | Secret key for signing JWT tokens  | Any long random string                 |

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## 📡 REST API Endpoint Specification

### Authentication Routes

| Method   | Endpoint            | Auth Required | Description                                | Success | Error          |
|----------|---------------------|---------------|--------------------------------------------|---------|----------------|
| **POST** | `/api/auth/register`| No            | Register a new user                        | `201`   | `400`, `409`   |
| **POST** | `/api/auth/login`   | No            | Login and receive JWT token                | `200`   | `400`, `401`   |
| **GET**  | `/api/auth/me`      | Yes           | Get current user profile                   | `200`   | `401`, `404`   |

### Task Routes (all protected)

| Method     | Endpoint      | Auth Required | Description                      | Success | Error              |
|------------|---------------|---------------|----------------------------------|---------|--------------------|
| **GET**    | `/tasks`      | Yes           | Retrieve all tasks               | `200`   | `401`, `500`       |
| **GET**    | `/tasks/:id`  | Yes           | Retrieve single task by ObjectId | `200`   | `401`, `404`       |
| **POST**   | `/tasks`      | Yes           | Create new task                  | `201`   | `400`, `401`       |
| **PUT**    | `/tasks/:id`  | Yes           | Update existing task             | `200`   | `400`, `401`, `404`|
| **DELETE** | `/tasks/:id`  | Yes           | Delete a task                    | `200`   | `401`, `404`       |

---

## 📂 Project Directory Structure

```text
task-api/
├── .env                         # Environment variables (git-ignored)
├── .env.example                 # Template with placeholder values
├── .gitignore                   # Excludes node_modules/ and .env
├── package.json                 # Dependencies and scripts
├── server.js                    # Express app: middleware + routes + error handler
├── test.js                      # Practical 5 automated tests (10 tests)
├── test-auth.js                 # Practical 7 auth tests (18 tests)
├── models/
│   ├── Task.js                  # Mongoose Task schema
│   └── User.js                  # Mongoose User schema (bcrypt hashing)
├── middleware/
│   ├── auth.js                  # JWT verification middleware
│   └── validate.js              # Input validation & sanitisation
├── routes/
│   └── auth.js                  # Register, login, /me endpoints
└── assets/                      # Screenshots for documentation

portfolio/                       # React + Vite Frontend
├── src/
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state management (login, logout, token)
│   ├── components/
│   │   ├── ProtectedRoute.jsx   # Redirects to /login if not authenticated
│   │   ├── Navbar.jsx           # Updated: Tasks link, user email, logout button
│   │   └── ...
│   ├── pages/
│   │   ├── Login.jsx            # Login form page
│   │   ├── Register.jsx         # Registration form page
│   │   ├── Tasks.jsx            # Task CRUD manager (protected)
│   │   └── ...
│   └── App.jsx                  # Routes with AuthProvider wrapper
└── vite.config.js               # Dev proxy to backend
```

---

## 🚀 Running the Project

### 1. Backend Setup

```bash
cd task-api
npm install
```

Create a `.env` file:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_secret_key
```

Start the server:
```bash
npm start
```

### 2. Frontend Setup

```bash
cd portfolio
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` with API requests proxied to `http://localhost:3000`.

### 3. Run Auth Tests

```bash
cd task-api
npm run test:auth
```

---

## 🧪 Testing with Postman

### Step 1: Register a User
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Step 2: Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```
Copy the `token` from the response.

### Step 3: Access Protected Routes
Add the header to all task requests:
```
Authorization: Bearer <paste-token-here>
```

### Step 4: Get Current User
```
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

---

## 🧠 Key Questions & Conceptual Analysis (Practical 7)

### Q1: Why hash passwords even in a demo or development project?

Even in a demonstration, storing plaintext passwords is dangerous because:
1. **Database breaches happen** — if an attacker gains read access to the database, hashed passwords resist reverse-engineering while plaintext passwords are immediately exposed.
2. **Password reuse** — users frequently reuse passwords across services; a plaintext leak in a demo could compromise their real accounts elsewhere.
3. **bcrypt is purpose-built** — it incorporates a salt (preventing rainbow-table attacks) and a configurable cost factor (making brute-force computationally expensive).
4. **Professional habit** — treating security seriously from day one builds good engineering discipline and prevents "we'll add it later" vulnerabilities from reaching production.

### Q2: What does the auth middleware verify, and what happens with a missing or expired token?

The auth middleware (`middleware/auth.js`):
1. **Reads** the `Authorization` header and checks it follows the `Bearer <token>` format.
2. **Verifies** the token signature using `jwt.verify()` with the server's `JWT_SECRET`, confirming the token was issued by this server and has not been tampered with.
3. **Checks expiry** — JWT tokens carry an `exp` claim; `jwt.verify()` automatically rejects expired tokens by throwing a `TokenExpiredError`.
4. **On success**, attaches the decoded payload (`{ id: user._id }`) to `req.user` and calls `next()`.
5. **On failure** (missing header, malformed format, tampered signature, or expired token), returns HTTP `401 Unauthorized` with a descriptive message. The `try/catch` ensures the server never crashes.

### Q3: Why is server-side validation needed even if the frontend validates?

Frontend validation improves user experience by giving instant feedback, but it provides **zero security**:
1. **Bypassable** — anyone can send HTTP requests directly using curl, Postman, scripts, or browser DevTools, completely skipping frontend checks.
2. **Server is the gatekeeper** — the API must be the single source of truth for what constitutes valid input, regardless of which client is calling it.
3. **Defense in depth** — server-side validation catches injection attempts (HTML/script tags), enforces business rules (minimum password length, required fields), and sanitises data before it reaches the database.
4. **Multiple clients** — mobile apps, CLIs, third-party integrations all hit the same API; only server-side rules are universally enforced.
