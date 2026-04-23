import { apiGet, buildFeedUrl, buildItemUrl } from './api.js'
import { API_BASE } from './config.js'
import { extractConcepts, pickTemplateId, pickTemplateIds } from './eduLogic.js'
import { clearCoverCache, renderCoverDataUrl, warmupCoverFonts } from './coverCanvas.js'

import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/700.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/noto-sans-sc/900.css'
import '@fontsource/noto-serif-sc/600.css'
import '@fontsource/noto-serif-sc/900.css'
import '@fontsource/zcool-kuaile/400.css'
import '@fontsource/ma-shan-zheng/400.css'
import './style.css'

const el = document.querySelector('#app')

const state = {
  loading: false,
  board: 'all',
  q: '',
  minScore: 1.4,
  limit: 40,
  list: [],
  error: '',
  modal: { open: false, loading: false, data: null, error: '' },
  backfill: { loading: false, error: '' },
  stats: null,
}

const PS_REQUIRED_H2 = [
  '这件事在讲什么（一句话 + 3~5 句解释）',
  '为什么重要（和你有什么关系）（讲影响/应用/避免误解）',
  '用一个例子讲明白（生活化类比/场景）',
  '你可以怎么开始（3条可执行建议）（必须 3 条 - 列表）',
]

const PS_LABELS = ['讲什么', '为什么重要', '举个例子', '怎么开始']

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v
    else if (k === 'style') node.setAttribute('style', v)
    else if (k === 'value' && 'value' in node) node.value = String(v ?? '')
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v)
    else if (v === false || v === null || v === undefined) continue
    else node.setAttribute(k, String(v))
  }
  for (const c of Array.isArray(children) ? children : [children]) {
    if (c === null || c === undefined) continue
    if (typeof c === 'string') node.appendChild(document.createTextNode(c))
    else node.appendChild(c)
  }
  return node
}

function toAbs(url) {
  const s = String(url || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const base = String(API_BASE || '').replace(/\/$/, '')
  return `${base}${s.startsWith('/') ? '' : '/'}${s}`
}

function formatTime(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  return s.replace('T', ' ').replace('Z', '')
}

function updateReadProgress(scrollerEl, barEl) {
  if (!scrollerEl || !barEl) return
  const max = scrollerEl.scrollHeight - scrollerEl.clientHeight
  const p = max > 0 ? scrollerEl.scrollTop / max : 0
  const clamped = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0))
  barEl.style.transform = `scaleX(${clamped})`
  barEl.style.opacity = max > 0 ? '1' : '0'
}

function isNumericId(v) {
  return /^[0-9]+$/.test(String(v || '').trim())
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function loadFeed() {
  const seq = ++loadFeed.seq
  state.loading = true
  state.error = ''
  renderApp()
  try {
    loadStats()
    const data = await apiGet(
      buildFeedUrl({
        limit: state.limit,
        board: state.board,
        q: state.q.trim(),
        minScore: state.minScore,
      }),
    )
    if (seq !== loadFeed.seq) return
    const list = Array.isArray(data?.list) ? data.list : []
    state.list = list
  } catch (e) {
    if (seq !== loadFeed.seq) return
    console.error('loadFeed error:', e)
    state.error = e?.message || String(e)
    state.list = []
  } finally {
    if (seq === loadFeed.seq) {
      state.loading = false
      renderApp()
    }
  }
}
loadFeed.seq = 0

let searchDebounceTimer = null
let keepSearchFocus = false
let keepSearchSelection = null

function requestSearchFocus(inputEl) {
  try {
    keepSearchFocus = Boolean(inputEl && document.activeElement === inputEl)
    if (keepSearchFocus && inputEl && typeof inputEl.selectionStart === 'number' && typeof inputEl.selectionEnd === 'number') {
      keepSearchSelection = { start: inputEl.selectionStart, end: inputEl.selectionEnd }
    } else {
      keepSearchSelection = null
    }
  } catch {
    keepSearchFocus = false
    keepSearchSelection = null
  }
}

function searchNow() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  state.limit = 40
  loadFeed()
}

function scheduleSearch(inputEl) {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    requestSearchFocus(inputEl)
    searchNow()
  }, 320)
}

let statsTimer = null
async function loadStats() {
  try {
    const data = await apiGet('/api/edu/stats')
    state.stats = data?.stats || null
  } catch (e) {
    // stats is best-effort
  } finally {
    if (statsTimer) {
      clearTimeout(statsTimer)
      statsTimer = null
    }
    const running = Boolean(state.stats && state.stats.bgProcessing)
    if (running) statsTimer = setTimeout(() => loadStats(), 2000)
    renderApp()
  }
}

