const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });

  let captured = null;
  page.on('request', (req) => {
    const url = req.url();
    if (req.method() === 'POST' && (url.includes('/api/workshop/generate') || url.includes('/api/workshop/agent-do/generate-preview/stream'))) {
      try { captured = { url, body: req.postDataJSON() }; } catch {}
    }
  });

  await page.goto('http://127.0.0.1/workshop?fm=skill_assistant', { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('.workshop-history__skill-btn').click();
  await page.waitForTimeout(300);
  await page.locator('.modal .modal__item').first().click();
  await page.locator('.workshop-history__skill-btn').click();
  await page.waitForTimeout(300);
  const skillItems = page.locator('.modal .modal__item').filter({ hasNotText: '清空已选 Skill' });
  const count = await skillItems.count();
  if (count > 0) await skillItems.nth(0).click();
  await page.locator('.modal__close').first().click();

  const input = page.locator('textarea:visible').first();
  await input.fill('Please summarize this article into 3 bullets.');
  await page.locator('.welcome-screen__send:visible, .send-btn:visible').first().click();
  await page.waitForTimeout(2500);

  const systemPrompt = String(captured?.body?.system_prompt || '');
  console.log('captured_url', captured?.url || '');
  console.log('has_skill_policy', systemPrompt.includes('Skill Composition Policy'));
  await page.screenshot({ path: 'playwright-multi-skill-injection.png', fullPage: true });
  await browser.close();
})();
