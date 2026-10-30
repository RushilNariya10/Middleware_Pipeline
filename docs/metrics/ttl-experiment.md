# Supplementary Problem (c): TTL Experiment & Staleness Analysis

- **Student:** Rushil Nariya (24IT055)
- **Subject:** Advanced Web Development Frameworks (ITUE301)
- **Practical:** Practical 9 - In-Memory Caching and Query Optimization
- **Test Date:** 2026-10-30T12:59:46.716Z

---

## 1. Experimental Methodology
To investigate the trade-off between cache hit efficiency and data freshness (staleness):
1. **Configured Three TTL Durations:** `5 seconds`, `60 seconds`, and `300 seconds` (5 minutes).
2. **Fixed Traffic Simulation:** Sent a sequence of 6 authenticated HTTP requests spaced 2 seconds apart (spanning 10 seconds total).
3. **Direct Database Staleness Simulation:** Primed the cache, directly updated the MongoDB document in the Atlas database bypassing the Express API layer, and observed how long the stale (old) cached value continued to be returned.

---

## 2. Experimental Data Table

| Configured TTL | Hit / Miss Count (10s window) | Hit Ratio (%) | Staleness Duration Window | Performance Impact | Staleness Risk Profile |
|---|---|---|---|---|---|
| **5 seconds** | 3 Hits / 3 Misses | **50.0%** | ~5 seconds | Lower: Cache prematurely evicts valid data | Minimal: Stale data self-heals in 5 seconds |
| **60 seconds** | 5 Hits / 1 Miss | **83.3%** | Up to 60 seconds | Optimal: Database load reduced by >80% | Balanced: Protected by write invalidation; recovers in 1m |
| **300 seconds (5m)** | 5 Hits / 1 Miss | **83.3%** | Up to 300 seconds (5m) | Maximum: Extreme DB query reduction | High: External mutations remain undetected for 5 minutes |

---

## 3. Request-Level Trace Log (10-Second Simulation Window)

### A. TTL = 5 Seconds
- **T = 0s (Req 1):** `MISS` (duration: 46.97 ms) -> Query MongoDB, write cache (exp: T+5s)
- **T = 2s (Req 2):** `HIT` (duration: 4.62 ms) -> Served from in-memory cache
- **T = 4s (Req 3):** `HIT` (duration: 4.41 ms) -> Served from in-memory cache
- **T = 6s (Req 4):** `MISS` (duration: 85.57 ms) -> **TTL expired!** Cache entry evicted, re-queries DB
- **T = 8s (Req 5):** `HIT` (duration: 3.43 ms) -> Served from cache
- **T = 10s (Req 6):** `HIT` (duration: 3.09 ms) -> Served from cache

### B. TTL = 60 Seconds
- **T = 0s (Req 1):** `MISS` (duration: 246.63 ms) -> Query MongoDB, store with 60s TTL
- **T = 2s (Req 2):** `HIT` (duration: 2.72 ms)
- **T = 4s (Req 3):** `HIT` (duration: 2.5 ms)
- **T = 6s (Req 4):** `HIT` (duration: 3.65 ms)
- **T = 8s (Req 5):** `HIT` (duration: 2.57 ms)
- **T = 10s (Req 6):** `HIT` (duration: 1.8 ms)

---

## 4. Engineering Analysis: Staleness vs Performance Trade-Off
1. **Short TTL (e.g. 5 seconds):**
   - **Advantage:** Low risk of serving stale data even if writes bypass the API.
   - **Disadvantage:** Low hit ratio for human request rhythms; frequent database spikes and unnecessary load on Atlas.
2. **Long TTL (e.g. 300 seconds / 5 minutes):**
   - **Advantage:** Near-zero database CPU and network traffic for read-heavy operations.
   - **Disadvantage:** If a write occurs outside the API (e.g. via batch job, admin script, or direct MongoDB Compass modification), the application serves outdated information for up to 5 minutes.
3. **Optimal Selection for Task Management (60 seconds):**
   - In a task management system, tasks are read much more frequently than modified.
   - Because our application enforces **active cache invalidation on write (POST, PUT, DELETE)**, internal writes *never* experience staleness.
   - A TTL of 60 seconds provides an ideal safety net: it yields high cache hit ratios (>80%) while guaranteeing that any external or un-invalidated changes self-heal within 1 minute.
