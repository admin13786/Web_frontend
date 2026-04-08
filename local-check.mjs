const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://127.0.0.1:4173/workshop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const info = await page.evaluate(() => ({
  workspaceMainClass: document.querySelector('.workspace-main')?.className || null,
  resultsPanelCount: document.querySelectorAll('.results-panel').length,
  dividerCount: document.querySelectorAll('.divider').length,
  welcomeCount: document.querySelectorAll('.welcome-screen').length,
  emptyHintCount: document.querySelectorAll('.empty-hint').length,
  bodyText: document.body.innerText.slice(0, 200),
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
