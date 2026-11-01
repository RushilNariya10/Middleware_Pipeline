# Student Portfolio Website - React & Vite

A multi-page responsive React portfolio application developed as part of Web Development laboratory practicals.

**Student Name:** Rushil Nariya  
**Course:** IT - Front-End Web Development with React  
**Technology Stack:** React 19, Vite, React Router DOM v7, GitHub REST API, Vanilla CSS

---

## 📑 Practicals Overview

- **Practical 1:** Basic React components, JSX structure, and portfolio sections (Header, About, Skills, Projects, Footer).
- **Practical 2:** Multi-route navigation with React Router, dark mode state toggle, interactive cards, and contact form validation.
- **Practical 3 (Current):** REST API integration with GitHub API, asynchronous data fetching via `useEffect`, state management (`loading`, `error`, `data`), conditional rendering, search filtering, repository star counters, and error retry mechanisms.

---

## 🚀 Practical 3: API Integration and Data Rendering in React

### Objective (CO1 / PO3, PO5)
To consume a public REST API in React and handle asynchronous data with loading, success, and error states.

### Architecture & Component Tree

```
Projects.jsx (Page)
├── useEffect() → triggers fetch on mount
├── useState: repos, loading, error, username, inputUsername
│
├── [loading === true] ──> <Spinner message="Fetching repositories..." />
│
├── [error !== null]   ──> <ErrorMessage message={error} onRetry={fetchRepos} />
│
└── [success / data]   ──> <RepoList repos={repos} />
                            ├── Search bar (filter by name/language/description)
                            ├── Repo cards (stars ⭐, language badge, description)
                            └── Interactive card expansion (forks, default branch, link)
```

---

### 🔌 REST API Used

- **API Provider:** GitHub Public REST API
- **Endpoint:** `https://api.github.com/users/<username>/repos?sort=updated`
- **Default Username:** `RushilNariya` (configurable via live input in UI)
- **Authentication:** None required (Public API)

---

### 💡 Key Questions & Theory Analysis (Viva Preparation)

#### 1. Why is `useEffect` required to trigger a fetch on component mount instead of calling `fetch` directly in the component body?
> **Answer:** Calling `fetch` directly in the component body runs on every single render. When data is received and state updates (`setRepos`), React triggers a re-render, which causes `fetch` to run again, creating an **infinite re-fetching loop**.  
> Wrapping the API call inside `useEffect` with an empty dependency array `[]` (or specific dependencies) ensures the fetch executes **only once when the component mounts**.

#### 2. What is the difference between a loading state and an error state, and why must both be handled separately?
> **Answer:**
> - **Loading state (`loading = true`):** Represents an ongoing asynchronous operation. It informs the user that data is currently in flight (via a spinner/loader) so they know the app is working.
> - **Error state (`error = message`):** Occurs when the network request fails (e.g., 404 Not Found, 403 Rate Limit, offline). It prevents the application from crashing and gives actionable feedback along with a retry mechanism.
> - Both must be handled separately because they represent distinct lifecycles of network requests with different UX requirements.

#### 3. How would the user experience change if loading and error states were not implemented?
> **Answer:**
> - Without a **loading state**, the screen would appear frozen or blank while waiting for the network, making users think the page is broken.
> - Without an **error state**, API failures would result in unhandled exceptions, a permanently stuck loader, or a blank screen with no indication of what went wrong.

---

### ✨ Features Implemented in Practical 3

1. **REST API Data Fetching:** Dynamic retrieval of user repositories from GitHub REST API on mount.
2. **Loading State:** `<Spinner />` component with smooth CSS rotation during pending network requests.
3. **Error State & Recovery:** `<ErrorMessage />` component displaying clear error status and a **↻ Retry Request** button.
4. **Live Search / Filter:** Search bar filtering repositories dynamically in real time by name, language, or description.
5. **Star Count & Metadata:** Displays GitHub star count (⭐), language badge, fork indicator, default branch, and last updated date.
6. **Interactive Details Toggle:** Click any repository card to expand additional metadata and a direct link button to GitHub.
7. **Examiner / Testing Tools:** In-page controls to fetch any GitHub username or click **Test Error State** to instantly verify 404/error handling.
8. **Dark Mode Compatible:** Seamlessly switches between light and dark themes.

---

## 🛠️ Setup & Running Locally

1. **Clone or navigate to the project directory:**
   ```bash
   cd portfolio-24IT055
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```


---

## ⚡ Practical 8: Performance Optimization and Lazy Loading in React

### 1. Overview & Objective
In this practical, the React frontend of the Task Management and Portfolio application was optimized using route-based code splitting, lazy loading, and memoization techniques. Before optimization, the application loaded as a single monolithic JavaScript bundle. All routes, components, and heavy libraries were downloaded upfront.

Post-optimization, each route is compiled into a standalone chunk downloaded on-demand using `React.lazy()` and `<Suspense>`. In addition, heavy charting libraries (`recharts`) are lazy loaded, an anti-flicker delay loader is implemented, and unnecessary component re-renders are eliminated using `React.memo` and `useCallback`.

### 2. Architecture: Single Bundle vs. Code-Split

