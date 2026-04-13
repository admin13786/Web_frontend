const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const hits = { generate: 0, agentdo: 0 };
  page.on('request', req => {
    const u = req.url();
    if (u.includes('/api/workshop/generate')) hits.generate += 1;
    if (u.includes('/api/workshop/agent-do/generate-preview/stream') || u.includes('/api/workshop/agent-do/generate-preview')) hits.agentdo += 1;
  });

  await page.goto('http://127.0.0.1/workshop?fm=skill_assistant&new=1', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1200);

  const modeSwitchCount = await page.locator('.mode-switch').count();

  const textarea = page.locator('textarea').first();
  await textarea.fill('请用三句话介绍这个skill');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(8000);

  console.log(JSON.stringify({ modeSwitchCount, hits }));
  await page.screenshot({ path: 'tmp-skill-assistant-after-fix.png', fullPage: true });
  await browser.close();
})();
