import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:3000';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', m => m.type() === 'error' && errors.push(`CONSOLE: ${m.text()}`));
page.on('pageerror', e => errors.push(`PAGEERROR: ${String(e)}`));
page.on('requestfailed', r => errors.push(`REQ FAIL: ${r.url()}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const bodyText = await page.evaluate(() => document.body.innerText);
const btnCount = await page.locator('button').count();
console.log('Loads (no crash):', bodyText.length > 100);
console.log('Splash gone (dashboard text present):', !bodyText.includes('Loading MathSheet'));
console.log('Buttons on page:', btnCount);
console.log('Sample:', bodyText.slice(0, 200).replace(/\n/g, ' | '));

// generate a worksheet end-to-end
await page.click('button:has-text("Real Numbers")');
await page.click('button:has-text("Polynomials")');
await page.click('button:has-text("Generate Worksheet")');
await page.waitForTimeout(800);
const katex = await page.locator('.katex').count();
const rawDollars = await page.locator('text=$').count();
console.log('Worksheet KaTeX elements:', katex);
console.log('Raw $ leaked:', rawDollars);

// practice session end-to-end (self-marking → progress)
await page.click('button:has-text("← Back to Generator")');
await page.waitForTimeout(400);
await page.click('button:has-text("Quick Practice")');
await page.waitForTimeout(400);
await page.click('button:has-text("Real Numbers")');
await page.waitForTimeout(500);
const katexPractice = await page.locator('.katex').count();
console.log('Practice KaTeX elements:', katexPractice);

await page.fill('textarea', 'HCF = 45');
await page.click('button:has-text("Show Solution")');
await page.waitForTimeout(200);
await page.click('button:has-text("I got it right")');
await page.waitForTimeout(200);

// walk to the last question; showSolution resets on each Next, so re-click it
for (let i = 0; i < 9; i++) {
  const nextBtn = page.locator('button:has-text("Next →")');
  const visible = await nextBtn.isVisible().catch(() => false);
  if (!visible) break;
  await nextBtn.click();
  await page.waitForTimeout(150);
  await page.click('button:has-text("Show Solution")');
  await page.waitForTimeout(150);
}

// the loop already revealed the solution on the last question — mark it wrong, finish
await page.click('button:has-text("I got it wrong")');
await page.waitForTimeout(200);
await page.click('button:has-text("Finish Session")');
await page.waitForTimeout(500);
const summaryText = await page.evaluate(() => document.body.innerText);
console.log('Practice summary shown (Accuracy):', /accuracy/i.test(summaryText));

await page.click('button:has-text("Back to Generator")');
await page.waitForTimeout(400);
const dashText = await page.evaluate(() => document.body.innerText);
console.log('Dashboard shows Your Progress:', dashText.includes('Your Progress'));

console.log('\n=== ERRORS ===');
console.log(errors.length ? errors.join('\n') : 'NONE');
await browser.close();