async function backfillNow() {
  state.backfill.loading = true
  state.backfill.error = ''
  renderApp()
  try {
    const qs = new URLSearchParams()
    qs.set('limit', String(Math.min(20, Math.max(10, state.limit))))
    qs.set('board', String(state.board || 'all'))
    qs.set('minScore', String(state.minScore))
    qs.set('asyncMode', '1')
    if (state.q && String(state.q).trim()) qs.set('q', String(state.q).trim())
    const res = await fetch(`${String(API_BASE || '').replace(/\/$/, '')}/api/edu/backfill?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || `HTTP ${res.status}`)
    // async backfill: backend starts LLM processing in background
    await loadFeed()
    loadStats()
    ;[1500, 3500, 7000].forEach((ms) => setTimeout(() => loadFeed(), ms))
  } catch (e) {
    state.backfill.error = e?.message || String(e)
  } finally {
    state.backfill.loading = false
    renderApp()
  }
}

async function openDetail(newsId) {
  state.modal.open = true
  state.modal.loading = true
  state.modal.data = null
  state.modal.error = ''
  renderApp()
  try {
    if (!isNumericId(newsId)) throw new Error('该条目缺少可用 newsId（数字）')
    const data = await apiGet(buildItemUrl(newsId))
    if (!data?.success) throw new Error(data?.message || '加载失败')
    state.modal.data = data.data
  } catch (e) {
    state.modal.error = e?.message || String(e)
  } finally {
    state.modal.loading = false
    renderApp()
  }
}

function closeDetail() {
  state.modal.open = false
  state.modal.data = null
  state.modal.error = ''
  renderApp()
}

function pickHighlightWords(keywords = []) {
  const cleaned = (Array.isArray(keywords) ? keywords : [])
    .map((x) => String(x || '').trim())
    .filter((x) => x.length >= 2 && x.length <= 10)
    .filter((x) => !/^[0-9]+$/.test(x))
  const uniq = []
  for (const w of cleaned) {
    if (!uniq.includes(w)) uniq.push(w)
    if (uniq.length >= 3) break
  }
  return uniq
}

function textWithHighlights(text, keywords = [], className = 'hl') {
  const s = String(text || '')
  const words = pickHighlightWords(keywords)
  if (!s || words.length === 0) return document.createTextNode(s)
  const re = new RegExp(words.map(escapeRegExp).join('|'), 'giu')
  const frag = document.createDocumentFragment()
  let last = 0
  for (const m of s.matchAll(re)) {
    const idx = m.index ?? -1
    if (idx < 0) continue
    if (idx > last) frag.appendChild(document.createTextNode(s.slice(last, idx)))
    frag.appendChild(h('span', { class: className }, m[0]))
    last = idx + m[0].length
  }
  if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)))
  return frag
}

function inlineNodes(text, keywords = []) {
  const s = String(text || '')
  const frag = document.createDocumentFragment()
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  for (const m of s.matchAll(re)) {
    const idx = m.index ?? -1
    if (idx < 0) continue
    if (idx > last) frag.appendChild(textWithHighlights(s.slice(last, idx), keywords, 'kw'))
    const strong = h('strong', {}, [])
    strong.appendChild(textWithHighlights(m[1], keywords, 'kw'))
    frag.appendChild(strong)
    last = idx + m[0].length
  }
  if (last < s.length) frag.appendChild(textWithHighlights(s.slice(last), keywords, 'kw'))
  return frag
}

function renderMarkdown(md, keywords = []) {
  const root = h('div', { class: 'md' }, [])
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = (lines[i] || '').trimEnd()
    const t = line.trim()
    if (!t) {
      i += 1
      continue
    }

    if (t.startsWith('## ')) {
      const node = h('h2', {}, [])
      node.appendChild(inlineNodes(t.slice(3).trim(), keywords))
      root.appendChild(node)
      i += 1
      continue
    }
    if (t.startsWith('### ')) {
      const node = h('h3', {}, [])
      node.appendChild(inlineNodes(t.slice(4).trim(), keywords))
      root.appendChild(node)
      i += 1
      continue
    }
    if (t.startsWith('> ')) {
      const buf = []
      while (i < lines.length && String(lines[i] || '').trim().startsWith('> ')) {
        buf.push(String(lines[i] || '').trim().slice(2))
        i += 1
      }
      const bq = h('blockquote', {}, [])
      bq.appendChild(inlineNodes(buf.join('\n'), keywords))
      root.appendChild(bq)
      continue
    }
    if (t.startsWith('- ')) {
      const ul = h('ul', {}, [])
      while (i < lines.length && String(lines[i] || '').trim().startsWith('- ')) {
        const li = h('li', {}, [])
        li.appendChild(inlineNodes(String(lines[i] || '').trim().slice(2), keywords))
        ul.appendChild(li)
        i += 1
      }
      root.appendChild(ul)
      continue
    }

    const buf = [t]
    i += 1
    while (i < lines.length) {
      const nxt = String(lines[i] || '').trim()
      if (!nxt) break
      if (/^(## |### |> |- )/.test(nxt)) break
      buf.push(nxt)
      i += 1
    }
    const p = h('p', {}, [])
    p.appendChild(inlineNodes(buf.join(' '), keywords))
    root.appendChild(p)
  }
  return root
}

function splitPsMarkdown(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n')

  function trySplit(titles, labels) {
    if (!Array.isArray(titles) || titles.length === 0) return null
    const idxs = []
    for (const title of titles) {
      const target = `## ${title}`
      const idx = lines.findIndex((l) => String(l || '').trim() === target)
      if (idx < 0) return null
      idxs.push(idx)
    }
    if (!idxs.every((v, i, arr) => (i === 0 ? true : v > arr[i - 1]))) return null

    const sections = []
    for (let i = 0; i < idxs.length; i++) {
      const start = idxs[i] + 1
      const end = i + 1 < idxs.length ? idxs[i + 1] : lines.length
      const body = lines.slice(start, end).join('\n').trim()
      sections.push({ label: (labels && labels[i]) || '', body })
    }
    return sections
  }

  return trySplit(PS_REQUIRED_H2_CN, PS_LABELS_CN) || trySplit(PS_REQUIRED_H2, PS_LABELS)
}

