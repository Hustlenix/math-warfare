# MathSheet Generator

**Practice worksheets from 25 years of Indian Class 10 board papers — no AI, no internet required.**

---

## What it does

MathSheet Generator creates practice worksheets for Class 10 Mathematics drawn from a question bank compiled from real CBSE, ICSE, and state board exam papers spanning 25 years (2000–2025). A deterministic engine — no AI or LLM at runtime — selects, sequences, and renders questions as print-ready worksheets. Teachers pick a topic, difficulty, and question count; the tool produces a formatted worksheet with optional step-by-step solutions in seconds. After initial data ingestion, the entire system works offline on any modern browser.

---

## Key Features

### The Question Bank
- **25 years of real exam questions** from CBSE, ICSE, Maharashtra, Tamil Nadu, Karnataka, and other state boards
- Every question tagged by board, year, chapter, topic, difficulty, marks, and estimated solve time
- Questions from board papers, sample papers, and standard reference books (RD Sharma, RS Aggarwal)
- Structured JSON format — easy to extend, audit, and version-control

### Worksheet Generation
- **Deterministic engine** — same config always produces the same worksheet (reproducible for practice sessions)
- Filter by board, chapter, topic, difficulty, year range, or marks
- Choose question count, time limit, and format (standard, exam-style, or practice)
- Automatic sequencing: easy → medium → hard within each section
- No duplicate questions within a single worksheet
- Configurable sections (Algebra, Geometry, Trigonometry, Statistics, etc.)

### Rendering & Output
- **KaTeX** for crisp, publication-quality mathematical notation
- SVG/Canvas rendering for pixel-perfect PDF export
- Print-optimized layouts — A4/Letter paper, proper margins, page breaks
- Optional answer key and step-by-step solution sheets
- Custom branding: add school name, logo, and watermark

### Offline-First
- After initial setup and data import, **zero internet dependency**
- SQLite database for fast local queries
- Progressive Web App (PWA) — installable on any device
- Service worker for full offline functionality

### Teacher Dashboard
- Visual overview of question bank coverage by chapter and difficulty
- One-click worksheet generation with live preview
- Bulk generation — create a week's worth of worksheets at once
- Search and filter questions before including them
- Export history — revisit and regenerate past worksheets

### Student Features (optional)
- Self-practice mode with instant feedback
- Performance tracking stored locally (no cloud, no accounts required)
- Weakness identification by topic and difficulty
- Timed practice sessions with countdown

---

## Screenshots

<!-- Replace these with actual screenshots once the UI is built -->

| Dashboard | Worksheet Preview | Solution Sheet |
|-----------|-------------------|----------------|
| ![Dashboard placeholder](docs/screenshots/dashboard.png) | ![Worksheet placeholder](docs/screenshots/worksheet.png) | ![Solution placeholder](docs/screenshots/solutions.png) |
| Topic selection and generation controls | KaTeX-rendered mathematical content | Step-by-step worked solutions |

> **Note:** Screenshots are placeholders. Replace paths with actual images once the interface is implemented.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14** (App Router) | Server-side rendering, API routes, static export |
| UI | **React 18** + **TypeScript** | Type safety, component architecture |
| Styling | **Tailwind CSS** | Utility-first, print-friendly, responsive |
| Math Rendering | **KaTeX** | Fast, lightweight, offline-capable LaTeX rendering |
| Database | **SQLite** (via `better-sqlite3`) | Zero-config, file-based, offline-first |
| PDF Export | **React-PDF** / **Puppeteer** | High-fidelity PDF generation |
| State | Local storage + React context | No backend dependency for user preferences |

---

## Project Structure

```
mathsheet-generator/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing / dashboard
│   │   ├── generate/           # Worksheet generation flow
│   │   ├── preview/            # Live worksheet preview
│   │   ├── bank/               # Question bank browser
│   │   └── api/                # API routes (generation, export)
│   ├── components/
│   │   ├── ui/                 # Shared UI primitives
│   │   ├── math/               # KaTeX rendering components
│   │   ├── worksheet/          # Worksheet layout & sections
│   │   └── dashboard/          # Dashboard widgets
│   ├── lib/
│   │   ├── db/                 # SQLite schema, queries, migrations
│   │   ├── generator/          # Core worksheet generation engine
│   │   ├── filters/            # Question filtering & selection logic
│   │   └── export/             # PDF, print, and share utilities
│   ├── types/                  # TypeScript type definitions
│   └── data/                   # Seed data, question bank JSON
├── data/
│   ├── questions/              # Raw question JSON by board/year
│   ├── migrations/             # Database migration scripts
│   └── seeds/                  # Sample data for development
├── docs/
│   ├── screenshots/            # UI screenshots
│   ├── architecture.md         # Technical architecture
│   └── question-format.md      # Question bank JSON schema
├── public/
│   └── fonts/                  # KaTeX fonts, custom typefaces
├── tests/                      # Unit and integration tests
└── scripts/
    └── import-questions.ts     # Data ingestion CLI
```

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and npm/yarn/pnpm
- A modern browser (Chrome, Firefox, Safari, Edge)

