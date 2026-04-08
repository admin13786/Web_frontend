import { chromium } from 'playwright'

const prompt = process.argv[2] || '给我写一个贪吃蛇'
const waitMs = Number(process.argv[3] || 65000)
const baseUrl = process.argv[4] || 'http://127.0.0.1'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const events = []

page.on('request', (req) => {
  if (req.url().includes('/api/workshop/agent-do/generate-preview/stream')) {
    events.push({
      type: 'request',
      url: req.url(),
      method: req.method(),
      postData: req.postData(),
    })
  }
})

page.on('response', async (res) => {
  if (res.url().includes('/api/workshop/agent-do/generate-preview/stream')) {
    let text = ''
    try {
      text = await res.text()
    } catch (error) {
      text = String(error)
    }
    events.push({
      type: 'response',
      url: res.url(),
      status: res.status(),
      text: text.slice(0, 6000),
    })
  }
})

await page.goto(`${baseUrl}/workshop`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.locator('textarea').fill(prompt)
await page.keyboard.press('Enter')
await page.waitForTimeout(waitMs)

const state = await page.evaluate(() => ({
  url: location.href,
  moduleSrc: document.querySelector('script[type="module"]')?.getAttribute('src') || '',
  bodyText: document.body.innerText.slice(0, 3000),
  iframes: Array.from(document.querySelectorAll('iframe')).map((node) => node.src),
  chatText: Array.from(
    document.querySelectorAll('.message,.chat-message,.bubble,.assistant-message,.user-message'),
  )
    .map((node) => node.textContent)
    .join('\n')
    .slice(0, 3000),
}))

await page.screenshot({
  path: '/root/internship-szdsjyjy/04-07/FrontEnd/playwright-current-check.png',
  fullPage: true,
})

console.log(JSON.stringify({ events, state }, null, 2))

await browser.close()
