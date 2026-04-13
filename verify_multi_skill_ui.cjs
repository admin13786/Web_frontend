const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  await page.goto('http://127.0.0.1/workshop?fm=skill_assistant', { waitUntil: 'networkidle', timeout: 60000 });

  await page.locator('.workshop-history__skill-btn').click();
  await page.waitForTimeout(500);

  const skillItems = page.locator('.modal .modal__item').filter({ hasNotText: '清空已选 Skill' });
  const itemCount = await skillItems.count();
  if (itemCount >= 1) await skillItems.nth(0).click();
  if (itemCount >= 2) await skillItems.nth(1).click();

  const selectedHints = await page.locator('.modal .modal__item.active').count();
  console.log('selected_hint_count', selectedHints);
  await page.screenshot({ path: 'playwright-multi-skill-selector.png', fullPage: true });

  await page.locator('.modal__close').first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Skill 仓库管理' }).click();
  await page.waitForTimeout(500);
  const routingBtnCount = await page.getByRole('button', { name: '路由' }).count();
  console.log('routing_button_count', routingBtnCount);
  await page.screenshot({ path: 'playwright-skill-routing-button.png', fullPage: true });

  await browser.close();
})();
