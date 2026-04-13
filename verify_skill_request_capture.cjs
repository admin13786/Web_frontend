const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const selectedSkill = {
    id: 'c93f5d46c03d4a018cc437871c9489ef',
    name: '写作润色器',
    version: '1.0.0',
  };

  let captured = null;
  const capturePromise = new Promise((resolve) => {
    page.on('request', (req) => {
      const url = req.url();
      if (
        req.method() === 'POST'
        && (url.includes('/api/workshop/agent-do/generate-preview/stream') || url.includes('/api/workshop/agent-do/generate-preview'))
      ) {
        const postData = req.postData() || '';
        try {
          const body = JSON.parse(postData);
          const prompt = String(body.system_prompt || '');
          const hasSkillName = prompt.includes('写作润色器');
          const hasSkillRule = prompt.includes('输出分三段') || prompt.includes('保留原意');
          captured = {
            url,
            hasSkillName,
            hasSkillRule,
            promptPreview: prompt.slice(0, 280),
          };
          resolve();
        } catch {
          captured = { url, parseFailed: true, rawPreview: postData.slice(0, 280) };
          resolve();
        }
      }
    });
  });

  await page.addInitScript((skill) => {
    window.localStorage.setItem('workshop-selected-skill', JSON.stringify(skill));
  }, selectedSkill);

  await page.goto('http://127.0.0.1/workshop?new=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  const input = page.locator('textarea[placeholder="输入消息..."]:visible').first();
  await input.fill('请把这句话润色：今天太阳很好我很开心。');

  const sendBtn = page.locator('.send-btn:visible, .welcome-screen__send:visible').first();
  await sendBtn.click();

  await Promise.race([
    capturePromise,
    page.waitForTimeout(15000),
  ]);

  console.log(JSON.stringify(captured || { captured: false }, null, 2));
  await browser.close();
})();
