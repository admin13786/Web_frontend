const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://127.0.0.1/workshop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const info = await page.evaluate(() => ({
  moduleSrc: document.querySelector('script[type="module"]')?.getAttribute('src'),
  welcomeCount: document.querySelectorAll('.welcome-screen').length,
  resultsPanelCount: document.querySelectorAll('.results-panel').length,
  dividerCount: document.querySelectorAll('.divider').length,
  emptyHintCount: document.querySelectorAll('.empty-hint').length,
  text: document.body.innerText.slice(0, 250),
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