```
BEFORE (Single Monolithic Bundle):
dist/assets/index-CUP8iI_s.js (253.73 kB raw | 79.93 kB gzip)
  ├── React Runtime & React Router DOM
  ├── Home, Projects, Contact, Login, Register, Tasks
  └── App shell & global context (all loaded upfront on first page visit)

AFTER (Code-Split Chunks with Route-Level Suspense):
dist/assets/index-Dwc4Ukyf.js       (239.71 kB raw | 76.93 kB gzip) ── Initial Shell (Main Bundle)
dist/assets/Home-lz7-31af.js        (  1.64 kB raw |  0.68 kB gzip) ── Loaded when / is visited
dist/assets/Projects-D8DBQer9.js    (  4.91 kB raw |  1.85 kB gzip) ── Loaded when /projects is visited
dist/assets/Contact-B30u6xdd.js     (  1.35 kB raw |  0.69 kB gzip) ── Loaded when /contact is visited
dist/assets/Login-NrSzLECZ.js       (  1.55 kB raw |  0.72 kB gzip) ── Loaded when /login is visited
dist/assets/Register-B_l9vWF4.js    (  2.20 kB raw |  0.90 kB gzip) ── Loaded when /register is visited
dist/assets/Tasks-B6ifnl2M.js       (  6.50 kB raw |  2.15 kB gzip) ── Loaded when /tasks is visited
dist/assets/Analytics-BYpNAmB7.js   (  2.99 kB raw |  1.27 kB gzip) ── Loaded when /analytics is visited
dist/assets/TaskChart-tmZUWyI1.js   (389.80 kB raw | 111.06 kB gzip) ── Loaded only inside /analytics
```

### 3. Key Optimizations Implemented
1. **Route-Level Code Splitting:** Converted static page imports to dynamic imports using `React.lazy()` wrapped around routes.
2. **Accessible Route Fallback:** Added `<LoadingFallback />` displaying a polished spinner and "Loading page..." text with `role="status"` and `aria-live="polite"`.
3. **Route Error Boundary:** Added `<RouteErrorBoundary>` around the `<Routes>` block to catch network chunk-load failures with a one-click retry reload.
4. **Supplementary Problem (a) - Heavy Third-Party Component:** Isolated `recharts` into `TaskChart.jsx`, generating a standalone 389.80 kB chunk loaded purely when visiting the Analytics tab.
5. **Supplementary Problem (b) - Minimum-Delay Fallback:** Created `lazyWithDelay(importFn, 300)` enforcing a minimum 300ms resolution threshold to prevent jarring spinner flicker on fast broadband.
6. **Supplementary Problem (c) - React Profiler & Memoization:** Identified that typing into the "Add Task" title/description inputs caused all child tasks to re-render. Extracted `TaskItem` and wrapped it in `React.memo` with `useCallback` handler functions, preventing re-renders of the task list items.

### 4. Real Measurements: Before vs. After

| Metric | Before (Monolithic) | After (Code-Split) | Improvement / Delta |
| :--- | :--- | :--- | :--- |
| **Initial JS Files Count** | 1 file | 2 files (Shell + Home) | Split across on-demand chunks |
| **Initial Transferred JS (Unthrottled)** | **247.79 KB** | **234.63 KB** | **-13.16 KB (-5.3%)** |
| **Initial Transferred JS (Slow 3G)** | **247.79 KB** | **234.10 KB** | **-13.69 KB (-5.5%)** |
| **DOMContentLoaded (Unthrottled)** | 124 ms | 85 ms | **-39 ms (-31.5%)** |
| **Load Event End (Unthrottled)** | 124 ms | 86 ms | **-38 ms (-30.6%)** |
| **DOMContentLoaded (Slow 3G)** | 2,521 ms | 2,455 ms | **-66 ms faster** |
| **Heavy Chart Isolation (`recharts`)** | Upfront in bundle | On-Demand (389.80 kB saved upfront) | **100% saved on initial load** |

Detailed metrics and raw test runs are documented in [`docs/metrics/comparison.md`](docs/metrics/comparison.md) and [`docs/metrics/after.json`](docs/metrics/after.json).

### 5. Screenshots & Evidence
- Baseline unthrottled run: [`docs/screenshots/before-unthrottled.png`](docs/screenshots/before-unthrottled.png)
- Baseline Slow 3G run: [`docs/screenshots/before-slow3g.png`](docs/screenshots/before-slow3g.png)
- Post-optimization unthrottled: [`docs/screenshots/after-unthrottled.png`](docs/screenshots/after-unthrottled.png)
- Fallback UI under Slow 3G: [`docs/screenshots/after-fallback-slow3g.png`](docs/screenshots/after-fallback-slow3g.png)
- Lazy-loaded Analytics Recharts: [`docs/screenshots/after-analytics-chart.png`](docs/screenshots/after-analytics-chart.png)

### 6. How to Reproduce the Measurements
```bash
# 1. Build the production distribution
npm run build

# 2. Launch production preview server
npm run preview

# 3. In another terminal, run Puppeteer benchmark script
node measure-after.cjs
```
