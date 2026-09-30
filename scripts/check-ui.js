// Verify bottom-sheet drag + avatar navigation on iPhone 14 viewport.
// Run: NODE_PATH=<workspace>/node_modules node check-ui.js
const { chromium, devices } = require('playwright-core');

const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[PAGEERROR]', e.message));

  // ---------- Home: empty state ----------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/aj_home.png' });

  const heading = await page.locator('h1').first().innerText().catch(() => '(none)');
  console.log('home h1:', JSON.stringify(heading));
  console.log('has "Drop your own" CTA:', await page.getByText('Drop your own').first().isVisible());
  console.log('sample events removed:', !(await page.getByText('Friday Frisbee Frenzy').isVisible().catch(() => false)));

  // ---------- Drag: sheet starts expanded (empty state), drag handle DOWN ----------
  const handle = page.locator('.aj-grab').first();
  const hb = await handle.boundingBox();
  console.log('handle box:', JSON.stringify(hb));

  const cx = hb.x + hb.width / 2;
  const cy = hb.y + hb.height / 2;

  // Drag downward by 90px to collapse
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(cx, cy + i * 8, { steps: 1 });
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/tmp/aj_collapsed.png' });

  // Drag back up to expand
  await page.mouse.move(cx, cy + 50);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(cx, cy + 50 - i * 8, { steps: 1 });
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/tmp/aj_expanded.png' });
  console.log('drag cycle done');

  // ---------- Avatar link -> /me ----------
  const avatar = page.locator('a[href="/me"]').first();
  const box = await avatar.boundingBox();
  console.log('avatar box:', JSON.stringify(box));
  await avatar.click();
  await page.waitForTimeout(2500);
  console.log('after avatar click url:', page.url());
  await page.screenshot({ path: '/tmp/aj_me.png' });

  // ---------- /drop/new ----------
  await page.goto(BASE + '/drop/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/aj_new.png' });
  console.log('/drop/new title:', JSON.stringify(await page.locator('h1').first().innerText().catch(() => '(none)')));

  await browser.close();
})();