function renderPsMarkdown(md, keywords = []) {
  const secs = splitPsMarkdown(md)
  if (!secs) return renderMarkdown(md, keywords)

  return h('div', { class: 'ps' }, [
    ...secs.map((s) =>
      h('section', { class: 'psBlock' }, [
        s.label ? h('div', { class: 'psLabel' }, s.label) : null,
        s.body ? renderMarkdown(s.body, keywords) : h('div', { class: 'md' }, [h('p', {}, '（内容为空）')]),
      ]),
    ),
  ])
}

function Card(item) {
  const keywords = Array.isArray(item.keywords) ? item.keywords : []
  const chips = keywords.slice(0, 3).map((t, idx) => h('span', { class: `chip chip${idx + 1}` }, t))
  const cover = toAbs(item.coverUrl) || toAbs(item.externalCoverUrl)
  const title = item.hookTitle || item.originalTitle || ''

  return h(
    'article',
    { class: 'card', onClick: () => openDetail(item.newsId) },
    [
      h('div', { class: 'coverWrap' }, [
        h('img', {
          class: 'cover',
          src: cover,
          loading: 'lazy',
          alt: title,
        }),
      ]),
      h('div', { class: 'cardBody' }, [
        h('div', { class: 'title' }, [textWithHighlights(title, keywords, 'hl')]),
        item.summary ? h('div', { class: 'summary' }, [textWithHighlights(item.summary, keywords, 'kw')]) : null,
        h('div', { class: 'chips' }, chips),
        h('div', { class: 'meta' }, [
          h('span', { class: 'source' }, item.source || '来源'),
          h('span', { class: 'dot' }, '·'),
          h('span', { class: 'time' }, formatTime(item.publishedAt) || ''),
        ]),
      ]),
    ],
  )
}

function getDisplayKeywords(item) {
  const fromDb = Array.isArray(item?.keywords) ? item.keywords : []
  if (fromDb.length) return fromDb
  const title = String(item?.hookTitle || item?.originalTitle || '').trim()
  const summary = String(item?.summary || '').trim()
  return extractConcepts({ title, summary }, 4)
}

function XhsCard(item) {
  const title = String(item?.hookTitle || item?.originalTitle || '').trim()
  const keywords = getDisplayKeywords(item)
  const highlights = pickHighlightWords(keywords)

  const seedKey = `${String(item?.newsId || '').trim()}|${title}`
  const templateId = pickTemplateId(seedKey)
  const cover = renderCoverDataUrl({ templateId, title, highlights, label: keywords?.[0] || '发现', size: 'thumb' })

  const chips = (keywords || []).slice(0, 3).map((t) => h('span', { class: 'chip' }, String(t)))
  const preview = String(item?.summary || '').trim()

  return h('article', { class: 'postCard', onClick: () => openDetail(item.newsId) }, [
    h('div', { class: 'postCoverWrap' }, [
      h('img', { class: 'postCover', src: cover, loading: 'lazy', alt: title || 'EduRepo' }),
    ]),
    h('div', { class: 'postInfo' }, [
      chips.length ? h('div', { class: 'chipsRow' }, chips) : null,
      h('div', { class: 'postPreview' }, preview || '点开查看：关键词、要点与相关内容。'),
    ]),
  ])
}

function deriveTheme(item) {
  const title = String(item?.hookTitle || item?.originalTitle || '').toLowerCase()
  const kws = (Array.isArray(item?.keywords) ? item.keywords : []).map((x) => String(x || '').toLowerCase())
  const blob = `${title}\n${kws.join(' ')}`

  const has = (...ws) => ws.some((w) => blob.includes(String(w).toLowerCase()))
  if (has('rag', '检索', '向量', 'embedding', '召回')) return '检索 / RAG'
  if (has('agent', '智能体', '工具调用', 'workflow', '多代理')) return 'Agent / 工作流'
  if (has('lora', '微调', 'finetune', 'sft', 'dpo', '对齐', '训练')) return '训练 / 对齐'
  if (has('推理', '部署', '量化', '蒸馏', 'latency', '吞吐')) return '推理 / 部署'
  if (has('多模态', 'vision', '图像', '语音', '视频')) return '多模态'
  return '通用科普'
}

