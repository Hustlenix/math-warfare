export function parseAnswer(raw) {
  const value = raw.trim().replace('−', '-');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function createSession(settings) {
  return { ...settings, records: [], points: 0, streak: 0, bestStreak: 0, remaining: settings.format === 'sprint' ? 60 : 0 };
}
export function recordAnswer(session, question, input, seconds, reason = 'answer') {
  const correct = input !== null && Math.abs(input - question.answer) < 0.000001;
  session.streak = correct ? session.streak + 1 : 0;
  session.bestStreak = Math.max(session.bestStreak, session.streak);
  const points = correct ? 10 * Math.min(5, 1 + Math.floor(session.streak / 3)) * (question.boss ? 3 : 1) : 0;
  session.points += points;
  const record = { question, input, seconds: Math.max(0, seconds), correct, reason, points };
  session.records.push(record);
  return record;
}
export function summarize(session) {
  const attempted = session.records.length;
  const correct = session.records.filter(r => r.correct).length;
  const answered = session.records.filter(r => r.reason === 'answer');
  return { attempted, correct, accuracy: attempted ? Math.round(correct / attempted * 100) : 0, average: answered.length ? answered.reduce((sum, r) => sum + r.seconds, 0) / answered.length : null };
}
