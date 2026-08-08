// Meme engine: prefetch queue from meme-api, imgflip fallbacks on network
// error, inline SVG badge on total failure. NEVER throws — the game always
// continues even if every API is down.

const MEME_API = 'https://meme-api.com/gimme/5';
const FALLBACK_URLS = [
  'https://i.imgflip.com/30b1gx.jpg', // "Is this a pigeon?"
  'https://i.imgflip.com/1bgw.jpg', // Drake
];
const QUEUE_MIN = 5;
const SHOW_MS = 3000;

let queue = [];
let hideToken = 0;

async function fetchMemeUrls() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(MEME_API, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.memes || (data.url ? [data] : []);
    const urls = list.map((m) => (typeof m === 'string' ? m : m && m.url)).filter(Boolean);
    return urls.length ? urls : null;
  } catch {
    return null; // network error -> fallback URLs queued by the caller
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function prefetchMemes() {
  try {
    const urls = await fetchMemeUrls();
    if (urls) {
      queue.push(...urls);
    } else {
      queue.push(...FALLBACK_URLS); // any network error -> imgflip fallback
    }
    queue = queue.slice(0, QUEUE_MIN * 2);
  } catch {
    /* total failure — inline SVG badge still works */
  }
}

export function getMemeUrl() {
  const url = queue.shift() || null;
  if (queue.length < QUEUE_MIN) prefetchMemes(); // top up in background
  return url;
}

// ---- offline badges (only used when there is no image at all) ----

const BRAIN_GLYPH =
  '<svg viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">' +
  '<path fill="#fff" stroke="#000" stroke-width="3" d="M12 30c0-8 6-14 14-14h12c8 0 14 6 14 14 0 4-2 8-5 10 3 2 5 6 5 10 0 7-6 12-13 12h-2v-8h-4v8h-2c-7 0-13-5-13-12 0-4 2-8 5-10-3-2-5-6-5-10z"/>' +
  '<path fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" d="M32 16v6m-8-2c-4 1-7 4-8 8m24-8c4 1 7 4 8 8M14 26c-2 2-3 5-3 8m42-8c2 2 3 5 3 8"/>' +
  '</svg>';

const RATIO_GLYPH =
  '<svg viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">' +
  '<rect x="8" y="22" width="13" height="28" fill="#fff" stroke="#000" stroke-width="3"/>' +
  '<rect x="26" y="12" width="13" height="38" fill="#fff" stroke="#000" stroke-width="3"/>' +
  '<rect x="44" y="30" width="13" height="20" fill="#fff" stroke="#000" stroke-width="3"/>' +
  '</svg>';

function makeBadge(kind) {
  const glyph = kind === 'win' ? BRAIN_GLYPH : RATIO_GLYPH;
  const text = kind === 'win' ? 'BIG BRAIN' : 'L + RATIO';
  return '<div class="meme-badge">' + glyph + '<p class="badge-text">' + text + '</p></div>';
}

// Show a meme overlay for 3s with a scale-in pop. `container` is the overlay
// element; `kind` is 'win' (BIG BRAIN!) or 'fail' (L + RATIO!).
export function showMeme(container, kind) {
  if (!container) return;
  const url = getMemeUrl();
  const caption = kind === 'win' ? 'BIG BRAIN!' : 'L + RATIO!';
  const token = ++hideToken;
  container.innerHTML =
    '<div class="meme-box" role="img" aria-label="' +
    caption +
    '">' +
    '<p class="meme-caption">' +
    caption +
    '</p>' +
    (url
      ? '<img class="meme-img" src="' +
        url +
        '" alt="' +
        caption +
        '" loading="lazy" decoding="async">'
      : makeBadge(kind)) +
    '</div>';
  container.classList.remove('hidden');
  container.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    if (token !== hideToken) return; // a newer meme took over
    container.classList.add('hidden');
    container.setAttribute('aria-hidden', 'true');
    container.innerHTML = '';
  }, SHOW_MS);
}
