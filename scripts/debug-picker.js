// Focused debug: does tapping the picker actually move the pin?
const { chromium, devices } = require('playwright-core');
const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[PAGEERROR]', e.message));

  await page.goto(BASE + '/drop/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);

  // Scroll the picker fully into view
  const picker = page.locator('.leaflet-container').first();
  await picker.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const before = await picker.boundingBox();
  console.log('picker box (in view):', JSON.stringify(before));

  // Read the capsule BEFORE
  const capBefore = await page.locator('.capsule').last().innerText().catch(() => '(none)');
  console.log('capsule before:', JSON.stringify(capBefore));

  // Tap via touchscreen (more realistic on mobile)
  const tx = before.x + before.width * 0.65;
  const ty = before.y + before.height * 0.35;
  await page.touchscreen.tap(tx, ty);
  await page.waitForTimeout(900);

  const capAfter = await page.locator('.capsule').last().innerText().catch(() => '(none)');
  console.log('capsule after touch tap:', JSON.stringify(capAfter));

  // Also try a plain mouse click at a different spot
  await page.mouse.click(before.x + before.width * 0.3, before.y + before.height * 0.7);
  await page.waitForTimeout(900);
  const capAfter2 = await page.locator('.capsule').last().innerText().catch(() => '(none)');
  console.log('capsule after mouse click:', JSON.stringify(capAfter2));

  // Count markers inside the picker
  const markerCount = await page.evaluate(() => document.querySelectorAll('.aj-pin-pick').length);
  console.log('pin markers on page:', markerCount);

  await page.screenshot({ path: '/tmp/lg_pick_debug.png', fullPage: true });

  await browser.close();
})();