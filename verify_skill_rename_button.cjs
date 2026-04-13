const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  await page.goto('http://127.0.0.1/workshop?fm=skill_assistant', { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('button', { name: 'Skill 仓库管理' }).click();
  await page.waitForTimeout(500);
  const count = await page.getByRole('button', { name: '改名' }).count();
  console.log('rename_button_count', count);
  await page.screenshot({ path: 'playwright-skill-rename-button.png', fullPage: true });
  await browser.close();
})();
