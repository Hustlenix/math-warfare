# Question Bank JSON Schema

This document defines the structure for questions in the MathSheet Generator question bank.

## Question Object

```json
{
  "id": "string (required)",
  "board": "string (required)",
  "year": "number (required)",
  "paperType": "string (required)",
  "chapter": "string (required)",
  "topic": "string (required)",
  "subtopic": "string (optional)",
  "difficulty": "string (required)",
  "marks": "number (required)",
  "estimatedMinutes": "number (required)",
  "questionLatex": "string (required)",
  "questionHtml": "string (optional - auto-generated if not provided)",
  "solution": "SolutionObject (required)",
  "tags": "string[] (optional)",
  "source": "string (optional - reference to original paper)",
  "createdAt": "string (ISO 8601 - auto-generated)",
  "updatedAt": "string (ISO 8601 - auto-generated)"
}
```

## Field Definitions

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"cbse-2023-alg-015"` |
| `board` | string | Exam board | `"CBSE"`, `"ICSE"`, `"MAHARASHTRA"` |
| `year` | number | Exam year (2000-2025) | `2023` |
| `paperType` | string | Type of exam paper | `"board"`, `"sample"`, `"practice"` |
| `chapter` | string | Textbook chapter name | `"Algebra"`, `"Geometry"` |
| `topic` | string | Specific topic within chapter | `"Polynomials"`, `"Triangles"` |
| `difficulty` | string | Difficulty level | `"easy"`, `"medium"`, `"hard"` |
| `marks` | number | Marks awarded (1-6) | `2` |
| `estimatedMinutes` | number | Estimated solve time | `3` |
| `questionLatex` | string | Question in LaTeX format | `"Find the zeroes of $p(x) = x^2 - 5x + 6$."` |
| `solution` | object | Solution with steps | See Solution Object below |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `subtopic` | string | More specific topic | `"Finding Zeroes"`, `"Pythagoras Theorem"` |
| `questionHtml` | string | Pre-rendered HTML (auto-generated if omitted) | `"<p>Find the zeroes of...</p>"` |
| `tags` | array | Searchable tags | `["quadratic", "factorisation", "board-2023"]` |
| `source` | string | Original paper reference | `"CBSE 2023 Board Exam, Set 1"` |
| `createdAt` | string | ISO 8601 timestamp | `"2024-09-01T10:00:00Z"` |
| `updatedAt` | string | ISO 8601 timestamp | `"2024-09-01T10:00:00Z"` |

## Solution Object

```json
{
  "steps": "string[] (required)",
  "answerLatex": "string (required)",
  "answerText": "string (optional)",
  "explanation": "string (optional)",
  "commonMistakes": "string[] (optional)",
  "relatedTopics": "string[] (optional)"
}
```

### Solution Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `steps` | array | Step-by-step solution in LaTeX | `["Factorise: $x^2 - 5x + 6 = (x-2)(x-3)$"]` |
| `answerLatex` | string | Final answer in LaTeX | `"x = 2,\\; x = 3"` |
| `answerText` | string | Plain text answer (for accessibility) | `"x = 2 and x = 3"` |
| `explanation` | string | Detailed explanation | `"We factor the quadratic..."` |
| `commonMistakes` | array | Common errors to avoid | `["Forgetting to check both factors"]` |
| `relatedTopics` | array | Related topics for further practice | `["quadratic-formula", "graphing"]` |

## Example Questions by Chapter

### Algebra - Polynomials

```json
{
  "id": "cbse-2023-alg-001",
  "board": "CBSE",
  "year": 2023,
  "paperType": "board",
  "chapter": "Algebra",
  "topic": "Polynomials",
  "subtopic": "Finding Zeroes",
  "difficulty": "easy",
  "marks": 1,
  "estimatedMinutes": 2,
  "questionLatex": "Find the zero of the polynomial $p(x) = 2x - 4$.",
  "solution": {
    "steps": [
      "Set $p(x) = 0$",
      "$2x - 4 = 0$",
      "$2x = 4$",
      "$x = 2$"
    ],
    "answerLatex": "x = 2",
    "commonMistakes": [
      "Dividing by 2 incorrectly"
    ]
  },
  "tags": ["linear", "zero", "basic"],
  "source": "CBSE 2023 Sample Paper"
}
```

### Geometry - Triangles

```json
{
  "id": "cbse-2022-geo-012",
  "board": "CBSE",
  "year": 2022,
  "paperType": "board",
  "chapter": "Geometry",
  "topic": "Triangles",
  "subtopic": "Similarity",
  "difficulty": "medium",
  "marks": 3,
  "estimatedMinutes": 5,
  "questionLatex": "In $\\triangle ABC$, $D$ and $E$ are points on sides $AB$ and $AC$ respectively such that $DE \\parallel BC$. If $AD = 3$ cm, $DB = 2$ cm, and $DE = 4$ cm, find $BC$.",
  "solution": {
    "steps": [
      "Since $DE \\parallel BC$, $\\triangle ADE \\sim \\triangle ABC$ (AA similarity)",
      "Therefore, $\\frac{AD}{AB} = \\frac{DE}{BC}$",
      "$AB = AD + DB = 3 + 2 = 5$ cm",
      "$\\frac{3}{5} = \\frac{4}{BC}$",
      "$BC = \\frac{4 \\times 5}{3} = \\frac{20}{3}$ cm"
    ],
    "answerLatex": "BC = \\frac{20}{3} \\text{ cm} \\approx 6.67 \\text{ cm}",
    "commonMistakes": [
      "Using AD/DB instead of AD/AB",
      "Forgetting to add AD and DB to get AB"
    ]
  },
  "tags": ["similarity", "parallel-lines", "proportion"],
  "source": "CBSE 2022 Board Exam, Set 2"
}
```

### Trigonometry

```json
{
  "id": "icse-2021-trig-008",
  "board": "ICSE",
  "year": 2021,
  "paperType": "board",
  "chapter": "Trigonometry",
  "topic": "Ratios",
  "subtopic": "Basic Identities",
  "difficulty": "medium",
  "marks": 2,
  "estimatedMinutes": 3,
  "questionLatex": "If $\\sin \\theta = \\frac{3}{5}$, find the value of $\\cos \\theta$ and $\\tan \\theta$, where $\\theta$ is an acute angle.",
  "solution": {
    "steps": [
      "Using $\\sin^2 \\theta + \\cos^2 \\theta = 1$",
      "$\\cos^2 \\theta = 1 - \\sin^2 \\theta = 1 - \\frac{9}{25} = \\frac{16}{25}$",
      "$\\cos \\theta = \\frac{4}{5}$ (positive since $\\theta$ is acute)",
      "$\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta} = \\frac{3/5}{4/5} = \\frac{3}{4}$"
    ],
    "answerLatex": "\\cos \\theta = \\frac{4}{5}, \\tan \\theta = \\frac{3}{4}",
    "commonMistakes": [
      "Taking negative value for cos when theta is acute",
      "Inverting sin/cos for tan"
    ]
  },
  "tags": ["identities", "acute-angle", "pythagorean"],
  "source": "ICSE 2021 Board Exam"
}
```

### Statistics & Probability

```json
{
  "id": "cbse-2024-stat-005",
  "board": "CBSE",
  "year": 2024,
  "paperType": "board",
  "chapter": "Statistics",
  "topic": "Mean",
  "subtopic": "Grouped Data",
  "difficulty": "hard",
  "marks": 4,
  "estimatedMinutes": 8,
  "questionLatex": "The following distribution shows the daily pocket allowance of children in a locality:\\n\\n| Daily pocket allowance (in ₹) | 10-20 | 20-30 | 30-40 | 40-50 | 50-60 |\\n|-------------------------------|-------|-------|-------|-------|-------|\\n| Number of children | 5 | 8 | 12 | 10 | 5 |\\n\\nFind the mean pocket allowance using the step deviation method.",
  "solution": {
    "steps": [
      "Take assumed mean $a = 35$ (midpoint of 30-40)",
      "Class width $h = 10$",
      "Calculate $u_i = \\frac{x_i - a}{h}$ for each class",
      "| Class | $x_i$ | $f_i$ | $u_i$ | $f_i u_i$ |",
      "|-------|-------|-------|-------|----------|",
      "| 10-20 | 15 | 5 | -2 | -10 |",
      "| 20-30 | 25 | 8 | -1 | -8 |",
      "| 30-40 | 35 | 12 | 0 | 0 |",
      "| 40-50 | 45 | 10 | 1 | 10 |",
      "| 50-60 | 55 | 5 | 2 | 10 |",
      "$\\sum f_i = 40$, $\\sum f_i u_i = 2$",
      "Mean $= a + \\frac{\\sum f_i u_i}{\\sum f_i} \\times h = 35 + \\frac{2}{40} \\times 10 = 35.5$"
    ],
    "answerLatex": "Mean = ₹35.50",
    "commonMistakes": [
      "Using wrong midpoint",
      "Sign error in u_i calculation",
      "Forgetting to multiply by h at the end"
    ]
  },
  "tags": ["step-deviation", "grouped-data", "mean", "frequency-table"],
  "source": "CBSE 2024 Board Exam, Set 1"
}
```

## Board-Specific Conventions

### CBSE
- Chapters follow NCERT textbook structure
- Marks distribution: 1-mark (MCQ), 2-mark (short), 3-mark (long), 4-6 mark (very long)
- LaTeX notation uses standard Indian conventions (e.g., ₹ for rupees)

### ICSE
- May include more application-based questions
- Often includes graph-based questions (tag with `"graph-required"`)
- Some topics not in CBSE (e.g., different geometry emphasis)

### State Boards
- Follow respective state textbook structure
- Regional language questions may need translation
- Some boards use different notation conventions

## ID Naming Convention

```
{board}-{year}-{chapter-abbreviation}-{sequence-number}
```

Examples:
- `cbse-2023-alg-001` → CBSE 2023, Algebra, question 1
- `icse-2021-trig-015` → ICSE 2021, Trigonometry, question 15
- `mah-2022-geo-008` → Maharashtra 2022, Geometry, question 8

## Validation Rules

1. **ID uniqueness**: No duplicate IDs in the database
2. **Year range**: Must be between 2000 and 2025
3. **Marks**: Must be between 1 and 6
4. **Difficulty**: Must be one of `easy`, `medium`, `hard`
5. **LaTeX validity**: All LaTeX must render without errors
6. **Solution completeness**: Every question must have at least one solution step

## Import Script Usage

```bash
# Import single file
npx tsx scripts/import-questions.ts --file data/questions/cbse-2023.json

# Import directory
npx tsx scripts/import-questions.ts --dir data/questions/

# Validate without importing
npx tsx scripts/import-questions.ts --dir data/questions/ --validate-only

# Import with duplicate handling
npx tsx scripts/import-questions.ts --dir data/questions/ --on-duplicate=skip
```

## Adding New Questions

1. Create a JSON file following the schema above
2. Place in `data/questions/` with appropriate naming
3. Run import script: `npm run db:import`
4. Verify with: `npm run db:validate`

---

*Schema version: 1.0.0*