### Install

```bash
git clone https://github.com/your-org/mathsheet-generator.git
cd mathsheet-generator
npm install
```

### Import Question Data

```bash
# Import from the bundled sample dataset
npm run db:seed

# Or import from raw question JSON files
npx tsx scripts/import-questions.ts --source data/questions/
```

### Run

```bash
npm run dev
# → http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run start
```

### Export as Static Site (offline deployment)

```bash
npm run build          # outputs to .next/
# or
npm run export         # outputs to out/ for static hosting
```

---

## Question Bank Schema

Every question in the bank follows this structure:

```json
{
  "id": "cbse-2023-alg-015",
  "board": "CBSE",
  "year": 2023,
  "paperType": "board",
  "chapter": "Algebra",
  "topic": "Polynomials",
  "subtopic": "Finding Zeroes",
  "difficulty": "medium",
  "marks": 2,
  "estimatedMinutes": 3,
  "questionLatex": "Find the zeroes of $p(x) = x^2 - 5x + 6$.",
  "solution": {
    "steps": [
      "Factorise: $x^2 - 5x + 6 = (x-2)(x-3)$",
      "Set each factor to zero: $x - 2 = 0$ or $x - 3 = 0$",
      "Zeroes are $x = 2$ and $x = 3$"
    ],
    "answerLatex": "x = 2,\\; x = 3"
  },
  "tags": ["quadratic", "factorisation", "board-2023"]
}
```

Full schema documentation: [`docs/question-format.md`](docs/question-format.md)

---

## Generation Engine — How It Works

1. **Filter** — Query SQLite with user-selected board, topics, difficulty, year range.
2. **Select** — Algorithm picks questions using weighted random sampling (weighted by recency and difficulty balance).
3. **Deduplicate** — Ensures no repeated questions within one worksheet.
4. **Sequence** — Arranges questions in exam-appropriate order (section-wise, difficulty gradient).
5. **Render** — KaTeX processes LaTeX expressions; layout engine paginates for A4/Letter.
6. **Export** — Output as on-screen preview, printable HTML, or PDF.

The entire pipeline is deterministic: given the same config and a fixed random seed, the engine produces the identical worksheet every time.

---

## Configuration

### Worksheet Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `board` | string | `"CBSE"` | Exam board to source questions from |
| `topics` | string[] | `["all"]` | Chapters/topics to include |
| `difficulty` | string | `"mixed"` | `"easy"`, `"medium"`, `"hard"`, or `"mixed"` |
| `questionCount` | number | `20` | Total questions in the worksheet |
| `timeLimit` | number | `60` | Suggested time in minutes |
| `format` | string | `"exam"` | `"exam"`, `"practice"`, or `"standard"` |
| `includeSolutions` | boolean | `true` | Append solution sheet |
| `sections` | object | auto | Manual section breakdown |
| `seed` | number | random | For reproducible generation |

---

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Docker
```bash
docker build -t mathsheet .
docker run -p 3000:3000 -v ./data:/app/data mathsheet
```

### Static / USB Drive
```bash
npm run export
# Copy out/ to any web server, USB drive, or local folder
# Works fully offline — just open index.html
```

---

## Roadmap

| Phase | Milestone | Status |
|-------|-----------|--------|
| **1** | Question bank schema, data import, SQLite setup | 🔲 Planned |
| **2** | Worksheet generation engine (filter → select → sequence) | 🔲 Planned |
| **3** | KaTeX rendering + print-optimized layout | 🔲 Planned |
| **4** | Teacher dashboard UI | 🔲 Planned |
| **5** | PDF export + solution generation | 🔲 Planned |
| **6** | Offline PWA + service worker | 🔲 Planned |
| **7** | Student practice mode + performance tracking | 🔲 Planned |
| **8** | Full question bank import (25 years × all boards) | 🔲 Planned |

---

## Contributing

Contributions welcome — especially question bank data from additional boards or years.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes
4. Open a pull request

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on adding questions to the bank.

---

## Data Sources & Attribution

Questions are sourced from publicly available past exam papers:
- CBSE Class 10 Mathematics Board Papers (2000–2025)
- ICSE Class 10 Mathematics Board Papers (2000–2025)
- State board papers (Maharashtra, Tamil Nadu, Karnataka, Andhra Pradesh, Kerala, and others)
- CBSE Sample Papers and NCERT Exemplar Problems

All questions are reformatted and stored as structured data. Original exam boards retain copyright of their respective papers.

---

## License

MIT License. See [`LICENSE`](LICENSE) for details.

---

## Contact

For questions, feature requests, or to contribute question data:

- **Issues**: [GitHub Issues](https://github.com/your-org/mathsheet-generator/issues)
- **Email**: [your-email@example.com](mailto:your-email@example.com)

---

*Built for teachers who'd rather spend time teaching than formatting worksheets.*
