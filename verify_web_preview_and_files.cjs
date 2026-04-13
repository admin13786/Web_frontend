const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1798, height: 924 } });
  await page.goto('http://127.0.0.1/workshop', { waitUntil: 'networkidle', timeout: 120000 });

  const usernameInput = page.locator('#username');
  if (await usernameInput.count()) {
    await usernameInput.fill('workshop_guest');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForTimeout(1200);
    await page.goto('http://127.0.0.1/workshop', { waitUntil: 'networkidle', timeout: 120000 });
  }

  const newChatBtn = page.locator('button:has-text("新对话"), .new-chat-btn').first();
  if (await newChatBtn.count()) {
    await newChatBtn.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  const chatInput = page.locator('textarea[placeholder="输入消息..."]').first();
  const welcomeInput = page.locator('textarea.welcome-screen__textarea').first();
  let input = chatInput;
  let sendBtn = page.locator('.input-bar .send-btn').first();
  if (!(await chatInput.isVisible().catch(() => false)) && (await welcomeInput.isVisible().catch(() => false))) {
    input = welcomeInput;
    sendBtn = page.locator('.welcome-screen__send').first();
  }

  await input.fill('帮我写一个贪吃蛇游戏');
  if (await sendBtn.count()) {
    await sendBtn.click();
  } else {
    await input.press('Enter');
  }

  // Wait for either preview URL ready or explicit error text.
  await page.waitForFunction(
    () => {
      const hasUrlBar = !!document.querySelector('.url-bar');
      const body = document.body?.innerText || '';
      return hasUrlBar || body.includes('生成失败') || body.includes('未返回预览地址');
    },
    { timeout: 120000 },
  ).catch(() => {});

  const hasUrlBar = await page.locator('.url-bar').count();
  const hasPreviewIframe = await page.locator('.url-preview .preview-iframe').count();
  const hasFailureText = (await page.locator('text=生成失败').count()) > 0;

  const folderToggle = page.locator('.results-header .icon-btn').first();
  if (await folderToggle.count()) {
    await folderToggle.click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  const hasWorkspaceBrowser = await page.locator('.workspace-browser').count();

  const outPath = '/root/internship-szdsjyjy/04-07/FrontEnd/verify-web-preview-and-files.png';
  await page.screenshot({ path: outPath, fullPage: true });

  console.log(JSON.stringify({
    hasUrlBar,
    hasPreviewIframe,
    hasFailureText,
    hasWorkspaceBrowser,
    screenshot: outPath,
    url: page.url(),
  }, null, 2));

  await browser.close();
})();