function groupByTheme(list) {
  const groups = new Map()
  for (const it of Array.isArray(list) ? list : []) {
    const k = deriveTheme(it)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(it)
  }
  const order = ['检索 / RAG', 'Agent / 工作流', '训练 / 对齐', '推理 / 部署', '多模态', '通用科普']
  const out = []
  for (const name of order) {
    const items = groups.get(name)
    if (items && items.length) out.push({ name, items })
  }
  for (const [name, items] of groups.entries()) {
    if (order.includes(name)) continue
    out.push({ name, items })
  }
  return out
}

function Modal() {
  if (!state.modal.open) return null
  const body = []

  if (state.modal.loading) {
    body.push(h('div', { class: 'modalLoading' }, '正在生成科普笔记（首次打开可能需要 10~30 秒）...'))
  } else if (state.modal.error) {
    body.push(h('div', { class: 'modalError' }, state.modal.error))
  } else if (state.modal.data) {
    const d = state.modal.data
    const keywords = Array.isArray(d.keywords) ? d.keywords : []
    const hl = Array.isArray(d.highlights) ? d.highlights : []
    const cover = toAbs(d.coverUrl) || toAbs(d.externalCoverUrl)
    body.push(
      h('div', { class: 'modalContent' }, [
        h('div', { class: 'modalHero' }, [
          h('img', { class: 'modalCover', src: cover, alt: d.hookTitle || '' }),
          h('div', { class: 'modalHeroText' }, [
            h('div', { class: 'modalTitle' }, [
              textWithHighlights(d.hookTitle || d.originalTitle || '', keywords, 'hl'),
            ]),
            h('div', { class: 'modalSub' }, [
              h('span', { class: 'chip chipSoft' }, d.source || '来源'),
              ...hl.slice(0, 3).map((t) => h('span', { class: 'chip chipSoft' }, t)),
            ]),
            d.summary ? h('p', { class: 'modalSummary' }, d.summary) : null,
          ]),
        ]),
        d.psMarkdown ? renderPsMarkdown(d.psMarkdown, keywords) : null,
        Array.isArray(d.glossary) && d.glossary.length
          ? h('div', { class: 'glossary' }, [
              h('div', { class: 'sectionTitle' }, '术语小抄'),
              ...d.glossary.slice(0, 10).map((g) =>
                h('div', { class: 'glossaryItem' }, [
                  h('div', { class: 'glossaryTerm' }, String(g?.term || '')),
                  h('div', { class: 'glossaryExplain' }, String(g?.explain || '')),
                ]),
              ),
            ])
          : null,
        d.url
          ? h('a', { class: 'modalLink', href: d.url, target: '_blank', rel: 'noreferrer' }, '打开原文 →')
          : null,
      ]),
    )
  }

  return h('div', { class: 'modalMask', onClick: closeDetail }, [
    h('div', { class: 'modal', onClick: (e) => e.stopPropagation() }, [
      h('button', { class: 'modalClose', onClick: closeDetail, type: 'button' }, '×'),
      ...body,
    ]),
  ])
}

