const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  const skillName = `ZIP前端验证-${Date.now()}`;
  const slug = `zip-ui-${Date.now().toString().slice(-6)}`;
  const zipPath = '/root/internship-szdsjyjy/04-07/FrontEnd/tmp-skill-upload.zip';

  await page.goto('http://127.0.0.1/workshop?cid=ws_1775724131583_fvds3c', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  await page.locator('.skill-manager-entry').click();
  await page.waitForTimeout(400);

  const textInputs = page.locator('.skill-create-form .skill-input');
  await textInputs.nth(0).fill(skillName);
  await textInputs.nth(1).fill(slug);
  await textInputs.nth(2).fill('1.0.0');
  await page.locator('.skill-create-form .skill-textarea').nth(0).fill('zip upload by ui');

  const zipInput = page.locator('.skill-zip-upload input[type="file"]');
  await zipInput.setInputFiles(zipPath);
  await page.locator('.skill-zip-upload .skill-primary-btn').click();
  await page.waitForTimeout(1500);

  const createdVisible = await page
    .locator('.modal__row-title', { hasText: skillName })
    .first()
    .isVisible()
    .catch(() => false);
  const errorText = ((await page.locator('.modal__error').first().textContent().catch(() => '')) || '').trim();

  console.log(
    JSON.stringify(
      {
        createdVisible,
        errorText,
        skillName,
        slug,
      },
      null,
      2,
    ),
  );

  await page.screenshot({ path: 'playwright-skill-zip-upload-success.png', fullPage: true });
  await browser.close();
})();
