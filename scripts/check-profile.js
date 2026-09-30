// End-to-end check: profile editing (name + field of study) persists.
// Run: NODE_PATH=<workspace>/node_modules node check-profile.js
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

  // ---------- 1. Open profile ----------
  await page.goto(BASE + '/me', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/pf_view.png', fullPage: true });
  console.log('default name shown:', await page.locator('text=You').first().isVisible());
  console.log('shows placeholder major:', await page.getByText('Add your field of study').isVisible());

  // ---------- 2. Open the editor ----------
  await page.getByLabel('Edit profile').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/pf_edit.png', fullPage: true });
  console.log('editor open:', await page.getByText('Your profile').isVisible());

  // ---------- 3. Fill name + major ----------
  await page.locator('input[placeholder="Yiran Qian"]').fill('Yiran Qian');
  await page.locator('input[placeholder="Italian Food and Wine, MSc"]').fill('Italian Food and Wine, MSc');
  await page.locator('textarea[placeholder*="frisbee"]').fill('Consumer research · DCE / WTP');
  await page.screenshot({ path: '/tmp/pf_filled.png', fullPage: true });

  // ---------- 4. Save ----------
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/pf_saved.png', fullPage: true });

  const nameVisible = await page.getByText('Yiran Qian').first().isVisible().catch(() => false);
  const majorVisible = await page
    .getByText('Italian Food and Wine, MSc')
    .first()
    .isVisible()
    .catch(() => false);
  console.log('saved name visible:', nameVisible);
  console.log('saved major visible:', majorVisible);

  // ---------- 5. Persistence: reload ----------
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const nameAfterReload = await page.getByText('Yiran Qian').first().isVisible().catch(() => false);
  const majorAfterReload = await page
    .getByText('Italian Food and Wine, MSc')
    .first()
    .isVisible()
    .catch(() => false);
  console.log('after reload — name:', nameAfterReload, 'major:', majorAfterReload);
  await page.screenshot({ path: '/tmp/pf_reloaded.png', fullPage: true });

  // ---------- 6. localStorage payload ----------
  const stored = await page.evaluate(() => localStorage.getItem('agrijump.profile.v1'));
  console.log('localStorage profile:', stored);

  await browser.close();
})();