function render() {
  el.innerHTML = ''
  const sidebar = h('aside', { class: 'sidebar' }, [
    h('div', { class: 'brand brandSide' }, [
      h('div', { class: 'logo' }, 'Edu'),
      h('div', {}, [
        h('div', { class: 'brandName' }, '教育仓库'),
        h(
          'div',
          { class: 'brandSub' },
          state.stats
            ? `已生成 ${state.stats.done || 0} · 待处理 ${state.stats.pending || 0} · 错误 ${state.stats.error || 0}${
                state.stats.bgProcessing ? '（后台处理中…）' : ''
              }`
            : '科普卡片库（DB-first）',
        ),
      ]),
    ]),

    h('div', { class: 'sideBlock' }, [
      h('div', { class: 'sideTitle' }, '榜单'),
      h('div', { class: 'seg segSide' }, [
        ...[
          { k: 'all', t: '全部' },
          { k: 'main', t: '主榜' },
          { k: 'sub', t: '副榜' },
        ].map((it) =>
          h(
            'button',
            {
              class: `segBtn ${state.board === it.k ? 'active' : ''}`,
              type: 'button',
              onClick: () => {
                state.board = it.k
                loadFeed()
              },
            },
            it.t,
          ),
        ),
      ]),
    ]),

    h('div', { class: 'sideBlock' }, [
      h('div', { class: 'sideTitle' }, '搜索'),
      h('input', {
        class: 'search searchSide',
        value: state.q,
        placeholder: '搜：RAG / LoRA / Agent / 对齐 / 蒸馏…',
        onInput: (e) => (state.q = e.target.value),
        onKeydown: (e) => e.key === 'Enter' && loadFeed(),
      }),
      h('div', { class: 'sideBtns' }, [
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onClick: () => loadFeed(),
          },
          state.loading ? '加载中' : '刷新',
        ),
        h(
          'button',
          {
            class: 'btn btnSoft',
            type: 'button',
            onClick: () => backfillNow(),
            disabled: state.backfill.loading,
            title: '批量预生成科普文并写入数据库（后台异步处理）',
          },
          state.backfill.loading ? '预生成中…' : '预生成20条',
        ),
      ]),
      state.backfill.error ? h('div', { class: 'hint' }, `预生成失败：${state.backfill.error}`) : null,
    ]),

    h('div', { class: 'sideBlock' }, [
      h('div', { class: 'sideTitle' }, `筛选强度：${state.minScore.toFixed(1)}`),
      h('input', {
        class: 'range',
        type: 'range',
        min: '0',
        max: '8',
        step: '0.1',
        value: String(state.minScore),
        onInput: (e) => {
          state.minScore = Number(e.target.value)
          renderApp()
        },
        onChange: () => loadFeed(),
      }),
    ]),
  ])

  const main = h('main', { class: 'main mainRight' }, [])

  if (state.error) {
    main.appendChild(h('div', { class: 'error' }, `加载失败：${state.error}`))
  } else if (state.loading && (!state.list || state.list.length === 0)) {
    main.appendChild(h('div', { class: 'hint' }, '正在从教育仓库数据库加载...'))
  } else if (!state.loading && (!state.list || state.list.length === 0)) {
    main.appendChild(h('div', { class: 'hint' }, '数据库暂无内容：先点右上角「预生成20条」，把 Crawl 原文加工入库。'))
  }

  const sections = groupByTheme(state.list || [])
  for (const sec of sections) {
    const grid = h('section', { class: 'grid' }, [])
    for (const it of sec.items || []) grid.appendChild(Card(it))
    main.appendChild(
      h('section', { class: 'themeSection' }, [
        h('div', { class: 'themeHead' }, [
          h('div', { class: 'themeTitle' }, sec.name),
          h('div', { class: 'themeCount' }, `${(sec.items || []).length} 条`),
        ]),
        grid,
      ]),
    )
  }

  const canLoadMore = !state.loading && Array.isArray(state.list) && state.list.length >= Math.max(6, state.limit - 2)
  if (canLoadMore) {
    main.appendChild(
      h(
        'button',
        {
          class: 'btn loadMore',
          type: 'button',
          onClick: () => {
            state.limit = Math.min(120, Number(state.limit || 40) + 20)
            loadFeed()
          },
        },
        `加载更多（${state.limit} → ${Math.min(120, state.limit + 20)}）`,
      ),
    )
  }

  el.appendChild(h('div', { class: 'layout' }, [sidebar, main]))
  const modal = Modal()
  if (modal) el.appendChild(modal)
}

function ModalXhsOld() {
  if (!state.modal.open) return null

  const body = []
  if (state.modal.loading) {
    body.push(h('div', { class: 'modalLoading' }, '正在加载详情…'))
  } else if (state.modal.error) {
    body.push(h('div', { class: 'modalError' }, state.modal.error))
  } else if (state.modal.data) {
    const d = state.modal.data
    const title = String(d?.hookTitle || d?.originalTitle || '').trim()
    const keywords = getDisplayKeywords(d)
    const highlights = pickHighlightWords(keywords)
    const seedKey = `${String(d?.newsId || '').trim()}|${title}`

    const primaryTemplateId = pickTemplateId(seedKey)
    const cover = renderCoverDataUrl({
      templateId: primaryTemplateId,
      title,
      highlights,
      label: keywords?.[0] || '发现',
      size: 'full',
    })

    body.push(
      h('div', { class: 'modalContent' }, [
        h('div', { class: 'modalHero' }, [
          h('div', { class: 'modalHeroMedia' }, [
            h('img', { class: 'modalImg', src: cover, alt: title || 'EduRepo' }),
            (d.coverUrl || d.externalCoverUrl) && toAbs(d.coverUrl || d.externalCoverUrl)
              ? h(
                  'a',
                  {
                    class: 'modalOriginal',
                    href: toAbs(d.coverUrl || d.externalCoverUrl),
                    target: '_blank',
                    rel: 'noreferrer',
                  },
                  '查看原封面 →',
                )
              : null,
          ]),
          h('div', { class: 'modalHeroText' }, [
            keywords.length
              ? h(
                  'div',
                  { class: 'modalChips' },
                  keywords.slice(0, 12).map((t) => h('span', { class: 'chip chipSoft' }, String(t))),
                )
              : null,
            title ? h('div', { class: 'modalTitle' }, title) : null,
            h('div', { class: 'modalMeta' }, [
              h('span', { class: 'metaSource' }, String(d.source || '来源')),
              h('span', { class: 'metaDot' }, '·'),
              h('span', { class: 'metaTime' }, formatTime(d.publishedAt) || ''),
            ]),
            d.summary ? h('div', { class: 'modalSummary' }, String(d.summary)) : null,
          ]),
        ]),
        d.psMarkdown
          ? renderPsMarkdown(d.psMarkdown, keywords)
          : d.content
            ? renderMarkdown(String(d.content), keywords)
            : h('div', { class: 'hint' }, '（暂无正文内容）'),
        Array.isArray(d.glossary) && d.glossary.length
          ? h('div', { class: 'glossary' }, [
              h('div', { class: 'sectionTitle' }, '术语小抄'),
              ...d.glossary.slice(0, 10).map((g) =>
                h('div', { class: 'glossaryItem' }, [
                  h('div', { class: 'glossaryTerm' }, String(g?.term || '')),
                  h('div', { class: 'glossaryExplain' }, String(g?.explain || '')),
                ]),
              ),
            ])
          : null,
        d.url
          ? h('a', { class: 'modalLink', href: d.url, target: '_blank', rel: 'noreferrer' }, '打开原文 →')
          : null,
      ]),
    )
  }

  return h('div', { class: 'modalMask', onClick: closeDetail }, [
    h('div', { class: 'modal', onClick: (e) => e.stopPropagation() }, [
      h('button', { class: 'modalClose', onClick: closeDetail, type: 'button' }, '×'),
      ...body,
    ]),
  ])
}

