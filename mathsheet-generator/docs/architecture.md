# Technical Architecture

## Overview

MathSheet Generator is a client-side web application that generates math worksheets deterministically from a local SQLite database. The architecture prioritizes offline capability, fast worksheet generation, and print-quality output.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Dashboard   │  │  Generator  │  │   Preview   │            │
│  │  (React)     │  │  (React)    │  │   (KaTeX)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                      Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Worksheet   │  │  Question   │  │   Export    │            │
│  │  Engine      │  │  Filter     │  │   Engine    │            │
│  │  (TypeScript)│  │  (TypeScript)│  │  (PDF/Print)│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                       Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   SQLite     │  │   JSON      │  │  Local      │            │
│  │   Database   │  │   Question  │  │  Storage    │            │
│  │   (better-   │  │   Bank      │  │  (Settings) │            │
│  │    sqlite3)  │  │   (Import)  │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Question Database (SQLite)

**Purpose**: Store and query 25 years of exam questions efficiently.

**Schema**:
```sql
-- Main questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  board TEXT NOT NULL,           -- 'CBSE', 'ICSE', 'MAHARASHTRA', etc.
  year INTEGER NOT NULL,        -- 2000-2025
  paper_type TEXT NOT NULL,     -- 'board', 'sample', 'practice'
  chapter TEXT NOT NULL,        -- 'Algebra', 'Geometry', etc.
  topic TEXT NOT NULL,          -- 'Polynomials', 'Triangles', etc.
  subtopic TEXT,                -- 'Finding Zeroes', 'Pythagoras', etc.
  difficulty TEXT NOT NULL,     -- 'easy', 'medium', 'hard'
  marks INTEGER NOT NULL,       -- 1-6
  estimated_minutes REAL NOT NULL,
  question_latex TEXT NOT NULL,
  question_html TEXT NOT NULL,  -- Pre-rendered HTML for search
  solution_json TEXT,           -- JSON with steps and answer
  tags TEXT,                    -- Comma-separated tags
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast filtering
CREATE INDEX idx_questions_board ON questions(board);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_chapter ON questions(chapter);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_board_year ON questions(board, year);
CREATE INDEX idx_questions_chapter_difficulty ON questions(chapter, difficulty);

-- Full-text search
CREATE VIRTUAL TABLE questions_fts USING fts5(
  question_html,
  content='questions',
  content_rowid='rowid'
);
```

**Why SQLite**:
- Zero configuration — file-based, no server
- Full-text search via FTS5 for keyword queries
- Fast indexed queries for filtering
- Portable — single file, easy backup
- Works offline by design

### 2. Worksheet Generation Engine

**Purpose**: Deterministic question selection and sequencing.

**Algorithm**:
```
1. PARSE config (board, topics, difficulty, count, seed)
2. FILTER questions by config criteria
3. VALIDATE sufficient questions available
4. SAMPLE questions using weighted random selection
   - Weight by: recency (newer = higher weight), difficulty balance
   - Seed ensures reproducibility
5. DEDUPLICATE (no repeats within worksheet)
6. SEQUENCE questions:
   - Group by section (Algebra, Geometry, etc.)
   - Within section: easy → medium → hard
   - Interleave sections for exam-style variety
7. CALCULATE metadata:
   - Total marks, estimated time, difficulty distribution
8. RETURN worksheet data structure
```

**Key Design Decision**: Deterministic generation means the same config + seed = same worksheet. This enables:
- Teachers reusing worksheets across classes
- Students practicing the same set multiple times
- Debugging and testing generation logic

### 3. Rendering Pipeline

**Purpose**: Transform question data into print-quality output.

**Pipeline**:
```
Question Data → KaTeX Rendering → Layout Engine → Output
                  (LaTeX → HTML)   (Pagination)    (Preview/PDF)
```

**KaTeX Integration**:
- Client-side rendering for offline capability
- Pre-rendered HTML in database for search
- Dynamic rendering for preview and export
- Custom macros for common Indian math notation

**Layout Engine**:
- A4/Letter paper dimensions
- Configurable margins, spacing, font sizes
- Automatic page breaks at section boundaries
- Header/footer with school branding
- Answer key on separate pages

### 4. Export Engine

**Purpose**: Generate downloadable/printable worksheets.

