const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  await page.goto('http://127.0.0.1/workshop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim());
    return {
      url: location.href,
      title: document.title,
      moduleSrc: document.querySelector('script[type="module"]')?.getAttribute('src') || '',
      hasSkillSelect: btns.some((t) => t.includes('选择 Skill')),
      hasSkillManager: btns.some((t) => t.includes('Skill 仓库管理')),
      matchedButtons: btns.filter((t) => t.includes('选择 Skill') || t.includes('Skill 仓库管理')),
    };
  });
  await page.screenshot({ path: 'playwright-skill-verify-success.png', fullPage: true });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