function ModalXhsSkeleton() {
  const skLine = (w = 100, hPx = 12) => h('div', { class: 'skLine', style: `width:${w}%;height:${hPx}px` }, [])

  const makePsSkeleton = () =>
    h('section', { class: 'psBlock' }, [
      h('div', { class: 'psLabel' }, [skLine(22, 12)]),
      h('div', { class: 'md' }, [skLine(92), skLine(84), skLine(78)]),
    ])

  return h('div', { class: 'modalBody' }, [
    h('div', { class: 'detailLayout' }, [
      h('div', { class: 'detailLeft' }, [h('div', { class: 'detailMedia' }, [h('div', { class: 'skCover' }, [])])]),
        h('div', { class: 'detailRight' }, [
          h('div', { class: 'detailHeader' }, [
          h('div', { class: 'detailReadProgress detailReadProgressIndeterminate' }, [
            h('div', { class: 'detailReadProgressBar' }, []),
          ]),
          skLine(38, 12),
          skLine(78, 14),
          skLine(64, 12),
          skLine(92, 12),
        ]),
        h('div', { class: 'detailScroll' }, [makePsSkeleton(), makePsSkeleton(), makePsSkeleton()]),
      ]),
    ]),
  ])
}

function ModalXhsLegacy() {
  if (!state.modal.open) return null

  const body = []
  if (state.modal.loading) {
    body.push(ModalXhsSkeleton())
  } else if (state.modal.error) {
    body.push(h('div', { class: 'modalError' }, state.modal.error))
  } else if (state.modal.data) {
    const d = state.modal.data
    const title = String(d?.hookTitle || d?.originalTitle || '').trim()
    const keywords = getDisplayKeywords(d)
    const highlights = pickHighlightWords(keywords)
    const seedKey = `${String(d?.newsId || '').trim()}|${title}`

    const templateId = pickTemplateId(seedKey)
    const cover = renderCoverDataUrl({
      templateId,
      title,
      highlights,
      label: keywords?.[0] || '发现',
      size: 'full',
    })

    body.push(
      h('div', { class: 'modalContent' }, [
        h('div', { class: 'modalHero' }, [
          h('div', { class: 'modalHeroMedia' }, [
            h('img', { class: 'modalImg', src: cover, alt: title || 'EduRepo' }),
          ]),
          h('div', { class: 'modalHeroText' }, [
            keywords.length
              ? h(
                  'div',
                  { class: 'modalChips' },
                  keywords.slice(0, 12).map((t) => h('span', { class: 'chip chipSoft' }, String(t))),
                )
              : null,
            title ? h('div', { class: 'modalTitle' }, title) : null,
            h('div', { class: 'modalMeta' }, [
              h('span', { class: 'metaSource' }, String(d.source || '来源')),
              h('span', { class: 'metaDot' }, '·'),
              h('span', { class: 'metaTime' }, formatTime(d.publishedAt) || ''),
            ]),
            d.summary ? h('div', { class: 'modalSummary' }, String(d.summary)) : null,
          ]),
        ]),

        d.psMarkdown
          ? renderPsMarkdown(d.psMarkdown, keywords)
          : d.content
            ? renderMarkdown(String(d.content), keywords)
            : h('div', { class: 'hint' }, '（正文为空：请检查 DB 是否已写入 psMarkdown）'),

        Array.isArray(d.glossary) && d.glossary.length
          ? h('div', { class: 'glossary' }, [
              h('div', { class: 'sectionTitle' }, '术语小抄'),
              ...d.glossary.slice(0, 10).map((g) =>
                h('div', { class: 'glossaryItem' }, [
                  h('div', { class: 'glossaryTerm' }, String(g?.term || '')),
                  h('div', { class: 'glossaryExplain' }, String(g?.explain || '')),
                ]),
              ),
            ])
          : null,

        d.url ? h('a', { class: 'modalLink', href: d.url, target: '_blank', rel: 'noreferrer' }, '打开原文 →') : null,
      ]),
    )
  }

  return h('div', { class: 'modalMask', onClick: closeDetail }, [
    h('div', { class: 'modal', onClick: (e) => e.stopPropagation() }, [
      state.modal.loading ? h('div', { class: 'modalProgress' }, []) : null,
      h('button', { class: 'modalClose', onClick: closeDetail, type: 'button' }, '×'),
      ...body,
    ]),
  ])
}

