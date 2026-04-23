import { stableHash32 } from './eduLogic.js'

const SIZE_MAP = {
  thumb: { w: 600, h: 900 }, // 2:3
  full: { w: 900, h: 1350 }, // 2:3
  '1x1': { w: 1080, h: 1080 },
  '9x16': { w: 900, h: 1600 },
}

const dataUrlCache = new Map()

let fontsWarmed = false
let warmPromise = null

function clampText(text, n) {
  const s = String(text || '').trim()
  if (s.length <= n) return s
  return `${s.slice(0, n).trim()}…`
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wrapLines(ctx, text, maxW) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (!s) return ['']
  const lines = []
  let buf = ''
  for (const ch of s) {
    const trial = (buf + ch).trim()
    const w = ctx.measureText(trial).width
    if (w <= maxW || !buf) {
      buf = trial
      continue
    }
    lines.push(buf)
    buf = ch.trim()
  }
  if (buf) lines.push(buf)
  return lines
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawGradientBg(ctx, w, h, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, c1)
  g.addColorStop(1, c2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawGrid(ctx, w, h, step = 52, alpha = 0.1) {
  ctx.save()
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawDots(ctx, w, h, step = 28, alpha = 0.12) {
  ctx.save()
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  for (let y = 24; y < h; y += step) {
    for (let x = 24; x < w; x += step) {
      ctx.beginPath()
      ctx.arc(x, y, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawSoftSpot(ctx, w, h, opts = {}) {
  const {
    x = w * 0.78,
    y = h * 0.24,
    r = Math.min(w, h) * 0.42,
    color = 'rgba(255,255,255,0.65)',
  } = opts
  ctx.save()
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

function drawChip(ctx, x, y, text, dark = true) {
  ctx.save()
  ctx.font = `800 28px "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui`
  const padX = 16
  const tw = ctx.measureText(text).width
  const w = Math.ceil(tw + padX * 2)
  const h = 46
  ctx.fillStyle = dark ? 'rgba(0,0,0,0.34)' : 'rgba(0,0,0,0.18)'
  roundRect(ctx, x, y, w, h, 16)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.fillText(text, x + padX, y + 33)
  ctx.restore()
}

function drawBadges(ctx, x, y, list, dark = true) {
  ctx.save()
  ctx.font = `900 26px "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui`
  let cx = x
  for (const t of (list || []).slice(0, 3)) {
    const text = String(t || '').trim()
    if (!text) continue
    const tw = ctx.measureText(text).width
    const w = Math.ceil(tw + 26)
    const h = 44
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.65)'
    roundRect(ctx, cx, y, w, h, 16)
    ctx.fill()
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.92)' : 'rgba(17,24,39,0.92)'
    ctx.fillText(text, cx + 13, y + 31)
    cx += w + 10
  }
  ctx.restore()
}

function pickTitleFont(templateId) {
  // Keep it simple + consistent (XHS-like): mostly sans; allow 1–2 playful variants.
  if (templateId === 't5') return `"ZCOOL KuaiLe", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui`
  if (templateId === 't6') return `"Ma Shan Zheng", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui`
  return `"Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui`
}

function drawTitle(ctx, w, h, title, highlights, templateId) {
  const padX = 56
  const maxW = w - padX * 2
  const top = Math.round(h * 0.18)
  const linesMax = 4

  const fontFamily = pickTitleFont(templateId)
  const fontSize = w <= 700 ? (templateId === 't5' ? 60 : 56) : 72
  const weight = templateId === 't6' ? 800 : 900
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`

  const lines = wrapLines(ctx, title, maxW).slice(0, linesMax)
  const lineH = Math.round(fontSize * 1.24)
  let y = top

  const isDark = templateId === 't7'
  const fill = isDark ? 'rgba(255,255,255,0.96)' : 'rgba(17,24,39,0.96)'
  const shadow = isDark ? 'rgba(0,0,0,0.36)' : 'rgba(17,24,39,0.14)'
  const stroke = isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.0)'
  const strokeW = isDark ? 5 : 0

  for (const line of lines) {
    // XHS-like: simple shadow + optional stroke on dark theme
    ctx.fillStyle = shadow
    ctx.fillText(line, padX + 4, y + 4)
    if (strokeW > 0) {
      ctx.lineWidth = strokeW
      ctx.strokeStyle = stroke
      ctx.strokeText(line, padX, y)
    }
    ctx.fillStyle = fill
    ctx.fillText(line, padX, y)

    y += lineH
  }
}

function drawBurst(ctx, w, h) {
  ctx.save()
  const cx = w / 2
  const cy = h * 0.42
  const rays = 28
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2
    const r1 = Math.min(w, h) * 0.16
    const r2 = Math.min(w, h) * 0.46
    const x1 = cx + Math.cos(ang) * r1
    const y1 = cy + Math.sin(ang) * r1
    const x2 = cx + Math.cos(ang) * r2
    const y2 = cy + Math.sin(ang) * r2
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSticker(ctx, x, y, w, h, text, fill, stroke, textColor) {
  ctx.save()
  ctx.fillStyle = fill
  roundRect(ctx, x, y, w, h, Math.min(22, h / 2))
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = textColor
  ctx.font = `900 32px "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui`
  ctx.fillText(text, x + 22, y + h - 20)
  ctx.restore()
}

function drawCodeWindow(ctx, x, y, w, h) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, x, y, w, h, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  roundRect(ctx, x + 12, y + 12, w - 24, 30, 14)
  ctx.fill()
  const dots = ['#FF5F57', '#FEBC2E', '#28C840']
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.fillStyle = dots[i]
    ctx.arc(x + 32 + i * 18, y + 27, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  for (let i = 0; i < 6; i++) {
    const lw = Math.max(80, (w - 64) * (0.65 + i * 0.04))
    roundRect(ctx, x + 22, y + 58 + i * 34, lw, 12, 6)
    ctx.fill()
  }
  ctx.restore()
}

function drawBarcode(ctx, x, y, w, h, seedKey) {
  const rng = mulberry32(stableHash32(seedKey))
  ctx.save()
  ctx.fillStyle = 'rgba(17,24,39,0.75)'
  ctx.globalAlpha = 0.9
  let cx = x
  while (cx < x + w) {
    const bw = Math.max(1, Math.floor(1 + rng() * 4))
    const gap = Math.max(1, Math.floor(1 + rng() * 3))
    ctx.fillRect(cx, y, bw, h)
    cx += bw + gap
  }
  ctx.restore()
}

function drawTape(ctx, x, y, w, h, color = 'rgba(17,24,39,0.10)') {
  ctx.save()
  ctx.fillStyle = color
  roundRect(ctx, x, y, w, h, Math.min(18, h / 2))
  ctx.fill()
  ctx.strokeStyle = 'rgba(17,24,39,0.10)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

function drawPaperCard(ctx, x, y, w, h, tint = 'rgba(255,255,255,0.86)') {
  ctx.save()
  // shadow
  ctx.fillStyle = 'rgba(15,23,42,0.10)'
  roundRect(ctx, x + 10, y + 14, w, h, 22)
  ctx.fill()

  ctx.fillStyle = tint
  roundRect(ctx, x, y, w, h, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(17,24,39,0.10)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

function paintBackground(ctx, w, h, templateId, seedKey) {
  // Simplified XHS-like: solid background + one soft spot only.
  const palette = {
    t1: '#FBE3EC', // pink
    t2: '#F8F6F1', // paper
    t3: '#EAF5FB', // light blue
    t4: '#F7E08A', // soft yellow
    t5: '#EFE9FF', // lavender
    t6: '#ECFDF5', // mint
    t7: '#0B1020', // dark
    t8: '#FFFFFF', // white
  }
  const bg = palette[templateId] || palette.t1
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  if (templateId === 't7') {
    drawSoftSpot(ctx, w, h, { x: w * 0.82, y: h * 0.22, r: Math.min(w, h) * 0.55, color: 'rgba(59,111,255,0.26)' })
    drawSoftSpot(ctx, w, h, { x: w * 0.18, y: h * 0.58, r: Math.min(w, h) * 0.48, color: 'rgba(255,36,66,0.18)' })
    return { dark: true }
  }

  const spotColor =
    templateId === 't1' || templateId === 't8'
      ? 'rgba(255,36,66,0.10)'
      : templateId === 't3'
        ? 'rgba(59,111,255,0.10)'
        : templateId === 't4'
          ? 'rgba(255,255,255,0.45)'
          : 'rgba(124,58,237,0.10)'

  drawSoftSpot(ctx, w, h, { color: spotColor })
  return { dark: false }
}

export function clearCoverCache() {
  dataUrlCache.clear()
}

export async function warmupCoverFonts() {
  if (fontsWarmed) return true
  if (warmPromise) return warmPromise

  warmPromise = (async () => {
    if (!document?.fonts?.load) {
      fontsWarmed = true
      return true
    }
    // best-effort: load the families used in templates before first render
    const loads = [
      document.fonts.load('900 56px Inter'),
      document.fonts.load('900 56px "Noto Sans SC"'),
      document.fonts.load('900 56px "Noto Serif SC"'),
      document.fonts.load('400 56px "ZCOOL KuaiLe"'),
      document.fonts.load('400 56px "Ma Shan Zheng"'),
      document.fonts.load('700 24px "Roboto Mono"'),
    ]
    await Promise.allSettled(loads)
    fontsWarmed = true
    return true
  })()

  return warmPromise
}

export function renderCoverDataUrl({ templateId = 't1', title = '', highlights = [], label = 'EduRepo', size = 'thumb' } = {}) {
  const spec = SIZE_MAP[size] || SIZE_MAP.thumb
  const w = spec.w
  const h = spec.h
  const t = clampText(title, 60)
  const hl = (highlights || []).slice(0, 3)

  const cacheKey = `${templateId}|${size}|${t}|${hl.join(',')}`
  // Avoid caching before fonts are warmed; otherwise we might cache fallback-font renders.
  const canCache = fontsWarmed
  const hit = canCache ? dataUrlCache.get(cacheKey) : null
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  const bg = paintBackground(ctx, w, h, templateId, cacheKey)

  drawChip(ctx, 46, 52, String(label || 'EduRepo').slice(0, 12), bg.dark)
  drawTitle(ctx, w, h, t || '3分钟搞懂：大模型新概念', hl, templateId)
  // Simplified: no bottom badges on cover (keep only chip + title)

  // eslint-disable-next-line no-unused-vars
  const _k = stableHash32(cacheKey)

  const url = canvas.toDataURL('image/png')
  if (canCache) {
    dataUrlCache.set(cacheKey, url)
    if (dataUrlCache.size > 400) {
      const k0 = dataUrlCache.keys().next().value
      if (k0) dataUrlCache.delete(k0)
    }
  }
  return url
}
