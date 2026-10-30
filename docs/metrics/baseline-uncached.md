# Baseline Performance Report (UNCACHED)

- **Practical:** Practical 9 - In-Memory Caching and Query Optimization
- **Student ID:** 24IT055 (Rushil Nariya)
- **Dataset Size:** 2000 task documents
- **Timestamp:** 2026-10-30T12:41:11.943Z
- **Database:** MongoDB Atlas (M0 Tier)
- **Cache Status:** DISABLED (Direct MongoDB Atlas Queries)

---

## 1. GET /tasks (All 2000 Tasks)

### Summary Statistics
- **Cold Request (Run 1):** 1976.21 ms
- **Warm Requests Avg (Runs 2–10):** 1083.85 ms
- **Warm Min:** 245.79 ms | **Warm Max:** 2323.33 ms
- **Overall Avg (Runs 1–10):** 1173.09 ms

### Detailed Readings
| Run # | Response Time (ms) | HTTP Status | Cache Header | Result / Observation |
|---|---|---|---|---|
| Run 1 | 1976.21 ms | 200 | `NONE` | Cold DB query / network fetch (2000 tasks) |
| Run 2 | 1959.80 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 3 | 1840.76 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 4 | 2185.39 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 5 | 2323.33 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 6 | 304.45 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 7 | 311.48 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 8 | 262.86 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 9 | 245.79 ms | 200 | `NONE` | Warm DB query (2000 tasks) |
| Run 10 | 320.81 ms | 200 | `NONE` | Warm DB query (2000 tasks) |

---

## 2. GET /tasks/:id (Single Task: `6ae427f47ff3f76008a33edf`)

### Summary Statistics
- **Cold Request (Run 1):** 54.68 ms
- **Warm Requests Avg (Runs 2–10):** 64.58 ms
- **Warm Min:** 49.97 ms | **Warm Max:** 98.86 ms
- **Overall Avg (Runs 1–10):** 63.59 ms

### Detailed Readings
| Run # | Response Time (ms) | HTTP Status | Cache Header | Result / Observation |
|---|---|---|---|---|
| Run 1 | 54.68 ms | 200 | `NONE` | Cold single-doc query |
| Run 2 | 49.97 ms | 200 | `NONE` | Warm single-doc query |
| Run 3 | 53.09 ms | 200 | `NONE` | Warm single-doc query |
| Run 4 | 68.38 ms | 200 | `NONE` | Warm single-doc query |
| Run 5 | 59.39 ms | 200 | `NONE` | Warm single-doc query |
| Run 6 | 58.88 ms | 200 | `NONE` | Warm single-doc query |
| Run 7 | 56.48 ms | 200 | `NONE` | Warm single-doc query |
| Run 8 | 51.17 ms | 200 | `NONE` | Warm single-doc query |
| Run 9 | 84.99 ms | 200 | `NONE` | Warm single-doc query |
| Run 10 | 98.86 ms | 200 | `NONE` | Warm single-doc query |

---

## 3. Analysis & Observations
1. **Database Query Overhead:** Every request triggers a complete network round-trip from the Node.js application to the MongoDB Atlas cluster over HTTPS/TLS, followed by Mongoose BSON document deserialization.
2. **Payload Impact:** Serializing and transmitting 2000 tasks takes ~1083.85 ms, which is order of magnitudes slower than single-task retrieval (~64.58 ms).
3. **Database Resource Consumption:** Uncached reads continuously place CPU and network load on the database server, demonstrating the critical need for an in-memory caching tier.