function ModalXhs() {
  if (!state.modal.open) return null

  const body = []
  if (state.modal.loading) {
    body.push(ModalXhsSkeleton())
  } else if (state.modal.error) {
    body.push(h('div', { class: 'modalError' }, state.modal.error))
  } else if (state.modal.data) {
    const d = state.modal.data
    const title = String(d?.hookTitle || d?.originalTitle || '').trim()
    const keywords = getDisplayKeywords(d)
    const highlights = pickHighlightWords(keywords)
    const seedKey = `${String(d?.newsId || '').trim()}|${title}`

    const templateId = pickTemplateId(seedKey)
    const cover = renderCoverDataUrl({ templateId, title, highlights, label: keywords?.[0] || '发现', size: 'full' })

    const meta = h('div', { class: 'detailMeta' }, [
      h('span', { class: 'metaSource' }, String(d.source || '来源')),
      h('span', { class: 'metaDot' }, '·'),
      h('span', { class: 'metaTime' }, formatTime(d.publishedAt) || ''),
    ])

    // R1 + T2 + C2: no title in the text pane; chips come below meta.
    const chips =
      keywords.length > 0
        ? h(
            'div',
            { class: 'detailChips' },
            keywords.slice(0, 12).map((t) => h('span', { class: 'chip chipSoft' }, String(t))),
          )
        : null

    const summary = d.summary ? h('div', { class: 'detailSummary' }, String(d.summary)) : null

    const content = d.psMarkdown
      ? renderPsMarkdown(d.psMarkdown, keywords)
      : d.content
        ? renderMarkdown(String(d.content), keywords)
        : h('div', { class: 'hint' }, '（正文为空：请检查 DB 是否已写入 psMarkdown）')

    const glossary =
      Array.isArray(d.glossary) && d.glossary.length
        ? h('div', { class: 'glossary' }, [
            h('div', { class: 'sectionTitle' }, '术语小抄'),
            ...d.glossary.slice(0, 10).map((g) =>
              h('div', { class: 'glossaryItem' }, [
                h('div', { class: 'glossaryTerm' }, String(g?.term || '')),
                h('div', { class: 'glossaryExplain' }, String(g?.explain || '')),
              ]),
            ),
          ])
        : null

    const openLink = d.url ? h('a', { class: 'modalLink', href: d.url, target: '_blank', rel: 'noreferrer' }, '打开原文 →') : null

    const readProgressBar = h('div', { class: 'detailReadProgressBar' }, [])
    const readProgress = h('div', { class: 'detailReadProgress' }, [readProgressBar])

    const scroller = h(
      'div',
      {
        class: 'detailScroll',
        onScroll: (e) => updateReadProgress(e.currentTarget, readProgressBar),
      },
      [content, glossary, openLink].filter(Boolean),
    )
    setTimeout(() => updateReadProgress(scroller, readProgressBar), 0)

    body.push(
      h('div', { class: 'modalBody' }, [
        h('div', { class: 'detailLayout' }, [
          h('div', { class: 'detailLeft' }, [
            h('div', { class: 'detailMedia' }, [h('img', { class: 'detailImg', src: cover, alt: title || 'EduRepo' })]),
          ]),
          h('div', { class: 'detailRight' }, [
            h('div', { class: 'detailHeader' }, [readProgress, meta, chips, summary].filter(Boolean)),
            scroller,
          ]),
        ]),
      ]),
    )
  }

  return h('div', { class: 'modalMask', onClick: closeDetail }, [
    h('div', { class: 'modal', onClick: (e) => e.stopPropagation() }, [
      state.modal.loading ? h('div', { class: 'modalProgress' }, []) : null,
      h('button', { class: 'modalClose', onClick: closeDetail, type: 'button' }, '×'),
      ...body,
    ]),
  ])
}

