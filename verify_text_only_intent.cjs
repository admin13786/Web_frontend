const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1798, height: 924 } });
  await page.goto('http://127.0.0.1/workshop?cid=ws_1775798003450_k435g3', { waitUntil: 'networkidle', timeout: 120000 });

  const usernameInput = page.locator('#username');
  if (await usernameInput.count()) {
    await usernameInput.fill('workshop_guest');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForTimeout(1200);
    await page.goto('http://127.0.0.1/workshop', { waitUntil: 'networkidle', timeout: 120000 });
  }

  const workshopNav = page.locator('text=创意工坊').first();
  if (await workshopNav.count()) {
    await workshopNav.click({ timeout: 15000 });
  }

  await page.waitForTimeout(1200);
  const newChatBtn = page.locator('button:has-text("新对话"), .new-chat-btn').first();
  if (await newChatBtn.count()) {
    await newChatBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
  }

  const chatInput = page.locator('textarea[placeholder="输入消息..."]').first();
  const welcomeInput = page.locator('textarea.welcome-screen__textarea').first();
  let input = chatInput;
  let sendBtn = page.locator('.input-bar .send-btn').first();

  const hasChatInput = await chatInput.isVisible().catch(() => false);
  const hasWelcomeInput = await welcomeInput.isVisible().catch(() => false);
  if (!hasChatInput && hasWelcomeInput) {
    input = welcomeInput;
    sendBtn = page.locator('.welcome-screen__send').first();
  }

  const inputVisible = await input.isVisible().catch(() => false);
  if (!inputVisible) {
    const debugPath = '/root/internship-szdsjyjy/04-07/FrontEnd/intent-text-only-debug.png';
    await page.screenshot({ path: debugPath, fullPage: true });
    const bodyText = ((await page.locator('body').innerText().catch(() => '')) || '').slice(0, 800);
    throw new Error(`输入框不可见，url=${page.url()} debug=${debugPath} body=${bodyText}`);
  }
  await input.waitFor({ state: 'visible', timeout: 30000 });
  await input.fill('请帮我润色下面这段小作文，让语言更自然，保持原意。');

  if (await sendBtn.count()) {
    await sendBtn.click();
  } else {
    await input.press('Enter');
  }

  await page.waitForTimeout(5000);

  const resultPanelCount = await page.locator('.results-panel').count();
  const chatOnlyClass = await page.locator('.workspace-main.workspace-main--chat-only').count();
  const streamStatusBarCount = await page.locator('.stream-status-bar').count();
  const hasAgentDoFailedText = (await page.locator('text=Agent-Do 生成失败').count()) > 0;
  const hasSessionNoProjectText = (await page.locator('text=当前 session 没有可在线运行的项目').count()) > 0;
  const assistantTextBlocks = await page.locator('.message.assistant .agent-text').allTextContents();
  const finalAssistantText = (assistantTextBlocks[assistantTextBlocks.length - 1] || '').trim();
  const outPath = '/root/internship-szdsjyjy/04-07/FrontEnd/intent-text-only-verify.png';
  await page.screenshot({ path: outPath, fullPage: true });

  console.log(JSON.stringify({
    resultPanelCount,
    chatOnlyClass,
    streamStatusBarCount,
    hasAgentDoFailedText,
    hasSessionNoProjectText,
    finalAssistantTextLength: finalAssistantText.length,
    finalAssistantPreview: finalAssistantText.slice(0, 80),
    screenshot: outPath,
    url: page.url(),
  }, null, 2));

  await browser.close();
})();
