// Cancel-your-own-drop check.
// Creates a drop in THIS browser (so we own it), then cancels it from /me.
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
  page.on('dialog', (d) => d.accept()); // the window.confirm()

  /* ---- 1. create a drop we own ---- */
  await page.goto(BASE + '/drop/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const stamp = Date.now().toString(36).slice(-5);
  const title = `DELETE ME ${stamp}`;
  await page.locator('input[placeholder="Sunset rooftop chess"]').fill(title);
  await page.locator('input[placeholder="Piazza del Mercato"]').fill('Agripolis lawn');
  await page.getByRole('button', { name: /Drop it/i }).click();
  await page.waitForTimeout(7000);

  const created = /\/e\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.exec(
    page.url()
  );
  console.log('1. created            :', created ? created[1] : '(FAILED)', '|', title);
  if (!created) {
    console.log('   → cannot continue without a drop');
    console.log('   errors:', errors.slice(0, 3));
    await browser.close();
    return;
  }

  /* ---- 2. cancel it from the profile page ---- */
  await page.goto(BASE + '/me', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.getByRole('button', { name: /^Hosting/ }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/aj_me_hosting.png' });

  const trash = page.getByRole('button', { name: /^Cancel / });
  const trashCount = await trash.count();
  console.log('2. cancel buttons seen:', trashCount, '(want >= 1)');
  if (!trashCount) {
    console.log('   → no delete button rendered; errors:', errors.slice(0, 3));
    await browser.close();
    return;
  }

  await trash.first().click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/aj_me_after.png' });

  const stillThere = await page.getByText(title, { exact: true }).count();
  console.log('3. row still on page  :', stillThere > 0, '(want false)');

  const errText = await page
    .locator('p')
    .filter({ hasText: /Cancelling needs|not allowed|permission|gone|Cannot reach/i })
    .allInnerTexts()
    .catch(() => []);
  console.log('4. visible error      :', errText.length ? errText[0] : 'none');

  console.log('   page errors        :', errors.length ? errors.slice(0, 3) : 'none');
  await browser.close();
})();
