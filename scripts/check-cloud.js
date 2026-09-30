// End-to-end check of the shared board:
//   1. does the app READ rows that only exist in Supabase?
//   2. does posting through the form WRITE a real row (cloud UUID, not a local id)?
//   3. does that row survive a reload?
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
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200));
  });

  /* ---------- 1. READ path ---------- */
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);

  const banner = await page.getByText('Shared board offline').count();
  const cloudRow = await page.getByText('__setup test__').count();
  console.log('offline banner shown  :', banner > 0, '(want false)');
  console.log('cloud-only row visible:', cloudRow > 0, '(want true)');
  await page.screenshot({ path: '/tmp/aj_cloud_home.png' });

  /* ---------- 2. WRITE path through the real form ---------- */
  await page.goto(BASE + '/drop/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const stamp = Date.now().toString(36).slice(-5);
  const title = `E2E drop ${stamp}`;

  await page.locator('input[placeholder="Sunset rooftop chess"]').fill(title);
  await page
    .locator('input[placeholder="Bring your board and your best opening"]')
    .fill('Written by the automated check');
  await page.locator('input[placeholder="Piazza del Mercato"]').fill('Agripolis lawn');

  // Tap the map so we do not depend on the random-position fallback.
  const picker = page.locator('.leaflet-container').last();
  await picker.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const box = await picker.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.5);
    await page.waitForTimeout(700);
  }

  await page.getByRole('button', { name: /Drop it/i }).click();
  await page.waitForTimeout(7000);

  const url = page.url();
  const uuid = /\/e\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.exec(url);
  console.log('url after submit      :', url);
  console.log('got a cloud UUID id   :', Boolean(uuid), uuid ? uuid[1] : '(none)');
  await page.screenshot({ path: '/tmp/aj_cloud_new.png' });

  /* ---------- 3. does it survive a reload? ---------- */
  if (uuid) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const again = await page.getByText(title).count();
    console.log('title back on board   :', again > 0, '(want true)');
    console.log('E2E_DROP_ID=' + uuid[1]);
    console.log('E2E_DROP_TITLE=' + title);
  }

  console.log('page errors           :', errors.length ? errors.slice(0, 4) : 'none');
  await browser.close();
})();
