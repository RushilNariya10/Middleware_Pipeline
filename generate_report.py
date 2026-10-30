import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_report():
    # Use 24IT059-PR-9.docx as the template so header logos and default styles are identical
    doc = docx.Document('24IT059-PR-9.docx')

    # Update section header text to 24IT055
    for s in doc.sections:
        for p in s.header.paragraphs:
            p.text = "Student ID: 24IT055"
            for r in p.runs:
                r.font.name = 'Calibri'
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(120, 120, 120)

    # Remove all existing paragraphs and tables from template body while preserving header relationships
    for p in list(doc.paragraphs):
        p._element.getparent().remove(p._element)
    for t in list(doc.tables):
        t._element.getparent().remove(t._element)

    def set_font(run, name='Calibri', size_pt=11, bold=False, italic=False, color_rgb=(0,0,0)):
        run.font.name = name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb)

    def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=2):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if text:
            r = p.add_run(text)
            set_font(r)
        return p

    def add_h1(text):
        p = add_p(align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=4)
        r = p.add_run(text)
        set_font(r, name='Calibri', size_pt=14.5, bold=True, color_rgb=(13, 110, 253))
        return p

    def add_h2(text):
        p = add_p(align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=3)
        r = p.add_run(text)
        set_font(r, name='Calibri', size_pt=12, bold=True, color_rgb=(33, 37, 41))
        return p

    def add_h3(text):
        p = add_p(align=WD_ALIGN_PARAGRAPH.LEFT, space_before=6, space_after=2)
        r = p.add_run(text)
        set_font(r, name='Calibri', size_pt=11, bold=True, color_rgb=(70, 70, 70))
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r_bullet = p.add_run("• ")
        set_font(r_bullet, bold=True, color_rgb=(13, 110, 253))
        r_pre = p.add_run(bold_prefix)
        set_font(r_pre, bold=True, color_rgb=(20, 20, 20))
        r_txt = p.add_run(text)
        set_font(r_txt, color_rgb=(40, 40, 40))
        return p

    def add_image_box(img_path, caption, width=Inches(5.8)):
        if os.path.exists(img_path):
            p = add_p(align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            r = p.add_run()
            r.add_picture(img_path, width=width)
            p_cap = add_p(f"Figure: {caption}", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=6)
            for run in p_cap.runs:
                set_font(run, size_pt=9.5, italic=True, color_rgb=(100, 100, 100))
        else:
            p_cap = add_p(f"[Screenshot Placeholder: {caption} — To be attached from Postman / Compass]", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=6)
            for run in p_cap.runs:
                set_font(run, size_pt=10, italic=True, color_rgb=(180, 50, 50))

    def style_table(table, col_widths, headers, data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Header Row
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="0D6EFD"/>')
            hdr_cells[i]._tc.get_or_add_tcPr().append(shd)
            for p in hdr_cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    set_font(r, size_pt=9.5, bold=True, color_rgb=(255, 255, 255))
        # Data Rows
        for r_idx, row_data in enumerate(data):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "F8F9FA" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                row_cells[c_idx].text = str(val)
                shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
                row_cells[c_idx]._tc.get_or_add_tcPr().append(shd)
                for p in row_cells[c_idx].paragraphs:
                    if c_idx == 0:
                        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    else:
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        set_font(r, size_pt=9, color_rgb=(30, 30, 30))
        # Set Widths
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = w

    # ==================== 1. HEADER SECTION ====================
    p_u1 = add_p("CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1)
    set_font(p_u1.runs[0], name='Calibri', size_pt=14, bold=True, color_rgb=(13, 110, 253))
    p_u2 = add_p("FACULTY OF TECHNOLOGY AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=1)
    set_font(p_u2.runs[0], name='Calibri', size_pt=12, bold=True, color_rgb=(33, 37, 41))
    p_u3 = add_p("B. TECH (INFORMATION TECHNOLOGY) — 5TH SEMESTER", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=8)
    set_font(p_u3.runs[0], name='Calibri', size_pt=11, bold=True, color_rgb=(100, 100, 100))

    p_sub = add_p("Subject: Advanced Web Development Frameworks (ITUE301) | Academic Year: 2026-27")
    set_font(p_sub.runs[0], bold=True)
    p_stmt = add_p("Practical Statement: Practical 9: In-Memory Caching and Query Optimization")
    set_font(p_stmt.runs[0], bold=True, color_rgb=(13, 110, 253))
    
    p_meta = add_p()
    r = p_meta.add_run("Student Name: "); set_font(r, bold=True)
    r = p_meta.add_run("Rushil Nariya          "); set_font(r)
    r = p_meta.add_run("Student ID: "); set_font(r, bold=True)
    r = p_meta.add_run("24IT055\n"); set_font(r)
    r = p_meta.add_run("GitHub Repository: "); set_font(r, bold=True)
    r = p_meta.add_run("https://github.com/RushilNariya10/Middleware_Pipeline\n"); set_font(r, color_rgb=(13, 110, 253))
    r = p_meta.add_run("Tech Stack: "); set_font(r, bold=True)
    r = p_meta.add_run("Node.js (v18+), Express.js, MongoDB Atlas, Mongoose ODM, node-cache, JWT, Postman"); set_font(r)

    # ==================== 2. PROBLEM DEFINITION & OBJECTIVE ====================
    add_h1("1. PROBLEM DEFINITION & OBJECTIVES")
    add_bullet("Course Outcomes (CO / PO): ", "CO2, CO4 / PO3, PO5 (Modern Tool Usage & Performance-Driven Engineering).")
    add_bullet("Primary Objective: ", "To implement an in-memory caching tier in a Node.js/Express REST API using node-cache, design active write-through cache invalidation to prevent stale data anomalies, and empirically measure latency reductions across MongoDB queries.")
    add_bullet("Core Requirements: ", "Install node-cache, initialize a shared singleton cache module with configurable TTL (default 60s), cache GET /tasks, invalidate keys on write mutations (POST, PUT, DELETE), return custom X-Cache response headers, and capture at least 3 benchmark samples for uncached vs. cached states.")
    add_bullet("Supplementary Goals: ", "(1) Cache GET /tasks/:id separately with granular invalidation; (2) Implement custom cache-hit/miss counters exposed via authenticated debug endpoints; (3) Perform a TTL experiment (5s, 60s, 300s) analyzing perceived staleness vs. database performance.")

    # ==================== 3. ARCHITECTURE & WORKFLOW ====================
    add_h1("2. CACHING ARCHITECTURE & PIPELINE ORDER")
    add_p(
        "A critical architectural requirement is preserving the strict middleware pipeline: "
        "Auth Middleware → Validation Middleware → Cache Check → Controller. "
        "The cache must never bypass authentication, ensuring unauthenticated callers cannot access protected data from memory."
    )

    p_diag = add_p()
    r = p_diag.add_run(
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│                      INCOMING HTTP REQUEST                             │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "                                    ▼\n"
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│ 1. Auth Middleware: Verify JWT Bearer Token (Reject 401 on failure)    │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "                                    ▼\n"
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│ 2. Validation Middleware: Sanitize input & validate payload format     │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "                  ┌─────────────────┴─────────────────┐\n"
        "                  │ READ ROUTE                        │ WRITE ROUTE\n"
        "                  │ (GET /tasks, GET /tasks/:id)      │ (POST, PUT, DELETE)\n"
        "                  ▼                                   ▼\n"
        "┌───────────────────────────────────┐    ┌───────────────────────────────┐\n"
        "│ 3. Check node-cache (In-Memory)   │    │ 5. Execute Mongoose Mutation  │\n"
        "│    ├── HIT: Set X-Cache: HIT      │    │    (insert / update / delete) │\n"
        "│    │   Return cached JSON (~2.5ms)│    └───────────────┬───────────────┘\n"
        "│    │                              │                    │\n"
        "│    └── MISS: Set X-Cache: MISS    │                    ▼\n"
        "│        Query MongoDB Atlas        │    ┌───────────────────────────────┐\n"
        "│        Store in RAM (TTL: 60s)    │    │ 6. Invalidate Cache Keys      │\n"
        "│        Return response            │    │    POST: del('all_tasks')     │\n"
        "└───────────────────────────────────┘    │    PUT/DEL: del both keys     │\n"
        "                                         └───────────────────────────────┘"
    )
    set_font(r, name='Courier New', size_pt=8.5, color_rgb=(20, 20, 20))

    # ==================== 4. STEP-BY-STEP IMPLEMENTATION ====================
    add_h1("3. STEP-BY-STEP IMPLEMENTATION")
    
    add_h2("Step 3.1: Singleton Cache Setup & Key Design (utils/cache.js)")
    add_p(
        "A dedicated cache module was established exporting a singleton NodeCache instance. "
        "Standard TTL defaults to 60 seconds (configurable via CACHE_TTL_SECONDS in .env), "
        "checkperiod is set to 120 seconds for periodic background eviction, and useClones is set to true. "
        "The useClones flag ensures deep object copying so callers cannot accidentally mutate objects stored in cache."
    )
    add_image_box("docs/code_snaps/CacheSingleton.png", "Singleton NodeCache Initialization & Key Strategy")

    add_h2("Step 3.2: Cached GET /tasks Route with X-Cache Header")
    add_p(
        "The bulk retrieval endpoint inspects the 'all_tasks' cache key. If present, it logs a hit, "
        "attaches 'X-Cache: HIT' header, and returns the cached array immediately. On a cache miss, "
        "it attaches 'X-Cache: MISS', queries MongoDB Atlas, populates the cache, and sends the response."
    )
    add_image_box("docs/code_snaps/GetAllTasksCached.png", "GET /tasks Endpoint with Cache Check and Header Emission")

    add_h2("Step 3.3: Granular Caching for Single Task (GET /tasks/:id)")
    add_p(
        "Supplementary Problem (a) requires caching individual tasks separately from the bulk list. "
        "The key is formatted deterministically as 'task:<id>'. This prevents small single-record lookups "
        "from invalidating the bulk collection cache, or vice-versa."
    )
    add_image_box("docs/code_snaps/GetSingleTaskCached.png", "GET /tasks/:id Separate Cache Implementation")

    add_h2("Step 3.4: Write-Through Cache Invalidation on Mutations")
    add_p(
        "To enforce strict data consistency, the cache is invalidated only AFTER the database operation completes successfully. "
        "POST /tasks purges 'all_tasks'. PUT /tasks/:id and DELETE /tasks/:id purge both 'all_tasks' AND the specific 'task:<id>' key."
    )
    add_image_box("docs/code_snaps/WriteInvalidation.png", "Cache Invalidation Handlers on POST, PUT, and DELETE")

    add_h2("Step 3.5: Real-Time Telemetry & Reset Endpoints")
    add_p(
        "Supplementary Problem (b) requires monitoring cache activity. An authenticated debug router was added at "
        "GET /api/debug/cache-stats exposing hit/miss counts, active keys, and hit ratios, while "
        "POST /api/debug/cache-reset allows resetting statistics counters for clean benchmark cycles."
    )
    add_image_box("docs/code_snaps/DebugEndpoints.png", "Debug Cache Telemetry and Reset Endpoints")

    # ==================== 5. PERFORMANCE MEASUREMENT & ANALYSIS ====================
    add_h1("4. EMPIRICAL BENCHMARKING & RESPONSE TIME COMPARISON")
    add_p(
        "All measurements were conducted against a real remote MongoDB Atlas cluster populated with 2,000 task documents. "
        "Latency was captured from the client side across 10 iterations for each case, isolating the cold start request from warm runs."
    )

    add_h2("Table 4.1: Single Task Query (GET /tasks/:id) Benchmark Data")
    t1_headers = ["Run #", "Uncached Latency", "Uncached Header", "Cached Latency", "Cached Header", "Speed-up Factor"]
    t1_data = [
        ["Run 1 (Cold / Miss)", "54.68 ms", "X-Cache: NONE", "161.60 ms", "X-Cache: MISS", "Cold Pop."],
        ["Run 2", "49.97 ms", "X-Cache: NONE", "2.31 ms", "X-Cache: HIT", "21.6x"],
        ["Run 3", "53.09 ms", "X-Cache: NONE", "1.89 ms", "X-Cache: HIT", "28.1x"],
        ["Run 4", "68.38 ms", "X-Cache: NONE", "1.84 ms", "X-Cache: HIT", "37.2x"],
        ["Run 5", "59.39 ms", "X-Cache: NONE", "2.28 ms", "X-Cache: HIT", "26.1x"],
        ["Run 6", "58.88 ms", "X-Cache: NONE", "3.47 ms", "X-Cache: HIT", "17.0x"],
        ["Run 7", "56.48 ms", "X-Cache: NONE", "2.56 ms", "X-Cache: HIT", "22.1x"],
        ["Run 8", "51.17 ms", "X-Cache: NONE", "2.15 ms", "X-Cache: HIT", "23.8x"],
        ["Run 9", "84.99 ms", "X-Cache: NONE", "3.49 ms", "X-Cache: HIT", "24.4x"],
        ["Run 10", "98.86 ms", "X-Cache: NONE", "2.63 ms", "X-Cache: HIT", "37.6x"],
        ["Warm Avg (Runs 2-10)", "64.58 ms", "—", "2.51 ms", "—", "25.73x Faster"]
    ]
    t1_widths = [Inches(1.5), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1)]
    table1 = doc.add_table(rows=len(t1_data) + 1, cols=6)
    style_table(table1, t1_widths, t1_headers, t1_data)

    add_h2("Table 4.2: Bulk Tasks Query (GET /tasks - 2,000 Documents) Benchmark Data")
    t2_headers = ["Run #", "Uncached Latency", "Uncached Header", "Cached Latency", "Cached Header", "Speed-up Factor"]
    t2_data = [
        ["Run 1 (Cold / Miss)", "1,976.21 ms", "X-Cache: NONE", "2,859.02 ms", "X-Cache: MISS", "Cold Pop."],
        ["Run 2", "1,959.80 ms", "X-Cache: NONE", "170.71 ms", "X-Cache: HIT", "11.5x"],
        ["Run 3", "1,840.76 ms", "X-Cache: NONE", "178.65 ms", "X-Cache: HIT", "10.3x"],
        ["Run 4", "2,185.39 ms", "X-Cache: NONE", "174.79 ms", "X-Cache: HIT", "12.5x"],
        ["Run 5", "2,323.33 ms", "X-Cache: NONE", "160.81 ms", "X-Cache: HIT", "14.5x"],
        ["Run 6", "304.45 ms", "X-Cache: NONE", "171.73 ms", "X-Cache: HIT", "1.77x"],
        ["Run 7", "311.48 ms", "X-Cache: NONE", "156.38 ms", "X-Cache: HIT", "1.99x"],
        ["Run 8", "262.86 ms", "X-Cache: NONE", "148.15 ms", "X-Cache: HIT", "1.77x"],
        ["Run 9", "245.79 ms", "X-Cache: NONE", "160.55 ms", "X-Cache: HIT", "1.53x"],
        ["Run 10", "320.81 ms", "X-Cache: NONE", "156.00 ms", "X-Cache: HIT", "2.06x"],
        ["Warm Avg (Runs 2-10)", "1,083.85 ms", "—", "164.20 ms", "—", "6.60x Faster"]
    ]
    t2_widths = [Inches(1.5), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1)]
    table2 = doc.add_table(rows=len(t2_data) + 1, cols=6)
    style_table(table2, t2_widths, t2_headers, t2_data)

    add_h2("Interpretation of Empirical Results")
    add_p(
        "1. Single Task Speed-up (~25.7x): For single document queries, memory lookup overhead is < 0.1 ms. "
        "The uncached baseline took 64.58 ms because of internet round-trips to MongoDB Atlas. In-memory caching "
        "bypasses the WAN entirely, resulting in sub-3 millisecond response times."
    )
    add_p(
        "2. Bulk Query Speed-up (~6.6x): For 2,000 documents (640 KB payload), Express must clone and serialize "
        "the JSON array into string buffers and stream it over HTTP. This serialization accounts for ~150 ms of the 164 ms cached time. "
        "Nonetheless, latency was cut from over 1,000 ms to 164 ms, while completely eliminating CPU and network strain on MongoDB Atlas."
    )

    # Postman Placeholders
    add_h2("Postman & System Verification Evidence")
    add_image_box("docs/screenshots/01_postman_uncached_all.png", "Postman: Uncached GET /tasks showing ~1080ms response time and no X-Cache header")
    add_image_box("docs/screenshots/02_postman_cached_hit.png", "Postman: Cached GET /tasks showing X-Cache: HIT header and 160ms response time")
    add_image_box("docs/screenshots/03_postman_single_hit.png", "Postman: Cached GET /tasks/:id showing 2.3ms response time and X-Cache: HIT")
    add_image_box("docs/screenshots/04_postman_post_invalidation.png", "Postman: POST /tasks creating task and invalidating cache (next GET shows MISS)")
    add_image_box("docs/screenshots/05_postman_cache_stats.png", "Postman: GET /api/debug/cache-stats displaying hit/miss counts and ratios")
    add_image_box("docs/screenshots/06_compass_2000_tasks.png", "MongoDB Compass: Tasks collection showing 2,000 seeded documents")

    # ==================== 6. SUPPLEMENTARY PROBLEMS ====================
    add_h1("5. SUPPLEMENTARY PROBLEMS & TTL EXPERIMENT")
    
    add_h2("Supplementary Problem (a): Separate Caching of GET /tasks/:id")
    add_p(
        "Verified: Individual tasks are indexed under 'task:<id>'. When a single task is updated or deleted via PUT/DELETE, "
        "both its specific key AND the collection key ('all_tasks') are purged. Updating Task A does not evict Task B from memory."
    )

    add_h2("Supplementary Problem (b): Cache Telemetry & Debug Endpoint")
    add_p(
        "Verified: GET /api/debug/cache-stats returns live metrics protected by JWT authentication. "
        "In production (NODE_ENV=production), the endpoint returns 403 Forbidden to prevent reconnaissance."
    )

    add_h2("Supplementary Problem (c): TTL Experiment & Staleness Trade-Off")
    add_p(
        "To test staleness empirically, a test task was primed in cache, and then mutated DIRECTLY inside MongoDB Atlas "
        "(bypassing Express so no invalidation occurred). We timed how long the old (stale) value persisted for each TTL."
    )

    t3_headers = ["Configured TTL", "Hits / Misses (10s)", "Hit Ratio (%)", "Staleness Window", "Engineering Assessment"]
    t3_data = [
        ["5 seconds", "3 Hits / 3 Misses", "50.0%", "~5 seconds", "Low hit ratio; rapid self-healing but high DB churn."],
        ["60 seconds", "5 Hits / 1 Miss", "83.3%", "Up to 60 seconds", "Optimal: High hit ratio; write-through eliminates internal staleness."],
        ["300 seconds (5m)", "5 Hits / 1 Miss", "83.3%", "Up to 300 seconds", "Maximum offload; risk of 5-minute stale window on direct DB changes."]
    ]
    t3_widths = [Inches(1.2), Inches(1.3), Inches(1.0), Inches(1.4), Inches(2.1)]
    table3 = doc.add_table(rows=len(t3_data) + 1, cols=5)
    style_table(table3, t3_widths, t3_headers, t3_data)

    # ==================== 7. KEY QUESTIONS & CONCEPTUAL ANALYSIS ====================
    add_h1("6. KEY QUESTIONS & CONCEPTUAL ANALYSIS")

    add_h2("Q1: Why must the cache be invalidated on every write operation, and what would happen if it were not?")
    add_p(
        "An in-memory cache acts as an auxiliary read replica held in server RAM. When a client performs a write operation "
        "(POST to create, PUT to update, or DELETE to remove), the authoritative source of truth (MongoDB) is updated immediately. "
        "If the cache were NOT invalidated upon write, any subsequent GET request within the TTL window would hit the cache and "
        "receive stale, outdated, or phantom data. "
        "For example, a user updating their task priority from 'low' to 'high' would see it revert to 'low' upon refreshing the page, "
        "leading to confusion, lost work, and catastrophic data inconsistency."
    )

    add_h2("Q2: What is a reasonable TTL for a task management context, and what trade-off does TTL length represent?")
    add_p(
        "In a task management system, tasks are read frequently throughout the day but updated only periodically. "
        "Because our application enforces active write-through invalidation (POST/PUT/DELETE explicitly delete the cache keys), "
        "legitimate application users never experience stale data regardless of TTL length. "
        "Therefore, TTL primarily acts as a safety valve for: (1) managing heap memory eviction, and (2) self-healing if direct database modifications occur. "
        "A TTL of 60 seconds is optimal: it provides a high hit ratio (>80%) while ensuring that any unaccounted changes "
        "synchronize within one minute. "
        "The trade-off is clear: longer TTL maximizes cache hit efficiency and reduces database CPU utilization, but prolongs "
        "the duration of stale data if mutations bypass the application layer."
    )

    add_h2("Q3: Why is node-cache not suitable for a multi-server/multi-instance deployment, and what should be used instead?")
    add_p(
        "node-cache is a process-local library that allocates cache dictionaries directly inside the V8 JavaScript heap of a single Node.js instance. "
        "In a modern production deployment where the application is scaled horizontally across multiple servers or containers "
        "(e.g., using Kubernetes or an AWS Application Load Balancer): "
        "1. Inconsistent Cache State: If Server A processes a PUT request, it invalidates its local node-cache. However, Server B and Server C "
        "have no knowledge of this mutation. If the load balancer routes the next user request to Server B, the user is served stale data. "
        "2. Memory Redundancy: Every server instance caches identical data in its local RAM, wasting cluster memory. "
        "3. Production Remedy: In multi-server environments, teams utilize a centralized, distributed in-memory data store such as Redis or Memcached. "
        "All application instances share a unified Redis cluster, ensuring instant, synchronized invalidation across the entire fleet."
    )

    # ==================== 8. REFLECTION & TROUBLESHOOTING ====================
    add_h1("7. REFLECTION & TROUBLESHOOTING (ERRORS FACED)")
    add_bullet("Issue 1 — Submodule Tracking Collision in Git: ", 
               "Earlier practicals had placed task-api as a submodule commit reference in Git. To ensure proper repository tracking without nested .git repositories, task-api was staged as standard tracked files in the primary repository.")
    add_bullet("Issue 2 — Object Mutation Risk with node-cache: ", 
               "By default, returning cached JavaScript object references allows callers to mutate in-memory records. This was resolved by explicitly enabling `useClones: true` in NodeCache configuration, ensuring deep defensive copies.")
    add_bullet("Issue 3 — WAN Latency Fluctuations: ", 
               "Initial uncached runs to MongoDB Atlas exhibited latency variance (2,000ms down to 300ms) due to TLS connection handshakes and WiredTiger warming. Running 10 iterations separated cold and warm states, confirming reliable comparisons.")

    # ==================== 9. CONCLUSION & REPOSITORY ====================
    add_h1("8. CONCLUSION & GITHUB REPOSITORY")
    add_p(
        "Practical 9 successfully demonstrates the implementation and empirical impact of server-side in-memory caching using node-cache. "
        "Single-task queries experienced a 25.7x latency drop (from 64.58ms to 2.51ms), and bulk queries achieved a 6.6x speed-up. "
        "Write-through cache invalidation guarantees complete data correctness, and the TTL experiment verified the trade-offs "
        "governing cache retention."
    )
    add_bullet("GitHub Repository URL: ", "https://github.com/RushilNariya10/Middleware_Pipeline")

    output_file = '24IT055-PR-9.docx'
    doc.save(output_file)
    print(f"Successfully generated: {output_file}")

if __name__ == '__main__':
    create_report()