**Export Formats**:
1. **Browser Print** — Direct print via CSS `@media print`
2. **PDF** — Puppeteer-based PDF generation (server) or jsPDF (client)
3. **HTML** — Standalone HTML file for sharing
4. **PNG/SVG** — Image export for embedding

**PDF Generation Strategy**:
- **Development**: Puppeteer (full Chrome, pixel-perfect)
- **Production**: React-PDF (lightweight, no browser dependency)
- **Offline**: Client-side jsPDF fallback

## Data Flow

### Worksheet Generation Flow

```
User Config
    ↓
[Filter Questions] ← SQLite Query
    ↓
[Select Questions] ← Weighted Random + Seed
    ↓
[Sequence Sections] ← Algorithm
    ↓
[Render Math] ← KaTeX
    ↓
[Layout Pages] ← CSS Print Styles
    ↓
[Preview/Export] ← React Component / PDF Engine
```

### Data Ingestion Flow

```
Raw Question Data (JSON/CSV)
    ↓
[Parse & Validate] ← Schema Validation
    ↓
[Normalize] ← Standardize format, extract LaTeX
    ↓
[Generate HTML] ← KaTeX pre-render
    ↓
[Insert SQLite] ← Batch insert with transactions
    ↓
[Build Indexes] ← FTS5 + B-tree indexes
```

## Offline Architecture

### Service Worker Strategy

```typescript
// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Cache Strategy
const CACHE_NAME = 'mathsheet-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/generate',
  '/_next/static/**/*.js',
  '/fonts/**/*.woff2',
];

// Cache-first for static assets
// Network-first for API calls (with fallback to cache)
// Stale-while-revalidate for question data
```

### IndexedDB Fallback

For browsers with limited SQLite support:
```typescript
// IndexedDB schema (fallback)
const db = await openDB('mathsheet', 1, {
  upgrade(db) {
    const store = db.createObjectStore('questions', { keyPath: 'id' });
    store.createIndex('board', 'board');
    store.createIndex('chapter', 'chapter');
    store.createIndex('difficulty', 'difficulty');
  }
});
```

## Performance Considerations

### Database Optimization
- **WAL mode** for concurrent reads
- **Covering indexes** for common filter combinations
- **Pre-computed aggregates** for dashboard statistics
- **Lazy loading** of solution data (only when needed)

### Rendering Optimization
- **Virtual scrolling** for large question banks
- **Memoized KaTeX rendering** (cache rendered HTML)
- **Progressive rendering** (show preview before full render)
- **Web Workers** for heavy computation (PDF generation)

### Bundle Optimization
- **Dynamic imports** for PDF engine
- **Tree shaking** for KaTeX (only include needed commands)
- **Code splitting** by route

## Security Model

### Data Privacy
- All data stored locally (no cloud sync by default)
- No user accounts required for core functionality
- Optional local-only performance tracking

### Input Validation
- Question LaTeX validated before rendering
- Config parameters type-checked
- SQL parameterized queries (no injection)

### Export Safety
- PDF generation sandboxed (no arbitrary code execution)
- Sanitized HTML output (no XSS via question content)

## Testing Strategy

### Unit Tests
- Question filtering logic
- Worksheet generation algorithm
- KaTeX rendering utilities

### Integration Tests
- Database queries and mutations
- End-to-end worksheet generation
- PDF export validation

### Visual Tests
- KaTeX rendering comparison
- Print layout consistency
- Responsive design breakpoints

## Deployment Architectures

### 1. Static Export (Recommended for Schools)
```
npm run export → out/
    ↓
Copy to USB / Local Network / School Server
    ↓
Students access via any browser (fully offline)
```

### 2. Vercel / Netlify (Recommended for Cloud)
```
Git Push → CI/CD Build → Deploy
    ↓
Students access via URL (online required)
```

### 3. Docker (Self-Hosted)
```
Docker Build → Container Image
    ↓
Deploy to school server / cloud VM
    ↓
Students access via school network
```

## Future Considerations

### Scalability
- If question bank grows beyond 100K questions, consider:
  - Turso (distributed SQLite)
  - Postgres with pgvector for similarity search
  - Elasticsearch for advanced full-text search

### Multi-Tenancy
- School-level isolation
- Custom question banks per institution
- Admin dashboard for question curation

### API Expansion
- REST API for third-party integrations
- LMS integration (Moodle, Google Classroom)
- Mobile app via React Native

---

*Last updated: September 2024*