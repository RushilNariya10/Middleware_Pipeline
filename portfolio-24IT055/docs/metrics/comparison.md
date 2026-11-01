# Practical 8: Performance Optimization & Lazy Loading Comparison

**Student Name:** Rushil Nariya  
**Student ID:** 24IT055  
**Course:** Advanced Web Development Frameworks (ITUE301)  
**Institution:** CHARUSAT  

---

## 1. Executive Summary & Objective

In Practical 7, the Task Management React application was built into a **single monolithic JavaScript bundle** (`index-CUP8iI_s.js`, 253.73 kB uncompressed / 79.93 kB gzip). Every single view—Home, Projects, Contact, Login, Register, and Tasks—was downloaded, parsed, and evaluated on initial page load, regardless of whether the user visited that route.

In **Practical 8**, we implemented route-level code splitting using `React.lazy()` and `<Suspense>`, isolated a heavy charting library (`recharts`) behind a dynamic import boundary, added an anti-flicker delay helper (`lazyWithDelay`), and wrapped the lazy boundaries in a retryable Error Boundary.

---

## 2. Build Artifacts & Bundle Size Comparison

Measured via `vite build` terminal output before and after code splitting.

### Before Optimization (Single Monolithic Bundle)
- **HTML:** `dist/index.html` (0.48 kB | gzip: 0.31 kB)
- **CSS:** `dist/assets/index-BqZpNbOR.css` (11.77 kB | gzip: 2.91 kB)
- **JavaScript (1 file total):**
  - `dist/assets/index-CUP8iI_s.js`: **253.73 kB** (gzip: **79.93 kB**)

### After Optimization (Code-Split Chunks)
- **HTML:** `dist/index.html` (0.48 kB | gzip: 0.31 kB)
- **CSS:** `dist/assets/index-BqZpNbOR.css` (11.77 kB | gzip: 2.91 kB)
- **JavaScript (11 chunk files total):**

| Chunk Filename | Chunk Role / Component | Raw Size | Gzip Size | Download Trigger |
| :--- | :--- | :--- | :--- | :--- |
| `index-Dwc4Ukyf.js` | **Initial Application Shell** (React runtime, React-Router, AuthContext, Navbar) | **239.71 kB** | **76.93 kB** | First visit to any page (Initial Load) |
| `Home-lz7-31af.js` | Home Page route component | 1.64 kB | 0.68 kB | Navigating to `/` |
| `Projects-D8DBQer9.js` | Projects Page (GitHub API client) | 4.91 kB | 1.85 kB | Navigating to `/projects` |
| `Contact-B30u6xdd.js` | Contact Form Page | 1.35 kB | 0.69 kB | Navigating to `/contact` |
| `Login-NrSzLECZ.js` | Login Authentication Page | 1.55 kB | 0.72 kB | Navigating to `/login` |
| `Register-B_l9vWF4.js` | Register Authentication Page | 2.20 kB | 0.90 kB | Navigating to `/register` |
| `Tasks-B6ifnl2M.js` | Tasks Management (Protected CRUD) | 6.50 kB | 2.15 kB | Navigating to `/tasks` (after auth) |
| `Analytics-BYpNAmB7.js` | Analytics Page Shell | 2.99 kB | 1.27 kB | Navigating to `/analytics` |
| `TaskChart-tmZUWyI1.js` | **Heavy Third-Party Chunk** (`recharts` SVG engine) | **389.80 kB** | **111.06 kB** | Rendered inside `/analytics` |
| `ErrorMessage-DhJdkxZ8.js` | Shared Error UI component | 0.57 kB | 0.33 kB | Shared sub-chunk |
| `NotFound-D9bXoX2J.js` | 404 Fallback page | 0.31 kB | 0.24 kB | Unmatched URL route |

---

## 3. Real Browser Cold-Load Measurements

Measured over 3 automated cold-cache runs using Puppeteer CDP (Chrome DevTools Protocol) on `http://localhost:4173/` (`vite preview`), comparing unthrottled and Slow 3G network conditions:

| Network Profile | Metric | Before (Monolithic) | After (Code-Split) | Change / Delta | Honest Interpretation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unthrottled** | Total Initial JS Transferred | **247.79 KB** | **234.63 KB** | **-13.16 KB (-5.3%)** | Only the shell and the landing route (`Home`) load upfront. |
| **Unthrottled** | Number of JS Requests | 1 request | 2 requests | +1 request | 1 shell chunk + 1 Home chunk loaded in parallel. |
| **Unthrottled** | DOMContentLoaded | 124 ms | 85 ms | -39 ms (-31.5%) | Less JavaScript to parse and compile before DOM is ready. |
| **Unthrottled** | Load Event End | 124 ms | 86 ms | -38 ms (-30.6%) | Faster initial render execution. |
| **Slow 3G** (500 kbps, 400ms RTT) | Total Initial JS Transferred | **247.79 KB** | **234.10 KB** | **-13.69 KB (-5.5%)** | Payload reduction on initial download. |
| **Slow 3G** (500 kbps, 400ms RTT) | DOMContentLoaded | **2,521 ms** | **2,455 ms** | **-66 ms** | User experiences initial paint sooner. |
| **Slow 3G** (500 kbps, 400ms RTT) | Fallback UI Appearance | Never (N/A) | Clearly Observed | Improved UX | Accessible loading spinner displayed while chunks download. |

---

## 4. Honest Technical Interpretation

### Why the initial bundle reduction is ~14 KB on the landing page:
The base application shell includes React 19, `react-router-dom`, `AuthContext`, and the persistent `NavBar`. The route components themselves (`Projects`, `Tasks`, `Contact`, `Login`, `Register`) contain application business logic rather than massive dependencies. 

### Where code splitting yields massive wins:
The true power of code splitting is demonstrated with the **Heavy Chart Library (`recharts`)**:
1. Without lazy loading, importing `recharts` would have ballooned the **initial bundle from 253 KB to over 640 KB** (adding 389.8 KB raw / 111 KB gzip to **every single user**, even those just visiting the landing page or logging in).
2. With our implementation, `TaskChart-tmZUWyI1.js` is isolated into a **389.80 kB standalone chunk**. A user who simply manages tasks or browses projects **never downloads or parses this 389.80 kB payload**.
3. It downloads **only when the user clicks the Analytics route**, completely sparing initial page visitors from the bandwidth and parse penalty.

### Overhead Trade-offs:
Each split chunk incurs minimal Rollup/Vite module runtime wrapper overhead and creates an additional HTTP request. In HTTP/2 or HTTP/3 environments with multiplexing, this multi-chunk overhead is negligible compared to the memory and parse savings of avoiding unused code upfront.

---

## 5. Supplementary Problems Verification

1. **Heavy Third-Party Component:**  
   `TaskChart.jsx` containing `recharts` (`PieChart`, `BarChart`, `ResponsiveContainer`) was lazy-loaded inside `Analytics.jsx`. In `build-after.txt`, `TaskChart-tmZUWyI1.js` is generated as an independent **389.80 kB** chunk.
2. **Minimum-Delay Fallback:**  
   `lazyWithDelay(importFn, 300)` was implemented using `Promise.all` alongside a 300ms timer. This guarantees that fast connections do not experience a micro-second flickering spinner.
3. **React Profiler & Memoization:**  
   In `Tasks.jsx`, typing into the task title input previously re-rendered every single `task-card` in the list. By extracting `TaskItem` and wrapping it in `React.memo` with memoized callbacks (`useCallback` for `handleDelete`, `startEdit`, `toggleComplete`, `priorityColor`), task items only re-render when their individual properties change.
