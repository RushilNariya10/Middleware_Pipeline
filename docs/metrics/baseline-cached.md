# Baseline Performance Report (CACHED)

- **Practical:** Practical 9 - In-Memory Caching and Query Optimization
- **Student ID:** 24IT055 (Rushil Nariya)
- **Dataset Size:** 2000 task documents
- **Timestamp:** 2026-10-30T12:47:31.654Z
- **Database:** MongoDB Atlas (M0 Tier)
- **Cache Status:** ENABLED (node-cache In-Memory)

---

## 1. GET /tasks (All 2000 Tasks)

### Summary Statistics
- **Cold Request (Run 1):** 2859.02 ms
- **Warm Requests Avg (Runs 2–10):** 164.2 ms
- **Warm Min:** 148.15 ms | **Warm Max:** 178.65 ms
- **Overall Avg (Runs 1–10):** 433.68 ms

### Detailed Readings
| Run # | Response Time (ms) | HTTP Status | Cache Header | Result / Observation |
|---|---|---|---|---|
| Run 1 | 2859.02 ms | 200 | `MISS` | Cold DB query / network fetch (2000 tasks) |
| Run 2 | 170.71 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 3 | 178.65 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 4 | 174.79 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 5 | 160.81 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 6 | 171.73 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 7 | 156.38 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 8 | 148.15 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 9 | 160.55 ms | 200 | `HIT` | Warm DB query (2000 tasks) |
| Run 10 | 156.00 ms | 200 | `HIT` | Warm DB query (2000 tasks) |

---

## 2. GET /tasks/:id (Single Task: `6ae427f47ff3f76008a33edf`)

### Summary Statistics
- **Cold Request (Run 1):** 161.6 ms
- **Warm Requests Avg (Runs 2–10):** 2.51 ms
- **Warm Min:** 1.84 ms | **Warm Max:** 3.49 ms
- **Overall Avg (Runs 1–10):** 18.42 ms

### Detailed Readings
| Run # | Response Time (ms) | HTTP Status | Cache Header | Result / Observation |
|---|---|---|---|---|
| Run 1 | 161.60 ms | 200 | `MISS` | Cold single-doc query |
| Run 2 | 2.31 ms | 200 | `HIT` | Warm single-doc query |
| Run 3 | 1.89 ms | 200 | `HIT` | Warm single-doc query |
| Run 4 | 1.84 ms | 200 | `HIT` | Warm single-doc query |
| Run 5 | 2.28 ms | 200 | `HIT` | Warm single-doc query |
| Run 6 | 3.47 ms | 200 | `HIT` | Warm single-doc query |
| Run 7 | 2.56 ms | 200 | `HIT` | Warm single-doc query |
| Run 8 | 2.15 ms | 200 | `HIT` | Warm single-doc query |
| Run 9 | 3.49 ms | 200 | `HIT` | Warm single-doc query |
| Run 10 | 2.63 ms | 200 | `HIT` | Warm single-doc query |

---

## 3. Analysis & Observations
1. **Database Query Overhead:** Every request triggers a complete network round-trip from the Node.js application to the MongoDB Atlas cluster over HTTPS/TLS, followed by Mongoose BSON document deserialization.
2. **Payload Impact:** Serializing and transmitting 2000 tasks takes ~164.2 ms, which is order of magnitudes slower than single-task retrieval (~2.51 ms).
3. **Database Resource Consumption:** Uncached reads continuously place CPU and network load on the database server, demonstrating the critical need for an in-memory caching tier.
