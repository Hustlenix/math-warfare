/**
 * Seed script — runs via `npx tsx scripts/seed.ts`
 * Loads all seed questions into the SQLite database.
 */
import initSqlJs from 'sql.js';
import { SEED_QUESTIONS } from '../src/lib/seed/questions';

const DB_PATH = './data/mathsheet.db';
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🧮 MathSheet Generator — Seed Script');
  console.log('=====================================\n');

  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('📂 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('🆕 Created new database');
  }

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      board TEXT NOT NULL,
      year INTEGER NOT NULL,
      paperType TEXT NOT NULL,
      chapter TEXT NOT NULL,
      topic TEXT NOT NULL,
      subtopic TEXT,
      difficulty TEXT NOT NULL,
      marks INTEGER NOT NULL,
      estimatedMinutes REAL NOT NULL,
      questionLatex TEXT NOT NULL,
      questionHtml TEXT,
      solutionJson TEXT NOT NULL,
      tags TEXT,
      source TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_q_board ON questions(board);
    CREATE INDEX IF NOT EXISTS idx_q_year ON questions(year);
    CREATE INDEX IF NOT EXISTS idx_q_chapter ON questions(chapter);
    CREATE INDEX IF NOT EXISTS idx_q_topic ON questions(topic);
    CREATE INDEX IF NOT EXISTS idx_q_difficulty ON questions(difficulty);
    CREATE INDEX IF NOT EXISTS idx_q_marks ON questions(marks);
  `);

  // Insert questions
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO questions
      (id, board, year, paperType, chapter, topic, subtopic,
       difficulty, marks, estimatedMinutes, questionLatex, questionHtml,
       solutionJson, tags, source, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  db.run('BEGIN');

  for (const q of SEED_QUESTIONS) {
    stmt.run([
      q.id, q.board, q.year, q.paperType, q.chapter, q.topic,
      q.subtopic ?? null, q.difficulty, q.marks, q.estimatedMinutes,
      q.questionLatex, q.questionHtml ?? null, JSON.stringify(q.solution),
      q.tags?.join(',') ?? null, q.source ?? null,
      q.createdAt ?? new Date().toISOString(),
      q.updatedAt ?? new Date().toISOString(),
    ]);
    inserted++;
  }

  db.run('COMMIT');
  stmt.free();

  // Save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  // Report
  const count = db.exec('SELECT COUNT(*) FROM questions')[0].values[0][0];
  const chapters = db.exec('SELECT DISTINCT chapter FROM questions ORDER BY chapter')[0].values.map((r) => r[0]);
  const difficulties = db.exec('SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty')[0].values;

  console.log(`\n✅ Inserted ${inserted} seed questions`);
  console.log(`📊 Total in DB: ${count}`);
  console.log(`\n📚 Chapters (${chapters.length}):`);
  chapters.forEach((ch) => console.log(`   • ${ch}`));
  console.log(`\n📈 Difficulty breakdown:`);
  difficulties.forEach(([d, c]) => console.log(`   ${d}: ${c}`));
  console.log(`\n💾 Database saved to ${DB_PATH}`);
}

main().catch(console.error);