function renderApp() {
  el.innerHTML = ''

  const sidebar = h('aside', { class: 'sidebar' }, [
    h('div', { class: 'brand' }, [
      h('div', { class: 'brandIcon' }, '📚'),
      h('div', { class: 'brandText' }, [
        h('div', { class: 'brandTitle' }, 'Education Repo'),
        h(
          'div',
          { class: 'brandSub' },
          state.stats
            ? `已生成 ${state.stats.done || 0} · 待处理 ${state.stats.pending || 0} · 错误 ${state.stats.error || 0}${
                state.stats.bgProcessing ? '（后台处理中…）' : ''
              }`
            : '教育仓库 · 小红书式浏览',
        ),
      ]),
    ]),
    h(
      'button',
      {
        class: 'navBtn navBtnActive',
        type: 'button',
        onClick: () => {
          state.q = ''
          state.limit = 40
          loadFeed()
        },
      },
      [h('span', { class: 'navIco' }, '⌂'), h('span', { class: 'navText' }, '发现')],
    ),
  ])

  const searchInput = h('input', {
    class: 'searchInput',
    value: state.q,
    placeholder: '搜索关键词：RAG / Agent / LoRA / 前端 / 论文…',
    onInput: (e) => {
      state.q = e.target.value
      scheduleSearch(e.currentTarget)
    },
    onKeydown: (e) => {
      if (e.key === 'Enter') {
        requestSearchFocus(e.currentTarget)
        searchNow()
      }
      if (e.key === 'Escape') {
        state.q = ''
        e.currentTarget.value = ''
        requestSearchFocus(e.currentTarget)
        searchNow()
      }
    },
  })

  const topbar = h('header', { class: 'topbar' }, [
    h('div', { class: 'topbarInner' }, [
      h('div', { class: 'searchBar' }, [
        h('span', { class: 'searchIcon', 'aria-hidden': 'true' }, '⌕'),
        searchInput,
        h(
          'button',
          {
            class: 'clearBtn',
            type: 'button',
            onClick: () => {
              state.q = ''
              searchInput.value = ''
              searchInput.focus()
              requestSearchFocus(searchInput)
              searchNow()
            },
            title: '清空',
          },
          '×',
        ),
      ]),
      h('div', { class: 'topActions' }, [
        h(
          'button',
          {
            class: 'btn btnPrimary',
            type: 'button',
            onClick: () => {
              requestSearchFocus(searchInput)
              searchNow()
            },
            disabled: state.loading,
          },
          state.loading ? '搜索中…' : '搜索',
        ),
        h(
          'button',
          {
            class: 'btn btnSoft',
            type: 'button',
            onClick: () => loadFeed(),
            disabled: state.loading,
          },
          state.loading ? '加载中…' : '刷新',
        ),
      ]),
    ]),
  ])

  const main = h('main', { class: 'content' }, [])
  if (state.error) {
    main.appendChild(h('div', { class: 'error' }, `加载失败：${state.error}`))
  } else if (state.loading && (!state.list || state.list.length === 0)) {
    main.appendChild(h('div', { class: 'hint' }, '正在加载内容…'))
  } else if (!state.loading && (!state.list || state.list.length === 0)) {
    main.appendChild(h('div', { class: 'hint' }, '暂无内容：试试搜索关键词，或先在后端导入/处理数据。'))
  }

  const feed = h('section', { class: 'feedMasonry' }, [])
  for (const it of state.list || []) feed.appendChild(XhsCard(it))
  main.appendChild(feed)

  const canLoadMore = !state.loading && Array.isArray(state.list) && state.list.length >= Math.max(6, state.limit - 2)
  main.appendChild(
    h('footer', { class: 'feedFooter' }, [
      h('div', { class: 'footerText' }, `已加载 ${Array.isArray(state.list) ? state.list.length : 0} 条`),
      h('div', { class: 'footerBtns' }, [
        canLoadMore
          ? h(
              'button',
              {
                class: 'btn btnPrimary',
                type: 'button',
                onClick: () => {
                  state.limit = Math.min(120, Number(state.limit || 40) + 20)
                  loadFeed()
                },
              },
              `加载更多（${state.limit} → ${Math.min(120, state.limit + 20)}）`,
            )
          : h('div', { class: 'footerHint' }, state.loading ? '加载中…' : '已到底'),
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
          },
          '回到顶部',
        ),
      ]),
    ]),
  )

  el.appendChild(h('div', { class: 'appShell' }, [sidebar, h('div', { class: 'mainArea' }, [topbar, main])]))
  const modal = ModalXhs()
  if (modal) el.appendChild(modal)

  if (keepSearchFocus) {
    const sel = keepSearchSelection
    keepSearchFocus = false
    keepSearchSelection = null
    setTimeout(() => {
      try {
        searchInput.focus()
        if (sel && typeof searchInput.setSelectionRange === 'function') searchInput.setSelectionRange(sel.start, sel.end)
      } catch {
        // ignore focus errors
      }
    }, 0)
  }
}

// Preferred UTF-8 strings for psMarkdown splitting/labels (backend is expected to store these headings).
const PS_REQUIRED_H2_CN = [
  '这件事在讲什么（一句话 + 3~5 句解释）',
  '为什么重要（和你有什么关系）（讲影响/应用/避免误解）',
  '用一个例子讲说明白（生活化类比/场景）',
  '你可以怎么开始（3条可执行建议）（必须 3 条- 列表）',
]
const PS_LABELS_CN = ['讲什么', '为什么重要', '举个例子', '怎么开始']

renderApp()
// Warm fonts so Canvas covers match Pencil-like typography; then re-render covers with correct fonts.
warmupCoverFonts().then(() => {
  clearCoverCache()
  renderApp()
})

loadFeed()
loadStats()
