const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  const skillName = `自动化验证Skill-${Date.now()}`;
  const slug = `auto-skill-${Date.now().toString().slice(-6)}`;

  await page.goto('http://127.0.0.1/workshop?cid=ws_1775724131583_fvds3c', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  await page.getByRole('button', { name: 'Skill 仓库管理' }).click();
  await page.waitForTimeout(500);

  const errorLocator = page.locator('.modal__error').first();
  const beforeError = ((await errorLocator.textContent().catch(() => '')) || '').trim();

  await page.locator('input[placeholder="Skill 名称"]').fill(skillName);
  await page.locator('input[placeholder="Slug (可选)"]').fill(slug);
  await page.locator('input[placeholder="版本，例如 1.0.0"]').fill('1.0.0');
  await page.locator('textarea[placeholder="描述 (可选)"]').fill('用于验证 Skill 仓库 UI 与接口联动');
  await page
    .locator('textarea[placeholder="Skill Markdown 内容"]')
    .fill('# 自动化验证\n\n使用方向键控制吃豆人移动，直接在浏览器中运行。');

  await page.getByRole('button', { name: '创建 Skill' }).click();
  await page.waitForTimeout(1500);

  const afterError = ((await errorLocator.textContent().catch(() => '')) || '').trim();
  const createdVisible = await page
    .locator('.modal__row-title', { hasText: skillName })
    .first()
    .isVisible()
    .catch(() => false);

  console.log(
    JSON.stringify(
      {
        url: page.url(),
        skillName,
        slug,
        beforeError,
        afterError,
        createdVisible,
      },
      null,
      2,
    ),
  );

  await page.screenshot({ path: 'playwright-skill-fix-success.png', fullPage: true });
  await browser.close();
})();
