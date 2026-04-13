const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });

  await page.goto('http://127.0.0.1/workshop?cid=ws_1775724131583_fvds3c', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  await page.getByRole('button', { name: 'Skill 仓库管理' }).click();
  await page.waitForTimeout(600);

  const overlayCheck = await page.evaluate(() => {
    const mask = document.querySelector('.modal-mask');
    const modal = document.querySelector('.modal.modal--wide');
    const toggle = document.querySelector('.theme-toggle');
    const input = document.querySelector('.input-area textarea');
    const chatBubble = Array.from(document.querySelectorAll('.message-bubble, .bubble, .chat-message')).find(Boolean);

    function centerPoint(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
    }

    function topElementTagAt(point) {
      if (!point) return null;
      const top = document.elementFromPoint(point.x, point.y);
      if (!top) return null;
      return {
        className: top.className || '',
        tagName: top.tagName || '',
        inModalMask: Boolean(top.closest('.modal-mask')),
      };
    }

    const togglePoint = centerPoint(toggle);
    const inputPoint = centerPoint(input);
    const bubblePoint = centerPoint(chatBubble);

    return {
      hasMask: Boolean(mask),
      hasModal: Boolean(modal),
      maskZIndex: mask ? getComputedStyle(mask).zIndex : null,
      toggleTopElement: topElementTagAt(togglePoint),
      inputTopElement: topElementTagAt(inputPoint),
      bubbleTopElement: topElementTagAt(bubblePoint),
    };
  });

  console.log(JSON.stringify(overlayCheck, null, 2));
  await page.screenshot({ path: 'playwright-skill-overlay-fixed.png', fullPage: true });
  await browser.close();
})();
