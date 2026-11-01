# Advanced Web Development Frameworks (AWDF - ITUE301)
## Full-Stack Project: Portfolio & Task Manager API

**Charotar University of Science and Technology (CHARUSAT)**  
**Faculty of Technology and Engineering (FTE)**  
**Department of Information Technology**  
**Course:** Advanced Web Development Frameworks (`ITUE301`) | **Semester:** 5th  

- **Student Name:** Rushil Nariya  
- **Student ID:** 24IT055  
- **Merged Source Repositories:**
  - Frontend: [portfolio-24IT055](https://github.com/RushilNariya10/portfolio-24IT055)
  - Backend & Pipeline: [Middleware_Pipeline](https://github.com/RushilNariya10/Middleware_Pipeline)
  - Core API (Practicals 4 & 5): [Task_Manager_API](https://github.com/RushilNariya10/Task_Manager_API)
  - Integration: [FullStack_Integration](https://github.com/RushilNariya10/FullStack_Integration)

---

## 📌 Project Overview

This repository represents the **unified, complete source code** of the AWDF laboratory project, progressively built across all 13 semester practicals. It brings together the React frontend client, Node.js/Express REST API backend, MongoDB persistence, JWT authentication, in-memory caching, event-driven background processing, containerization, automated testing & CI/CD pipelines, and AI-assisted task enhancements.

---

## 📑 Complete Curriculum Practical Mapping

| Practical | Module / Topic | Implementation Location | Key Highlights |
| :--- | :--- | :--- | :--- |
| **Practical 1** | Portfolio Website Setup | `portfolio-24IT055/` | React 19, Vite, responsive vanilla CSS, modular components (Header, About, Skills, Projects, Footer) |
| **Practical 2** | Client-Side Routing & State | `portfolio-24IT055/src/pages/` | React Router DOM v7 (`/`, `/projects`, `/contact`), `useState` hooks |
| **Practical 3** | External API Integration | `portfolio-24IT055/src/components/RepoList.jsx` | GitHub REST API integration, dynamic repository cards, loading spinner, error boundary, search filtering |
| **Practical 4** | RESTful API Development | `Task_Manager_API/` & `task-api/` | Express.js REST API with full CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE` `/tasks`), status codes, error handlers |
| **Practical 5** | Database & Mongoose Schema | `Task_Manager_API/models/Task.js` | MongoDB Atlas integration, Mongoose Schema with strict validation, pre-save trimming hooks, enum validation |
| **Practical 6** | Full Stack Integration | `portfolio-24IT055/src/pages/Tasks.jsx` | Frontend proxy configuration, connecting React client to backend `/tasks` endpoint |
| **Practical 7** | Authentication & Middleware | `task-api/middleware/`, `routes/auth.js` | JWT authentication, bcryptjs hashing, User model, auth middleware pipeline, AuthContext & Protected Routes in UI |
| **Practical 8** | Performance Optimization | `portfolio-24IT055/src/utils/` | Code splitting with `React.lazy` and `Suspense`, delayed route fallbacks, Recharts lazy loading, `React.memo` optimization |
| **Practical 9** | In-Memory Caching & Optimization | `task-api/utils/cache.js` | `node-cache` integration, automatic invalidation on writes, hit/miss telemetry, `/api/debug/cache-stats` |
| **Practical 10** | Event-Driven Architecture | `task-api/events.js`, `listeners.js` | Node.js `EventEmitter`, decoupled non-blocking background listeners for asynchronous tasks |
| **Practical 11** | Containerization & Deployment | `Dockerfile`, `docker-compose.yml` | Multi-stage Dockerfile for React with Nginx, backend Dockerfile, multi-container orchestration with healthchecks |
| **Practical 12** | CI/CD Pipeline & Automated Tests | `.github/workflows/ci.yml`, `__tests__/` | GitHub Actions workflow, Jest test suites, ESLint static analysis, automated CI quality gates |
| **Practical 13** | AI Service Integration | `task-api/services/aiService.js`, `Tasks.jsx` | OpenAI/Gemini AI task description generator, rate limiting, UI suggestion generator with discard/keep controls |

---

## 📂 Repository Structure

```text
AWDF-Project/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Practical 12: GitHub Actions CI workflow
├── docs/
│   ├── code_snaps/                    # Practical screenshot captures & code evidence
│   └── metrics/                       # Performance baselines, TTL experiments & comparison reports
├── portfolio-24IT055/                 # Full Frontend Client (React 19 + Vite + React Router)
│   ├── public/                        # Static assets & SVG icons
│   ├── src/
│   │   ├── assets/                    # Hero banners, SVG icons
│   │   ├── components/                # Reusable UI components & lazy chart
│   │   ├── context/                   # AuthContext for session management
│   │   ├── pages/                     # Home, Projects, Contact, Tasks, Analytics, Login, Register
│   │   └── utils/                     # lazyWithDelay utility for Suspense
│   ├── Dockerfile                     # Multi-stage production build with Nginx
│   ├── nginx.conf                     # Nginx client-side routing & caching configuration
│   └── vite.config.js                 # Vite dev server with backend API proxy
├── task-api/                          # Comprehensive Backend API (Practicals 4–13)
│   ├── assets/                        # Postman screenshots and institution logos
│   ├── middleware/                    # auth.js (JWT) & validate.js (input validation)
│   ├── models/                        # Task.js & User.js (Mongoose schemas)
│   ├── routes/                        # auth.js & ai.js (Express routers)
│   ├── services/                      # aiService.js (LLM suggestion provider)
│   ├── utils/                         # cache.js (node-cache singleton & telemetry)
│   ├── __tests__/                     # Jest automated test suites (tasks, events, ai)
│   ├── Dockerfile                     # Production Node.js container definition
│   ├── events.js & listeners.js       # Practical 10 EventEmitter setup
│   ├── server.js                      # Main Express server application
│   ├── test.js                        # Practical 5 automated test runner
│   └── test-auth.js                   # Practical 7 automated auth test runner
├── Task_Manager_API/                  # Standalone Reference for Practicals 4 & 5
│   ├── assets/                        # Postman execution proofs
│   ├── models/Task.js                 # Task schema
│   ├── server.js                      # REST API server (Practicals 4 & 5)
│   └── test.js                        # MongoMemoryServer test suite
├── scripts/                           # Telemetry, seed & benchmarking scripts
│   ├── benchmark.js
│   ├── event-demo.js
│   ├── seed.js
│   ├── ttl-experiment.js
│   └── verify-correctness.js
├── docker-compose.yml                 # Full stack multi-container orchestration
├── postman_collection.json            # Unified Postman collection for API endpoints
├── run.bat                            # One-click startup script (Windows)
├── .gitignore                         # Project-wide ignore definitions
└── package.json                       # Root workspace scripts helper
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection string
- **Docker & Docker Compose** (optional, for containerized run)

---

### Quick Start (One-Click Runner)

On Windows, double-click or run:
```cmd
run.bat
```
This script will:
1. Start the **Task Manager API** backend on `http://localhost:3000`
2. Start the **React Portfolio & Tasks** frontend on `http://localhost:5173`
3. Launch your default browser directly to `http://localhost:5173/tasks`

---

### Running via Docker Compose

To launch the complete isolated production stack with one command:
```bash
docker compose up --build
```
This provisions:
- **`awdf-mongodb`**: MongoDB 7 database container with healthcheck on port `27017`
- **`awdf-backend`**: Node.js Express API container on port `3000`
- **`awdf-frontend`**: Nginx static build container on port `5173`

---

### Manual Setup & Execution

#### 1. Backend (`task-api`)
```bash
cd task-api
npm install
cp .env.example .env     # Configure MONGO_URI, PORT, JWT_SECRET
npm run dev
```

#### 2. Frontend (`portfolio-24IT055`)
```bash
cd portfolio-24IT055
npm install
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing Suites

Each practical includes dedicated automated tests to verify functionality:

| Test Command | Scope |
| :--- | :--- |
| `npm run test:practical5` | Runs Practical 5 MongoDB Mongoose in-memory schema tests (10/10 tests) |
| `npm run test:auth` | Runs Practical 7 JWT authentication & pipeline tests (18/18 tests) |
| `cd task-api && npm test` | Runs Jest CI test suites across all endpoints, events, and AI handlers |
| `node scripts/event-demo.js` | Runs Practical 10 background EventEmitter demonstration |
| `node scripts/benchmark.js` | Runs Practical 9 cached vs uncached performance benchmarks |

---

## 🛡️ License & Academic Declaration
Developed by **Rushil Nariya (24IT055)** for the **Advanced Web Development Frameworks (ITUE301)** coursework at **CHARUSAT**.

