// End-to-end check: Legnaro scope + map picker + created drop lands where picked.
// Run: NODE_PATH=<workspace>/node_modules node check-legnaro.js
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

  // ---------- 1. Home: whole-town framing ----------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/lg_home.png' });

  const mapState = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-container');
    if (!el) return null;
    const tiles = document.querySelectorAll('.leaflet-tile').length;
    return { hasMap: true, tiles, w: el.clientWidth, h: el.clientHeight };
  });
  console.log('home map:', JSON.stringify(mapState));

  // ---------- 2. Drop form: picker renders ----------
  await page.goto(BASE + '/drop/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/tmp/lg_form.png', fullPage: true });

  const pickerTiles = await page.evaluate(
    () => document.querySelectorAll('.leaflet-tile').length
  );
  console.log('picker tiles rendered:', pickerTiles);

  // ---------- 3. Fill the form ----------
  await page.locator('input[placeholder="Sunset rooftop chess"]').fill('Piazza Coffee Run');
  await page.locator('input[placeholder="Piazza del Mercato"]').fill('Piazza di Legnaro');

  // ---------- 4. Tap the picker to move the pin ----------
  const picker = page.locator('.leaflet-container').first();
  const pb = await picker.boundingBox();
  console.log('picker box:', JSON.stringify(pb));

  // Tap slightly north-east of centre
  const tapX = pb.x + pb.width * 0.62;
  const tapY = pb.y + pb.height * 0.38;
  await page.mouse.click(tapX, tapY);
  await page.waitForTimeout(700);

  const pinText = await page.locator('text=/Pinned /').first().innerText().catch(() => '(none)');
  console.log('pin capsule after tap:', JSON.stringify(pinText));
  await page.screenshot({ path: '/tmp/lg_form_picked.png', fullPage: true });

  // ---------- 5. Submit ----------
  await page.getByRole('button', { name: /Drop it/ }).click();
  await page.waitForTimeout(3000);
  console.log('after submit url:', page.url());
  await page.screenshot({ path: '/tmp/lg_detail.png' });

  // ---------- 6. Back home: the new drop should be there ----------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/lg_home_with_drop.png' });
  const hasDrop = await page.getByText('Piazza Coffee Run').first().isVisible().catch(() => false);
  console.log('new drop visible on home:', hasDrop);

  await browser.close();
})();