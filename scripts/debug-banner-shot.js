// Crop just the top bar + banner so the wrapping is unambiguous.
const { chromium, devices } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], deviceScaleFactor: 3, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.locator('header').screenshot({ path: '/tmp/aj_header.png' });
  console.log('header shot written');
  await browser.close();
})();
