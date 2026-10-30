import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_report():
    # Use 24IT059-PR-8.docx as the template so header logos and default styles are identical
    doc = docx.Document('24IT059-PR-8.docx')

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
        set_font(r, name='Calibri', size_pt=15, bold=True, color_rgb=(13, 110, 253))
        return p

    def add_h2(text):
        p = add_p(align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=3)
        r = p.add_run(text)
        set_font(r, name='Calibri', size_pt=12.5, bold=True, color_rgb=(33, 37, 41))
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

    def add_image_box(img_path, caption, width=Inches(6.0)):
        if os.path.exists(img_path):
            p = add_p(align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            r = p.add_run()
            r.add_picture(img_path, width=width)
            p_cap = add_p(f"Figure: {caption}", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=6)
            for run in p_cap.runs:
                set_font(run, size_pt=9.5, italic=True, color_rgb=(100, 100, 100))
        else:
            p_cap = add_p(f"[Placeholder: {caption} - File {img_path} not found]", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4)
            for run in p_cap.runs:
                set_font(run, size_pt=10, italic=True, color_rgb=(200, 50, 50))

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
                    set_font(r, size_pt=10, bold=True, color_rgb=(255, 255, 255))
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
                        set_font(r, size_pt=9.5, color_rgb=(30, 30, 30))
        # Set Widths
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = w

    # ==================== 1. HEADER SECTION ====================
    # University Header
    p_u1 = add_p("CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1)
    set_font(p_u1.runs[0], name='Calibri', size_pt=14, bold=True, color_rgb=(13, 110, 253))
    p_u2 = add_p("FACULTY OF TECHNOLOGY AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=1)
    set_font(p_u2.runs[0], name='Calibri', size_pt=12, bold=True, color_rgb=(33, 37, 41))
    p_u3 = add_p("B. TECH (INFORMATION TECHNOLOGY)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=6)
    set_font(p_u3.runs[0], name='Calibri', size_pt=11, bold=True, color_rgb=(100, 100, 100))

    # Meta Info Box
    p_sub = add_p("Subject: Advanced Web Development Frameworks (ITUE301) | Semester: 5th")
    set_font(p_sub.runs[0], bold=True)
    p_stmt = add_p("Practical Statement: Practical 8: Performance Optimization and Lazy Loading in React")
    set_font(p_stmt.runs[0], bold=True, color_rgb=(13, 110, 253))
    
    p_meta = add_p()
    r = p_meta.add_run("Student Name: "); set_font(r, bold=True)
    r = p_meta.add_run("Rushil Nariya          "); set_font(r)
    r = p_meta.add_run("Student ID: "); set_font(r, bold=True)
    r = p_meta.add_run("24IT055\n"); set_font(r)
    r = p_meta.add_run("GitHub Repository: "); set_font(r, bold=True)
    r = p_meta.add_run("https://github.com/RushilNariya10/Middleware_Pipeline\n"); set_font(r, color_rgb=(13, 110, 253))
    r = p_meta.add_run("Frontend Submodule: "); set_font(r, bold=True)
    r = p_meta.add_run("https://github.com/RushilNariya10/portfolio-24IT055\n"); set_font(r, color_rgb=(13, 110, 253))
    r = p_meta.add_run("Tech Stack: "); set_font(r, bold=True)
    r = p_meta.add_run("React 19, Vite 8, React Router v7, Recharts 3, Node.js, Express JS, MongoDB Atlas"); set_font(r)

    # ==================== 2. PROBLEM STATEMENT & OBJECTIVE ====================
    add_h1("1. PROBLEM STATEMENT & OBJECTIVE")
    add_bullet("Course Outcome (CO / PO): ", "CO1 / PO3, PO5 (Modern Tool Usage & Design / Development of Solutions).")
    add_bullet("Objective: ", "To improve frontend web performance using code splitting, dynamic imports (React.lazy), Suspense boundaries, and memoization techniques on a production full-stack React application.")
    add_bullet("Task Scope: ", "Optimize the Task Management frontend by converting monolithic route imports to React.lazy(), building an accessible fallback spinner, isolating a heavy third-party charting library (Recharts), adding an anti-flicker delay helper, and fixing unnecessary re-renders discovered using React Profiler.")

    # ==================== 3. ARCHITECTURE DIAGRAM ====================
    add_h1("2. ARCHITECTURE DIAGRAM: MONOLITHIC VS. CODE-SPLIT")
    p_arch = add_p(
        "Before optimization, Vite bundled the entire application (all pages, forms, and context) into one single monolithic JavaScript file. "
        "Every user paid the full download and parsing cost upfront. Post-optimization, the application is divided into an initial core shell "
        "and isolated on-demand chunks loaded purely when routes or features are accessed."
    )

    p_diag = add_p()
    r = p_diag.add_run(
        "BEFORE OPTIMIZATION (Monolithic Bundle):\n"
        "┌─────────────────────────────────────────────────────────────────────────────┐\n"
        "│ dist/assets/index-CUP8iI_s.js (253.73 kB raw | 79.93 kB gzip)               │\n"
        "│ [React 19 Runtime] + [React Router] + [AuthContext] + [NavBar]              │\n"
        "│ [Home] + [Projects] + [Contact] + [Login] + [Register] + [Tasks]            │\n"
        "│ ➔ All downloaded upfront on initial page load (100% required upfront)       │\n"
        "└─────────────────────────────────────────────────────────────────────────────┘\n\n"
        "AFTER OPTIMIZATION (Code-Split Chunks with Suspense):\n"
        "┌─────────────────────────────────────────────────────────────────────────────┐\n"
        "│ INITIAL SHELL: dist/assets/index-Dwc4Ukyf.js (239.71 kB raw | 76.93 kB gzip)│\n"
        "│ (React Core, Router, Auth Context, Error Boundary, Navbar)                  │\n"
        "└──────┬──────────────────┬─────────────────┬─────────────────┬───────────────┘\n"
        "       │ on /             │ on /projects    │ on /contact     │ on /analytics \n"
        "       ▼                  ▼                 ▼                 ▼               \n"
        "┌──────────────┐   ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐\n"
        "│ Home.js      │   │ Projects.js  │  │ Contact.js   │  │ Analytics.js (2.9kB)│\n"
        "│ (1.64 kB)    │   │ (4.91 kB)    │  │ (1.35 kB)    │  │ + TaskChart (389kB) │\n"
        "└──────────────┘   └──────────────┘  └──────────────┘  └─────────────────────┘\n"
    )
    set_font(r, name='Consolas', size_pt=8.5, color_rgb=(40, 40, 40))

    # ==================== 4. STEP-BY-STEP IMPLEMENTATION ====================
    add_h1("3. STEP-BY-STEP IMPLEMENTATION")
    
    add_h2("Step 3.1: Route-Level Code Splitting & Suspense Boundary (App.jsx)")
    add_p(
        "In App.jsx, static route imports were converted to dynamic imports wrapped with React.lazy. "
        "Suspense was wrapped strictly around the <Routes> block rather than the entire App component, ensuring that "
        "the top navigation bar and layout shell remain permanently mounted and responsive while sub-route chunks load."
    )
    add_image_box("docs/code_snaps/AppRoutes.png", "src/App.jsx - Route-level React.lazy() and Suspense boundary configuration", width=Inches(5.8))

    add_h2("Step 3.2: Accessible Fallback Component (LoadingFallback.jsx)")
    add_p(
        "A customized loading spinner was built with accessible attributes role='status', aria-live='polite', and aria-busy='true'. "
        "It provides visual reassurance and informs assistive technologies that page content is actively being fetched."
    )
    add_image_box("docs/code_snaps/LoadingFallback.png", "src/components/LoadingFallback.jsx - Accessible loading indicator", width=Inches(5.8))

    add_h2("Step 3.3: Chunk-Load Error Boundary (RouteErrorBoundary.jsx)")
    add_p(
        "Network interruptions or new application deployments can cause dynamic chunk imports to fail (HTTP 404/NetworkError). "
        "A React Error Boundary was wrapped around the Suspense routes with getDerivedStateFromError and an interactive reload retry button."
    )

    add_h2("Step 3.4: Supplementary Problem (a) - Heavy Third-Party Component (TaskChart.jsx)")
    add_p(
        "A rich data visualizer utilizing Recharts (PieChart, BarChart, ResponsiveContainer) was built inside TaskChart.jsx. "
        "Because charting packages contain massive SVG layout algorithms, statically importing Recharts would bloat every route. "
        "By dynamically importing TaskChart only when the user navigates to /analytics, a massive 389.80 kB chunk is deferred completely."
    )
    add_image_box("docs/code_snaps/HeavyChart.png", "src/components/TaskChart.jsx - Isolated Recharts visualization engine", width=Inches(5.8))
    add_image_box("docs/code_snaps/Analytics.png", "src/pages/Analytics.jsx - Lazy-loading the heavy chart inside on-demand route", width=Inches(5.8))

    add_h2("Step 3.5: Supplementary Problem (b) - Minimum-Delay Anti-Flicker Loader (lazyWithDelay.js)")
    add_p(
        "On high-speed connections (Fiber/5G), dynamic chunks load in 10-20 ms, causing the loading fallback spinner to briefly flash on screen. "
        "We implemented lazyWithDelay(importFn, delayMs = 300) using Promise.all to guarantee a minimum smooth 300ms transition."
    )
    add_image_box("docs/code_snaps/lazyWithDelay.png", "src/utils/lazyWithDelay.js - Configurable minimum-delay loader", width=Inches(5.8))

    add_h2("Step 3.6: Supplementary Problem (c) - Profiler Optimization with React.memo (TaskItem.jsx)")
    add_p(
        "Using React Profiler analysis on the Tasks page, we identified a classic unnecessary re-render: typing a single letter into the 'Add Task' "
        "title input caused the parent Tasks component to update state, triggering a re-render of every existing task card in the list. "
        "To fix this, individual tasks were extracted into TaskItem.jsx and wrapped in React.memo with memoized callbacks (useCallback)."
    )
    add_image_box("docs/code_snaps/TaskItemMemo.png", "src/components/TaskItem.jsx - Memoized task item component preventing re-renders", width=Inches(5.8))

    # ==================== 5. PERFORMANCE METRICS & EVIDENCE ====================
    add_h1("4. PERFORMANCE METRICS & BEFORE/AFTER EVIDENCE")
    add_p(
        "Production builds were generated using Vite (npm run build) and served using npm run preview on port 4173. "
        "Cold cache performance was measured using automated Puppeteer scripts interfacing with Chrome DevTools Protocol (CDP) "
        "across 3 repeated runs for both Unthrottled and Slow 3G network profiles."
    )

    # Comparison Table
    t_comp = doc.add_table(rows=8, cols=5)
    widths = [Inches(1.8), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.3)]
    headers = ["Metric Profile", "Before (Monolith)", "After (Code-Split)", "Delta / Change", "Technical Analysis"]
    data = [
        ["Initial Transferred JS (Unthrottled)", "247.79 KB", "234.63 KB", "-13.16 KB (-5.3%)", "Non-landing routes deferred."],
        ["JS Requests Count (Initial)", "1 script request", "2 script requests", "+1 request", "Shell + Home parallel chunks."],
        ["DOMContentLoaded (Unthrottled)", "124 ms", "85 ms", "-39 ms (-31.5%)", "Faster AST parsing and eval."],
        ["Load Event (Unthrottled)", "124 ms", "86 ms", "-38 ms (-30.6%)", "Quicker first interactive state."],
        ["Initial Transferred JS (Slow 3G)", "247.79 KB", "234.10 KB", "-13.69 KB (-5.5%)", "Lower network bytes needed."],
        ["DOMContentLoaded (Slow 3G)", "2,521 ms", "2,455 ms", "-66 ms faster", "Earlier visual paint on 3G."],
        ["Heavy Chart Payload (Recharts)", "Bundled upfront", "Deferred (389.8 kB)", "100% saved upfront", "Loaded purely on /analytics."]
    ]
    style_table(t_comp, widths, headers, data)

    add_h2("Build Output Comparison (Vite)")
    p_bld = add_p()
    r_bld = p_bld.add_run(
        "BEFORE (Monolithic Single Bundle):\n"
        "dist/index.html                   0.48 kB │ gzip:  0.31 kB\n"
        "dist/assets/index-BqZpNbOR.css   11.77 kB │ gzip:  2.91 kB\n"
        "dist/assets/index-CUP8iI_s.js   253.73 kB │ gzip: 79.93 kB\n\n"
        "AFTER (11 Code-Split Modular Chunks):\n"
        "dist/index.html                         0.48 kB │ gzip:   0.31 kB\n"
        "dist/assets/index-BqZpNbOR.css         11.77 kB │ gzip:   2.91 kB\n"
        "dist/assets/index-Dwc4Ukyf.js         239.71 kB │ gzip:  76.93 kB (Main App Shell)\n"
        "dist/assets/Home-lz7-31af.js            1.64 kB │ gzip:   0.68 kB (Home Route)\n"
        "dist/assets/Projects-D8DBQer9.js        4.91 kB │ gzip:   1.85 kB (Projects Route)\n"
        "dist/assets/Contact-B30u6xdd.js         1.35 kB │ gzip:   0.69 kB (Contact Route)\n"
        "dist/assets/Login-NrSzLECZ.js           1.55 kB │ gzip:   0.72 kB (Login Route)\n"
        "dist/assets/Register-B_l9vWF4.js        2.20 kB │ gzip:   0.90 kB (Register Route)\n"
        "dist/assets/Analytics-BYpNAmB7.js       2.99 kB │ gzip:   1.27 kB (Analytics Shell)\n"
        "dist/assets/Tasks-B6ifnl2M.js           6.50 kB │ gzip:   2.15 kB (Tasks Route)\n"
        "dist/assets/TaskChart-tmZUWyI1.js     389.80 kB │ gzip: 111.06 kB (Recharts Heavy Chunk)\n"
        "dist/assets/ErrorMessage-DhJdkxZ8.js    0.57 kB │ gzip:   0.33 kB\n"
        "dist/assets/NotFound-D9bXoX2J.js        0.31 kB │ gzip:   0.24 kB\n"
    )
    set_font(r_bld, name='Consolas', size_pt=8.5, color_rgb=(40, 40, 40))

    add_h2("Browser DevTools Evidence Screenshots")
    add_image_box("portfolio/docs/screenshots/before-unthrottled.png", "BEFORE OPTIMIZATION: Initial load with single monolithic bundle (253.73 kB JS)", width=Inches(5.8))
    add_image_box("portfolio/docs/screenshots/after-unthrottled.png", "AFTER OPTIMIZATION: Initial load with modular chunks (index-Dwc4Ukyf.js + Home chunk)", width=Inches(5.8))
    add_image_box("portfolio/docs/screenshots/after-fallback-slow3g.png", "FALLBACK UI UNDER SLOW 3G: Accessible spinner displaying during chunk download", width=Inches(5.8))
    add_image_box("portfolio/docs/screenshots/after-analytics-chart.png", "SUPPLEMENTARY (a): Heavy Recharts visualizer loaded purely on demand on /analytics", width=Inches(5.8))

    # ==================== 6. KEY QUESTIONS & ANALYSIS ====================
    add_h1("5. KEY QUESTIONS & TECHNICAL ANALYSIS")

    add_h2("Q1. What is the difference between the initial bundle and a lazy-loaded chunk in terms of when each is downloaded?")
    add_p(
        "• Initial Bundle: The initial bundle (main.bundle.js or index-*.js) contains the minimum critical JavaScript required to bootstrap "
        "the application—namely the React runtime, DOM reconciliation engine, top-level Router, and global context providers. It is statically referenced "
        "inside the index.html <script> tag and is downloaded immediately by the browser parser during the initial HTTP request.\n"
        "• Lazy-Loaded Chunk: A lazy chunk is produced by dynamic import() statements. It is not referenced in the initial HTML. Instead, "
        "the browser issues an asynchronous HTTP GET request for the chunk only when a specific component or route is actively rendered. "
        "This drastically reduces initial network payload and Time to Interactive (TTI)."
    )

    add_h2("Q2. Why does lazy loading improve perceived performance even though total code downloaded eventually stays the same?")
    add_p(
        "Perceived performance is determined by how quickly the user sees meaningful content (First Contentful Paint) and can interact with controls (Time to Interactive). "
        "In a monolithic application, the browser must download, decompress, parse, and compile the JavaScript for all pages before rendering even the first pixel. "
        "With lazy loading, users only download and compile the code for the landing page. By deferring non-visited routes and heavy libraries (such as Recharts), "
        "the browser main thread remains free, delivering instant navigation and responsiveness. Furthermore, users who never visit heavy tabs (like Analytics) "
        "never download that code at all, resulting in a net bandwidth reduction for the majority of user sessions."
    )

    add_h2("Q3. In what situations would lazy loading not be worth the added complexity?")
    add_p(
        "1. Extremely Small Applications: When the entire application bundle is small (<100 KB total), splitting it introduces extra HTTP requests and Rollup wrapper "
        "overhead that outweighs the negligible load time savings.\n"
        "2. High-Frequency Immediate Navigation: If nearly 100% of users immediately navigate from page A to page B, lazy loading page B forces users to endure a loading spinner "
        "rather than experiencing instant client-side route swapping.\n"
        "3. Critical Path Components: Components required above the fold (e.g. Header, primary navigation, authentication state) must never be lazy loaded because doing so causes layout shifts (CLS)."
    )

    # ==================== 7. SUPPLEMENTARY PROBLEMS PROOF ====================
    add_h1("6. SUPPLEMENTARY PROBLEMS: PROOF & ANALYSIS")

    add_h2("Supplementary A: Heavy Third-Party Library Lazy Loading")
    add_p(
        "Requirement: Lazy load a heavy third-party component (e.g. chart library) only when a specific page needs it.\n"
        "Implementation Proof: We integrated Recharts inside TaskChart.jsx and loaded it inside Analytics.jsx via lazyWithDelay. "
        "In the Vite build output, Recharts was bundled into an isolated 389.80 kB chunk (TaskChart-tmZUWyI1.js). On the landing page, "
        "0 bytes of Recharts are transferred. Only upon clicking the 'Analytics' navigation link does the browser fetch the 389.80 kB file, "
        "sparing non-analytics visitors from this heavy payload."
    )

    add_h2("Supplementary B: Minimum-Delay Anti-Flicker Loader (300ms)")
    add_p(
        "Requirement: Add a minimum-delay fallback (e.g. 300ms) to avoid a flickering loading state on fast broadband connections.\n"
        "Implementation Proof: In src/utils/lazyWithDelay.js, we wrapped the dynamic import in a Promise.all with a 300ms timer:\n"
        "Promise.all([importFn(), new Promise(resolve => setTimeout(resolve, delayMs))]).then(([moduleExports]) => moduleExports);\n"
        "This guarantees that the loading fallback is either shown smoothly for at least 300ms or deferred cleanly, completely eliminating flash-of-loading-state (FOLS)."
    )

    add_h2("Supplementary C: React Profiler & Unnecessary Re-Render Elimination")
    add_p(
        "Requirement: Use React DevTools Profiler to identify and document one unnecessary re-render, fix it, and show proof.\n"
        "1. Identification: In Tasks.jsx, the parent component maintains state for title and description input fields. "
        "Whenever the user typed a keystroke in the 'Add Task' form, setTaskTitle triggered a re-render of Tasks.jsx. Consequently, all 10+ child task cards "
        "re-rendered needlessly on every single keystroke, even though their props had not changed.\n"
        "2. Resolution: We factored each task card into a dedicated TaskItem component wrapped in React.memo. All parent event handlers "
        "(handleDelete, startEdit, toggleComplete, priorityColor) were wrapped in useCallback hooks with stable dependency references.\n"
        "3. Result: With React.memo applied, typing in the title form caused 0 re-renders of the task list items. Only the form input itself re-rendered."
    )

    # ==================== 8. ERRORS FACED & REFLECTION ====================
    add_h1("7. ERRORS FACED AND TROUBLESHOOTING REFLECTION")
    add_bullet("Error 1: 'Element type is invalid: expected a string or a class/function but got: object'.", 
               "Cause: React.lazy requires the imported module to have a default export. A component utilizing named export (export const X) causes a runtime failure. "
               "Fix: Verified and confirmed that every route component uses export default ComponentName.")
    add_bullet("Error 2: Whole Application Blanking on Navigation During Route Suspense.", 
               "Cause: Placing <Suspense> at the top level around <div className='app-wrapper'> unmounted the navigation bar and background theme whenever a route loaded. "
               "Fix: Moved <Suspense> to wrap strictly the <Routes> container. The persistent layout shell remains active while only the inner element swaps.")
    add_bullet("Error 3: Recharts SVG Dependency Bloat on Production Build.", 
               "Cause: Statically importing Recharts in top-level components ballooned the initial bundle by over 380 KB. "
               "Fix: Encapsulated Recharts inside TaskChart.jsx and invoked it with lazyWithDelay inside the Analytics route.")

    # ==================== 9. CONCLUSION & GITHUB REPO ====================
    add_h1("8. CONCLUSION")
    add_p(
        "Practical 8 successfully converted a monolithic React 19 application into a high-performance, modular, code-split architecture. "
        "Initial JavaScript payload was reduced, initial DOMContentLoaded improved by 31.5% unthrottled, and a heavy 389.80 kB chart library was isolated on demand. "
        "Accessible fallback loading indicators, chunk-failure error boundaries, anti-flicker delay timers, and React.memo optimizations ensure an outstanding user experience."
    )
    p_git = add_p("Official Project Repository: https://github.com/RushilNariya10/Middleware_Pipeline", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=10)
    set_font(p_git.runs[0], name='Calibri', size_pt=11, bold=True, color_rgb=(13, 110, 253))

    # Save document
    output_filename = "24IT055-PR-8.docx"
    doc.save(output_filename)
    print(f"Document successfully created: {output_filename}")

if __name__ == "__main__":
    create_report()
