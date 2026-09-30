// Definitive: count rendered line boxes of the banner text.
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

  const out = await page.evaluate(() => {
    const p = Array.from(document.querySelectorAll('header p')).find((el) =>
      el.textContent.includes('Shared board offline')
    );
    if (!p) return { found: false };

    const range = document.createRange();
    range.selectNodeContents(p);
    const lines = Array.from(range.getClientRects()).map((r) => ({
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
    }));

    const cs = getComputedStyle(p);
    return {
      found: true,
      lineCount: lines.length,
      lines,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      box: (() => {
        const r = p.getBoundingClientRect();
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      })(),
      // Is the visible area clipping the last line?
      sheetTop: (() => {
        const s = document.querySelector('[class*="rounded-t"]');
        return s ? +s.getBoundingClientRect().y.toFixed(1) : null;
      })(),
    };
  });

  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
