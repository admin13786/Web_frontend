const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1792, height: 1017 } });
  await page.goto('http://127.0.0.1/workshop?cid=ws_1775724131583_fvds3c', { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('button', { name: /Skill 仓库管理/ }).click();
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const modal = document.querySelector('.modal.modal--wide');
    const inputs = Array.from(modal.querySelectorAll('input, textarea')).map((el) => ({
      tag: el.tagName,
      placeholder: el.getAttribute('placeholder'),
      value: el.value,
      className: el.className,
      rect: el.getBoundingClientRect().toJSON(),
      styles: {
        height: getComputedStyle(el).height,
        lineHeight: getComputedStyle(el).lineHeight,
        overflow: getComputedStyle(el).overflow,
        display: getComputedStyle(el).display,
        position: getComputedStyle(el).position,
        whiteSpace: getComputedStyle(el).whiteSpace,
      }
    }));
    return {
      errorText: document.querySelector('.modal__error')?.textContent?.trim() || '',
      formText: modal.querySelector('.skill-create-form')?.innerText || '',
      inputs
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'playwright-skill-modal-inspect.png', fullPage: true });
  await browser.close();
})();
