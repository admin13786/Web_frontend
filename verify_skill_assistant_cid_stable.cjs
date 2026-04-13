const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  await page.goto('http://127.0.0.1/workshop?fm=skill_assistant', { waitUntil: 'networkidle', timeout: 60000 });

  function currentCid() {
    const u = new URL(page.url());
    return u.searchParams.get('cid') || '';
  }

  const cid0 = currentCid();
  const textarea = page.locator('.input-area textarea:visible, .welcome-screen__textarea:visible').first();
  const sendBtn = page.locator('.send-btn:visible, .welcome-screen__send:visible').first();

  await textarea.fill('短文本测试1：请一句话回复。');
  await sendBtn.click();
  await page.waitForTimeout(2500);
  const cid1 = currentCid();

  await textarea.fill('短文本测试2：再一句话回复。');
  await sendBtn.click();
  await page.waitForTimeout(2500);
  const cid2 = currentCid();

  console.log('cid0', cid0);
  console.log('cid1', cid1);
  console.log('cid2', cid2);
  console.log('stable_after_first', cid0 === cid1);
  console.log('stable_after_second', cid1 === cid2);

  await page.screenshot({ path: 'playwright-skill-assistant-cid-stable.png', fullPage: true });
  await browser.close();
})();
