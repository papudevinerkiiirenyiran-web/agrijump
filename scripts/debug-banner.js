// Measure the offline banner: is it overflowing, or just not wrapping?
const { chromium, devices } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const header = document.querySelector('header');
    const p = Array.from(document.querySelectorAll('header p')).find((el) =>
      el.textContent.includes('Offline mode')
    );
    const pick = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        scrollW: el.scrollWidth,
        clientW: el.clientWidth,
        display: cs.display,
        whiteSpace: cs.whiteSpace,
        wordBreak: cs.wordBreak,
        flex: cs.flex,
        minWidth: cs.minWidth,
      };
    };
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      header: pick(header),
      banner: pick(p),
      text: p ? p.textContent : null,
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
