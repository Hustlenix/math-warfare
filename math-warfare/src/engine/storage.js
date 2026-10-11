let fallback = {};
export function read(key, otherwise) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : (fallback[key] ?? otherwise); }
  catch { return fallback[key] ?? otherwise; }
}
export function write(key, value) {
  fallback[key] = value;
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function recentRuns() {
  const value = read('warfare_arcade_runs', []);
  return Array.isArray(value) ? value.filter(r => r && typeof r.name === 'string' && Number.isFinite(r.points) && typeof r.signature === 'string') : [];
}
export function saveRun(run) { return write('warfare_arcade_runs', [run, ...recentRuns()].slice(0, 100)); }
export function addXp(name, earned) {
  const stored = read('warfare_xp', {});
  const totals = Object.assign(Object.create(null), stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {});
  totals[name] = (Number.isFinite(totals[name]) ? totals[name] : 0) + earned;
  write('warfare_xp', totals);
  return totals[name];
}
