# Practical 9: In-Memory Caching and Query Optimization

**Charotar University of Science and Technology (CHARUSAT)**  
**Faculty of Technology and Engineering (FTE)**  
**Department of Information Technology**  
**Course:** Advanced Web Development Frameworks (`ITUE301`) | **Semester:** 5th  

- **Student Name:** Rushil Nariya  
- **Student ID:** 24IT055  
- **GitHub Repository:** [https://github.com/RushilNariya10/Middleware_Pipeline](https://github.com/RushilNariya10/Middleware_Pipeline)  
- **Tech Stack:** Node.js (v18+), Express.js, MongoDB Atlas, Mongoose ODM, node-cache, JSON Web Tokens (JWT), React (Vite)

---

## 📌 Repository Overview

This repository represents the full-stack Task Management platform developed across the AWDF laboratory curriculum:
1. **Practicals 4–5:** Express REST API architecture & Mongoose schema design
2. **Practical 6:** Full-stack integration with React frontend
3. **Practical 7:** JWT authentication pipeline, password hashing, and server-side validation
4. **Practical 8:** Client-side performance optimization with lazy loading & code splitting
5. **Practical 9 (Current):** In-Memory Caching (`node-cache`), write-through invalidation, and query latency optimization

---

## 🏗️ In-Memory Caching Architecture & Pipeline

In Practical 9, an in-memory caching tier was implemented using `node-cache` as a singleton module. The caching logic strictly enforces the security boundary:
```text
  Client (Postman / React)
             │
             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 1. CORS & JSON Parsing Middleware                      │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. Authentication Middleware (JWT Verification)        │
  │    (Rejects unauthenticated requests with 401 early)    │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. Server-Side Validation Middleware                   │
  │    (Sanitizes payload, checks required fields)         │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. Cache Check (node-cache singleton in RAM)           │
  │                                                        │
  │   ├── HIT  ──▶ Set X-Cache: HIT ──▶ Return Cached Data │
  │   │            (Latency: ~2.5 ms for single task)      │
  │   │                                                    │
  │   └── MISS ──▶ Set X-Cache: MISS ──▶ Query MongoDB     │
  │                ──▶ Store in Cache (TTL: 60s)           │
  │                ──▶ Return Fresh Response               │
  └──────────────────────────┬─────────────────────────────┘
                             │
    On Mutations (POST / PUT / DELETE)
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 5. Database Write Execution & Cache Invalidation       │
  │    - POST: Purges 'all_tasks' key                      │
  │    - PUT/DELETE: Purges 'all_tasks' AND 'task:<id>'    │
  │    - Guaranteed $0%$ Stale Data Served                  │
  └────────────────────────────────────────────────────────┘
```

---

## ⚙️ Environment Variables

The backend supports zero-downtime cache toggling and configurable retention via `.env`:

| Variable Name | Required | Default | Purpose |
|---|---|---|---|
| `MONGO_URI` | Yes | — | MongoDB Atlas connection string |
| `PORT` | No | `3000` | Port for the Express server |
| `JWT_SECRET` | Yes | — | Cryptographic secret for signing tokens |
| `CACHE_ENABLED` | No | `true` | On/Off toggle (`true` / `false`) for caching |
| `CACHE_TTL_SECONDS` | No | `60` | Time-to-Live retention in seconds (default 60s) |

---

## 📊 Before vs. After Empirical Performance Comparison

Benchmarked on **2,000 task documents** against a remote **MongoDB Atlas** cluster:

### Table 1: GET /tasks/:id (Single Task Query)
| Metric | Uncached Baseline | In-Memory Cached | Improvement / Factor |
|---|---|---|---|
| **Cold Request (Miss)** | 54.68 ms | 161.60 ms | Cache population cost |
| **Warm Average (Runs 2–10)** | **64.58 ms** | **2.51 ms** | **25.73x Faster (96.1% Latency Drop)** |
| **Peak Latency (Fastest Hit)** | 49.97 ms | 1.84 ms | **27.15x Faster** |
| **Header Inspection** | `X-Cache: NONE` | `X-Cache: HIT` | Postman visibility |

### Table 2: GET /tasks (All 2,000 Tasks)
| Metric | Uncached Baseline | In-Memory Cached | Improvement / Factor |
|---|---|---|---|
| **Cold Request (Miss)** | 1,976.21 ms | 2,859.02 ms | Initial query + cache set |
| **Warm Average (Runs 2–10)** | **1,083.85 ms** | **164.20 ms** | **6.60x Faster (84.8% Latency Drop)** |
| **Fastest Run** | 245.79 ms | 148.15 ms | Zero database queries |

---

## ⏱️ Supplementary Problem: TTL Experiment & Staleness Analysis

Conducted across three TTL configurations using 6 requests spaced 2 seconds apart:

| Configured TTL | Hit / Miss Count (10s window) | Hit Ratio (%) | Staleness Duration | Performance vs. Staleness Trade-off |
|---|---|---|---|---|
| **5 seconds** | 3 Hits / 3 Misses | **50.0%** | ~5 seconds | Frequent cache evictions; low database offloading |
| **60 seconds** | 5 Hits / 1 Miss | **83.3%** | Up to 60 seconds | **Optimal:** High hit ratio, protected by active write invalidation |
| **300 seconds (5m)** | 5 Hits / 1 Miss | **83.3%** | Up to 300 seconds | Maximum DB offloading; risk of staleness if modified directly in DB |

---

## 🛠️ Debug Endpoints (Protected by Auth)

Exposed under `/api/debug` for real-time monitoring:
- `GET /api/debug/cache-stats`: Returns active keys, hit/miss counters, hit ratios, and internal node-cache telemetry.
- `POST /api/debug/cache-reset`: Accepts `{"clearData": true}` to reset statistics counters and flush the cache.
- `POST /api/debug/cache-ttl`: Accepts `{"ttlSeconds": 60}` to dynamically configure TTL without server restarts.

---

## 🚀 How to Reproduce Measurements

### 1. Seed Database (2,000 Tasks)
```bash
node scripts/seed.js --count=2000
```

### 2. Start Backend Server
```bash
cd task-api
node server.js
```

### 3. Run Automated Benchmarks
```bash
# Measure Uncached Baseline
node scripts/benchmark.js uncached

# Measure Cached Performance
node scripts/benchmark.js cached

# Verify Cache Correctness & Mutation Invalidation
node scripts/verify-correctness.js

# Run TTL Staleness Experiment
node scripts/ttl-experiment.js
```

