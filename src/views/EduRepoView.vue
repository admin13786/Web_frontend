<template>
  <div class="edurepo-view">
    <div v-if="isEmbedMode" class="edurepo-shell">
      <div v-if="embedLoadState === 'error'" class="edurepo-fallback">
        <h2>当前页面暂时无法稳定加载 EduRepo</h2>
        <p>当前为兼容嵌入模式，请确认 EduRepo 前端服务可访问。</p>
        <div class="edurepo-actions">
          <a
            class="edurepo-link"
            :href="edurepoUrl"
            target="_blank"
            rel="noreferrer noopener"
          >
            直接打开 EduRepo
          </a>
          <button type="button" class="edurepo-link edurepo-link--secondary" @click="reloadFrame">
            重新尝试
          </button>
        </div>
      </div>

      <iframe
        v-else
        :key="frameKey"
        class="edurepo-frame"
        :src="edurepoUrl"
        title="EduRepo"
        @load="handleEmbedLoad"
      />
    </div>

    <div v-else class="edurepo-layout">
      <aside class="edurepo-sidebar">
        <div class="edurepo-brand">
          <div class="edurepo-logo">02</div>
          <div class="edurepo-brand-copy">
            <span class="edurepo-brand-kicker">ARCHIVE DESK</span>
            <div class="edurepo-brand-title">EduRepo 资料馆</div>
            <div class="edurepo-brand-sub">{{ statsText }}</div>
          </div>
        </div>

        <div class="sidebar-note">
          <span class="panel-kicker">CURATION NOTE</span>
          <p>把教育类 AI 内容整理成轻档案，方便浏览、拆解和回看。</p>
        </div>

        <div class="panel-block">
          <div class="panel-head">
            <span class="panel-kicker">BOARD</span>
            <div class="panel-title">榜单视角</div>
          </div>
          <div class="segment-row">
            <button
              v-for="item in boardOptions"
              :key="item.key"
              type="button"
              class="seg-btn"
              :class="{ 'seg-btn--active': board === item.key }"
              @click="changeBoard(item.key)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="panel-block">
          <div class="panel-head">
            <span class="panel-kicker">SEARCH</span>
            <div class="panel-title">关键词筛选</div>
          </div>
          <input
            v-model="searchText"
            class="search-input"
            type="text"
            placeholder="搜：RAG / LoRA / Agent / 对齐 / 蒸馏…"
            @keydown.enter.prevent="refreshNow"
          />
          <div class="action-row">
            <button type="button" class="action-btn" :disabled="loading" @click="refreshNow">
              {{ loading ? '加载中…' : '刷新内容' }}
            </button>
            <button
              type="button"
              class="action-btn action-btn--soft"
              :disabled="backfillLoading"
              @click="backfillNow"
            >
              {{ backfillLoading ? '预生成中…' : '预生成 20 条' }}
            </button>
          </div>
          <div v-if="backfillError" class="panel-hint panel-hint--error">预生成失败：{{ backfillError }}</div>
        </div>

        <div class="panel-block panel-block--last">
          <div class="panel-head">
            <span class="panel-kicker">INTENSITY</span>
            <div class="panel-title">筛选强度 {{ minScore.toFixed(1) }}</div>
          </div>
          <input
            v-model.number="minScore"
            class="range-input"
            type="range"
            min="0"
            max="8"
            step="0.1"
            @change="refreshNow"
          />
        </div>
      </aside>

      <main class="edurepo-main">
        <header class="edurepo-masthead">
          <div class="edurepo-masthead__copy">
            <span class="edurepo-masthead__kicker">LINGJING / ARCHIVE READER</span>
            <h1 class="edurepo-masthead__title">把 AI 教育内容，整理成一张能翻阅的资料桌。</h1>
            <p class="edurepo-masthead__desc">
              左侧是筛选与索引，右侧是今日正在展开的档案页。每张卡片都可以继续打开，进入更适合阅读的正文面。
            </p>
          </div>

          <div class="edurepo-masthead__stats">
            <div
              v-for="item in overviewStats"
              :key="item.label"
              class="masthead-stat"
            >
              <span class="masthead-stat__label">{{ item.label }}</span>
              <strong class="masthead-stat__value">{{ item.value }}</strong>
            </div>
          </div>
        </header>

        <div v-if="loadError" class="state-card state-card--error">加载失败：{{ loadError }}</div>
        <div v-else-if="loading && !feedList.length" class="state-card">正在从教育仓库加载内容…</div>
        <div v-else-if="!loading && !feedList.length" class="state-card">
          数据库暂无可展示内容。先点左侧「预生成 20 条」，把 Crawl 原文加工入库。
        </div>

        <section
          v-for="(section, sectionIndex) in groupedSections"
          :key="section.name"
          class="theme-section"
        >
          <header class="theme-header">
            <div class="theme-header__main">
              <div class="theme-index">{{ formatSectionIndex(sectionIndex) }}</div>
              <div>
                <span class="theme-kicker">DOSSIER</span>
                <h2 class="theme-title">{{ section.name }}</h2>
              </div>
            </div>
            <div class="theme-count">{{ section.items.length }} 条</div>
          </header>

          <div class="card-grid">
            <article
              v-for="item in section.items"
              :key="item.newsId"
              class="ed-card"
              @click="openDetail(item.newsId)"
            >
              <div class="ed-card__cover-wrap">
                <img
                  v-if="coverOf(item)"
                  class="ed-card__cover"
                  :src="coverOf(item)"
                  :alt="item.hookTitle || item.originalTitle || 'EduRepo Cover'"
                  loading="lazy"
                  @error="handleImageError"
                />
                <div v-else class="ed-card__cover-placeholder">暂无封面</div>
              </div>

              <div class="ed-card__body">
                <div class="ed-card__eyebrow">
                  <span>{{ item.source || '资料来源' }}</span>
                  <span>{{ formatTime(item.publishedAt) }}</span>
                </div>

                <h3
                  class="ed-card__title"
                  v-html="renderInlineHtml(item.hookTitle || item.originalTitle || '', item.keywords, 'hl')"
                />

                <p
                  v-if="item.summary"
                  class="ed-card__summary"
                  v-html="renderInlineHtml(item.summary, item.keywords, 'kw')"
                />

                <div class="ed-card__chips">
                  <span
                    v-for="(chip, idx) in (Array.isArray(item.keywords) ? item.keywords : []).slice(0, 3)"
                    :key="`${item.newsId}-chip-${chip}`"
                    class="chip"
                    :class="`chip--${idx + 1}`"
                  >
                    {{ chip }}
                  </span>
                </div>

                <div class="ed-card__foot">
                  <span class="ed-card__cta">打开档案</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <button
          v-if="canLoadMore"
          type="button"
          class="load-more-btn"
          @click="loadMore"
        >
          继续展开（{{ limit }} → {{ Math.min(120, limit + 20) }}）
        </button>
      </main>

      <div v-if="modalOpen" class="modal-mask" @click="closeDetail">
        <div class="modal-panel" @click.stop>
          <button type="button" class="modal-close" @click="closeDetail">×</button>

          <div v-if="modalLoading" class="modal-state">正在加载科普详情…</div>
          <div v-else-if="modalError" class="modal-state modal-state--error">{{ modalError }}</div>
          <template v-else-if="modalData">
            <div class="modal-hero">
              <img
                v-if="coverOf(modalData)"
                class="modal-cover"
                :src="coverOf(modalData)"
                :alt="modalData.hookTitle || modalData.originalTitle || 'cover'"
                @error="handleImageError"
              />

              <div class="modal-hero-copy">
                <span class="modal-overline">ARCHIVE NOTE · {{ formatTime(modalData.publishedAt) }}</span>
                <h3
                  class="modal-title"
                  v-html="renderInlineHtml(modalData.hookTitle || modalData.originalTitle || '', modalKeywords, 'hl')"
                />
                <div class="modal-chips">
                  <span class="chip chip--soft">{{ modalData.source || '来源' }}</span>
                  <span
                    v-for="chip in (Array.isArray(modalData.highlights) ? modalData.highlights : []).slice(0, 3)"
                    :key="`detail-hl-${chip}`"
                    class="chip chip--soft"
                  >
                    {{ chip }}
                  </span>
                </div>
                <p v-if="modalData.summary" class="modal-summary">{{ modalData.summary }}</p>
              </div>
            </div>

            <div class="ps-wrapper">
              <section
                v-for="(section, sectionIndex) in modalSections"
                :key="`ps-section-${sectionIndex}-${section.label || 'raw'}`"
                class="ps-block"
              >
                <div v-if="section.label" class="ps-label">{{ section.label }}</div>

                <div class="md-renderer">
                  <template
                    v-for="(block, blockIndex) in section.blocks"
                    :key="`ps-block-${sectionIndex}-${blockIndex}`"
                  >
                    <h2
                      v-if="block.type === 'h2'"
                      class="md-h2"
                      v-html="renderInlineHtml(block.text, modalKeywords, 'kw')"
                    />
                    <h3
                      v-else-if="block.type === 'h3'"
                      class="md-h3"
                      v-html="renderInlineHtml(block.text, modalKeywords, 'kw')"
                    />
                    <blockquote
                      v-else-if="block.type === 'blockquote'"
                      class="md-quote"
                      v-html="renderInlineMultilineHtml(block.text, modalKeywords, 'kw')"
                    />
                    <ul v-else-if="block.type === 'ul'" class="md-ul">
                      <li
                        v-for="(line, lineIndex) in block.items"
                        :key="`ps-ul-${sectionIndex}-${blockIndex}-${lineIndex}`"
                        v-html="renderInlineHtml(line, modalKeywords, 'kw')"
                      />
                    </ul>
                    <p
                      v-else
                      class="md-p"
                      v-html="renderInlineMultilineHtml(block.text, modalKeywords, 'kw')"
                    />
                  </template>
                </div>
              </section>
            </div>

            <section
              v-if="Array.isArray(modalData.glossary) && modalData.glossary.length"
              class="glossary"
            >
              <h4 class="glossary-title">术语小抄</h4>
              <div
                v-for="(item, idx) in modalData.glossary.slice(0, 10)"
                :key="`glossary-${idx}`"
                class="glossary-item"
              >
                <div class="glossary-term">{{ item?.term || '' }}</div>
                <div class="glossary-explain">{{ item?.explain || '' }}</div>
              </div>
            </section>

            <a
              v-if="modalData.url"
              class="origin-link"
              :href="modalData.url"
              target="_blank"
              rel="noreferrer noopener"
            >
              打开原文 →
            </a>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getEduRepoAppUrl, isEduRepoEmbedMode } from '../config.js'
import {
  getEduFeed,
  getEduItem,
  getEduStats,
  postEduBackfill,
} from '../api/edurepo.js'

const isEmbedMode = isEduRepoEmbedMode()
const edurepoUrl = getEduRepoAppUrl()

const frameKey = ref(0)
const embedLoadState = ref('loading')
let embedLoadTimer = 0

const board = ref('all')
const searchText = ref('')
const minScore = ref(1.4)
const limit = ref(40)
const feedList = ref([])
const loading = ref(false)
const loadError = ref('')

const stats = ref(null)
let statsTimer = 0

const backfillLoading = ref(false)
const backfillError = ref('')
const refreshTimers = []

const modalOpen = ref(false)
const modalLoading = ref(false)
const modalError = ref('')
const modalData = ref(null)

const FALLBACK_COVER = '/favicon.svg'

const boardOptions = [
  { key: 'all', label: '全部' },
  { key: 'main', label: '主榜' },
  { key: 'sub', label: '副榜' },
]

const REQUIRED_H2 = [
  '这件事在讲什么（一句话 + 3~5 句解释）',
  '为什么重要（和你有什么关系）（讲影响/应用/避免误解）',
  '用一个例子讲明白（生活化类比/场景）',
  '你可以怎么开始（3条可执行建议）（必须 3 条 - 列表）',
]

const PS_LABELS = ['讲什么', '为什么重要', '举个例子', '怎么开始']

const statsText = computed(() => {
  const data = stats.value
  if (!data) return '科普卡片库（主站原生版）'
  const done = Number(data.done || 0)
  const pending = Number(data.pending || 0)
  const error = Number(data.error || 0)
  const suffix = data.bgProcessing ? '（后台处理中…）' : ''
  return `已生成 ${done} · 待处理 ${pending} · 错误 ${error}${suffix}`
})

const modalKeywords = computed(() => {
  if (!modalData.value || !Array.isArray(modalData.value.keywords)) return []
  return modalData.value.keywords
})

const groupedSections = computed(() => groupByTheme(feedList.value))

const canLoadMore = computed(
  () => !loading.value && Array.isArray(feedList.value) && feedList.value.length >= Math.max(6, limit.value - 2),
)

const overviewStats = computed(() => {
  const currentBoard = boardOptions.find((item) => item.key === board.value)?.label || '全部'
  return [
    { label: '栏目', value: formatCount(groupedSections.value.length) },
    { label: '卡片', value: formatCount(feedList.value.length) },
    { label: '视角', value: currentBoard },
  ]
})

const modalSections = computed(() => {
  const raw = String(modalData.value?.psMarkdown || '').trim()
  if (!raw) return []

  const structured = splitPsMarkdown(raw)
  if (structured) {
    return structured.map((item) => ({
      label: item.label,
      blocks: parseMarkdownBlocks(item.body),
    }))
  }

  return [{ label: '', blocks: parseMarkdownBlocks(raw) }]
})

function formatCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value ?? '')
  return String(n).padStart(2, '0')
}

function formatSectionIndex(index) {
  return String(index + 1).padStart(2, '0')
}

function clearEmbedTimer() {
  if (typeof window === 'undefined') return
  window.clearTimeout(embedLoadTimer)
}

function resetEmbedTimeout() {
  if (typeof window === 'undefined') return
  clearEmbedTimer()
  embedLoadTimer = window.setTimeout(() => {
    if (embedLoadState.value === 'loading') {
      embedLoadState.value = 'error'
    }
  }, 5000)
}

function reloadFrame() {
  embedLoadState.value = 'loading'
  frameKey.value += 1
  resetEmbedTimeout()
}

function handleEmbedLoad() {
  embedLoadState.value = 'ready'
  clearEmbedTimer()
}

function clearStatsTimer() {
  if (typeof window === 'undefined') return
  window.clearTimeout(statsTimer)
  statsTimer = 0
}

function clearRefreshTimers() {
  if (typeof window === 'undefined') return
  while (refreshTimers.length) {
    const timer = refreshTimers.pop()
    window.clearTimeout(timer)
  }
}

function scheduleFeedRefresh() {
  if (typeof window === 'undefined') return
  clearRefreshTimers()
  ;[1500, 3500, 7000].forEach((ms) => {
    const timer = window.setTimeout(() => {
      loadFeed({ silentStats: true })
    }, ms)
    refreshTimers.push(timer)
  })
}

async function loadStats() {
  try {
    const data = await getEduStats({ timeoutMs: 8000 })
    stats.value = data?.stats || null
  } catch {
    // best-effort
  } finally {
    clearStatsTimer()
    if (stats.value?.bgProcessing && typeof window !== 'undefined') {
      statsTimer = window.setTimeout(() => {
        loadStats()
      }, 2200)
    }
  }
}

async function loadFeed({ silentStats = false } = {}) {
  loading.value = true
  loadError.value = ''
  if (!silentStats) loadStats()

  try {
    const data = await getEduFeed({
      limit: limit.value,
      board: board.value,
      q: searchText.value.trim(),
      minScore: minScore.value,
      timeoutMs: 18000,
    })
    feedList.value = Array.isArray(data?.list) ? data.list : []
  } catch (error) {
    loadError.value = error?.message || '加载失败'
    feedList.value = []
  } finally {
    loading.value = false
  }
}

function refreshNow() {
  loadFeed()
}

function changeBoard(nextBoard) {
  if (!nextBoard || nextBoard === board.value) return
  board.value = nextBoard
  limit.value = 40
  loadFeed()
}

function loadMore() {
  limit.value = Math.min(120, Number(limit.value || 40) + 20)
  loadFeed({ silentStats: true })
}

async function backfillNow() {
  backfillLoading.value = true
  backfillError.value = ''

  try {
    await postEduBackfill({
      limit: Math.min(20, Math.max(10, Number(limit.value || 20))),
      board: board.value,
      q: searchText.value.trim(),
      minScore: minScore.value,
      asyncMode: 1,
      timeoutMs: 30000,
    })
    await loadFeed({ silentStats: true })
    loadStats()
    scheduleFeedRefresh()
  } catch (error) {
    backfillError.value = error?.message || '请求失败'
  } finally {
    backfillLoading.value = false
  }
}

async function openDetail(newsId) {
  modalOpen.value = true
  modalLoading.value = true
  modalError.value = ''
  modalData.value = null

  try {
    const data = await getEduItem(newsId, { timeoutMs: 18000 })
    if (!data?.success) {
      throw new Error(data?.message || '详情加载失败')
    }
    modalData.value = data.data || null
  } catch (error) {
    modalError.value = error?.message || '详情加载失败'
  } finally {
    modalLoading.value = false
  }
}

function closeDetail() {
  modalOpen.value = false
  modalLoading.value = false
  modalError.value = ''
  modalData.value = null
}

function coverOf(item) {
  const url = String(item?.coverUrl || item?.externalCoverUrl || '').trim()
  if (!url) return ''
  return url
}

function handleImageError(event) {
  if (!event?.target) return
  if (event.target.dataset.fallbackApplied === '1') return
  event.target.dataset.fallbackApplied = '1'
  event.target.src = FALLBACK_COVER
}

function formatTime(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  return value.replace('T', ' ').replace('Z', '')
}

function deriveTheme(item) {
  const title = String(item?.hookTitle || item?.originalTitle || '').toLowerCase()
  const keywords = (Array.isArray(item?.keywords) ? item.keywords : []).map((entry) => String(entry || '').toLowerCase())
  const blob = `${title}\n${keywords.join(' ')}`

  const has = (...words) => words.some((word) => blob.includes(String(word).toLowerCase()))

  if (has('rag', '检索', '向量', 'embedding', '召回')) return '检索 / RAG'
  if (has('agent', '智能体', '工具调用', 'workflow', '多代理')) return 'Agent / 工作流'
  if (has('lora', '微调', 'finetune', 'sft', 'dpo', '对齐', '训练')) return '训练 / 对齐'
  if (has('推理', '部署', '量化', '蒸馏', 'latency', '吞吐')) return '推理 / 部署'
  if (has('多模态', 'vision', '图像', '语音', '视频')) return '多模态'
  return '通用科普'
}

function groupByTheme(list) {
  const groups = new Map()
  ;(Array.isArray(list) ? list : []).forEach((item) => {
    const key = deriveTheme(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })

  const order = ['检索 / RAG', 'Agent / 工作流', '训练 / 对齐', '推理 / 部署', '多模态', '通用科普']
  const result = []

  order.forEach((name) => {
    const items = groups.get(name)
    if (items?.length) result.push({ name, items })
  })

  groups.forEach((items, name) => {
    if (!order.includes(name)) {
      result.push({ name, items })
    }
  })

  return result
}

function pickHighlightWords(keywords = []) {
  const list = (Array.isArray(keywords) ? keywords : [])
    .map((item) => String(item || '').trim())
    .filter((item) => item.length >= 2 && item.length <= 12)
    .filter((item) => !/^[0-9]+$/.test(item))

  const unique = []
  for (const item of list) {
    if (!unique.includes(item)) unique.push(item)
    if (unique.length >= 3) break
  }
  return unique
}

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightSegments(text, keywords = []) {
  const content = String(text || '')
  const words = pickHighlightWords(keywords)
  if (!content || words.length === 0) {
    return [{ text: content, hit: false }]
  }

  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(escaped.join('|'), 'giu')

  const parts = []
  let last = 0
  let matched = false

  for (const match of content.matchAll(re)) {
    const start = match.index ?? -1
    if (start < 0) continue
    if (start > last) {
      parts.push({ text: content.slice(last, start), hit: false })
    }
    parts.push({ text: match[0], hit: true })
    last = start + match[0].length
    matched = true
  }

  if (!matched) return [{ text: content, hit: false }]
  if (last < content.length) {
    parts.push({ text: content.slice(last), hit: false })
  }

  return parts
}

function highlightTextToHtml(text, keywords = [], className = 'kw') {
  const segments = highlightSegments(text, keywords)
  return segments
    .map((segment) => {
      const safe = escapeHtml(segment.text)
      return segment.hit ? `<span class="${className}">${safe}</span>` : safe
    })
    .join('')
}

function renderInlineHtml(text, keywords = [], className = 'kw') {
  const source = String(text || '')
  if (!source) return ''

  const re = /\*\*(.+?)\*\*/g
  const chunks = []
  let last = 0

  for (const match of source.matchAll(re)) {
    const start = match.index ?? -1
    if (start < 0) continue
    if (start > last) {
      chunks.push(highlightTextToHtml(source.slice(last, start), keywords, className))
    }
    chunks.push(`<strong>${highlightTextToHtml(match[1], keywords, className)}</strong>`)
    last = start + match[0].length
  }

  if (last < source.length) {
    chunks.push(highlightTextToHtml(source.slice(last), keywords, className))
  }

  if (!chunks.length) {
    return highlightTextToHtml(source, keywords, className)
  }

  return chunks.join('')
}

function renderInlineMultilineHtml(text, keywords = [], className = 'kw') {
  return String(text || '')
    .split('\n')
    .map((line) => renderInlineHtml(line, keywords, className))
    .join('<br />')
}

function parseMarkdownBlocks(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const raw = String(lines[index] || '').trimEnd()
    const trimmed = raw.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() })
      index += 1
      continue
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() })
      index += 1
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines = []
      while (index < lines.length && String(lines[index] || '').trim().startsWith('> ')) {
        quoteLines.push(String(lines[index] || '').trim().slice(2))
        index += 1
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n').trim() })
      continue
    }

    if (trimmed.startsWith('- ')) {
      const items = []
      while (index < lines.length && String(lines[index] || '').trim().startsWith('- ')) {
        items.push(String(lines[index] || '').trim().slice(2).trim())
        index += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    const paragraph = [trimmed]
    index += 1
    while (index < lines.length) {
      const next = String(lines[index] || '').trim()
      if (!next) break
      if (/^(## |### |> |- )/.test(next)) break
      paragraph.push(next)
      index += 1
    }
    blocks.push({ type: 'p', text: paragraph.join(' ') })
  }

  return blocks
}

function splitPsMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  const indexes = []

  for (const heading of REQUIRED_H2) {
    const target = `## ${heading}`
    const idx = lines.findIndex((line) => String(line || '').trim() === target)
    if (idx < 0) return null
    indexes.push(idx)
  }

  for (let i = 1; i < indexes.length; i += 1) {
    if (indexes[i] <= indexes[i - 1]) return null
  }

  return indexes.map((idx, i) => {
    const start = idx + 1
    const end = i + 1 < indexes.length ? indexes[i + 1] : lines.length
    return {
      label: PS_LABELS[i] || '',
      body: lines.slice(start, end).join('\n').trim(),
    }
  })
}

onMounted(() => {
  if (isEmbedMode) {
    resetEmbedTimeout()
    return
  }

  loadFeed()
  loadStats()
})

onBeforeUnmount(() => {
  clearEmbedTimer()
  clearStatsTimer()
  clearRefreshTimers()
})
</script>

<style scoped>
.edurepo-view {
  min-height: 100%;
}

.edurepo-shell {
  min-height: calc(100vh - 48px);
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  background: var(--bg-card);
  box-shadow: var(--shadow-card), var(--shadow-inset);
}

.edurepo-frame {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 48px);
  border: none;
  background: #fff;
}

.edurepo-fallback {
  min-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: var(--text-secondary);
  padding: 24px;
}

.edurepo-fallback h2 {
  color: var(--text-primary);
}

.edurepo-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.edurepo-link {
  border: 1px solid rgba(196, 106, 45, 0.24);
  background: rgba(255, 245, 231, 0.9);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 999px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 700;
}

.edurepo-link--secondary {
  background: var(--bg-muted);
  border-color: var(--border-soft);
}

.edurepo-layout {
  min-height: calc(100vh - 48px);
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 22px;
}

.edurepo-sidebar {
  border-radius: 30px;
  border: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(244, 235, 223, 0.92));
  box-shadow: var(--shadow-card), var(--shadow-inset);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 0;
  height: fit-content;
}

.edurepo-brand {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(124, 98, 74, 0.12);
}

.edurepo-logo {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-display);
  font-size: 1.06rem;
  font-weight: 700;
  color: var(--text-contrast);
  background: linear-gradient(180deg, var(--support-burgundy), #b36b38);
  box-shadow: 0 16px 28px rgba(141, 70, 55, 0.18);
}

.edurepo-brand-copy {
  min-width: 0;
}

.edurepo-brand-kicker,
.panel-kicker,
.theme-kicker,
.edurepo-masthead__kicker,
.modal-overline {
  font-family: var(--font-family-mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.edurepo-brand-kicker,
.panel-kicker,
.theme-kicker {
  font-size: 0.64rem;
  color: var(--kicker-color);
}

.edurepo-brand-title {
  margin-top: 6px;
  font-family: var(--font-family-display);
  font-size: 1.34rem;
  line-height: 1.04;
}

.edurepo-brand-sub {
  margin-top: 7px;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.sidebar-note {
  padding: 15px 16px;
  border-radius: 22px;
  border: 1px solid rgba(124, 98, 74, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(247, 239, 229, 0.9));
  box-shadow: var(--shadow-inset);
}

.sidebar-note p {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.75;
}

.panel-block {
  padding: 15px 16px;
  border-radius: 22px;
  border: 1px solid rgba(124, 98, 74, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(247, 239, 229, 0.9));
  box-shadow: var(--shadow-inset);
}

.panel-block--last {
  margin-bottom: 0;
}

.panel-head {
  margin-bottom: 10px;
}

.panel-title {
  margin-top: 8px;
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text-primary);
}

.segment-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.seg-btn {
  border: 1px solid rgba(124, 98, 74, 0.14);
  background: rgba(255, 252, 247, 0.82);
  color: var(--text-secondary);
  border-radius: 14px;
  padding: 10px 0;
  cursor: pointer;
  font-weight: 700;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}

.seg-btn:hover,
.seg-btn:focus-visible {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  outline: none;
}

.seg-btn--active {
  background: linear-gradient(180deg, rgba(255, 246, 233, 0.98), rgba(247, 229, 209, 0.94));
  border-color: rgba(196, 106, 45, 0.28);
  color: var(--text-primary);
}

.search-input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(124, 98, 74, 0.14);
  background: var(--bg-input);
  color: var(--text-primary);
  padding: 12px 14px;
  box-shadow: var(--shadow-inset);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: rgba(196, 106, 45, 0.32);
  box-shadow: 0 0 0 4px rgba(196, 106, 45, 0.1);
}

.action-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 10px;
}

.action-btn {
  border-radius: 16px;
  border: 1px solid rgba(196, 106, 45, 0.22);
  background: rgba(255, 244, 230, 0.88);
  color: var(--text-primary);
  padding: 12px 14px;
  cursor: pointer;
  font-weight: 700;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(196, 106, 45, 0.34);
  background: rgba(255, 239, 219, 0.96);
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.action-btn--soft {
  border-color: rgba(111, 123, 92, 0.24);
}

.panel-hint {
  margin-top: 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.panel-hint--error {
  color: var(--danger);
}

.range-input {
  width: 100%;
  accent-color: var(--accent);
}

.edurepo-main {
  min-width: 0;
  border-radius: 34px;
  border: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.99), rgba(247, 239, 229, 0.92));
  box-shadow: var(--shadow-card), var(--shadow-inset);
  padding: 24px;
}

.edurepo-masthead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(124, 98, 74, 0.14);
}

.edurepo-masthead__copy {
  max-width: 56ch;
}

.edurepo-masthead__kicker {
  display: inline-flex;
  font-size: 0.7rem;
  color: var(--kicker-color);
}

.edurepo-masthead__title {
  margin: 12px 0 0;
  font-family: var(--font-family-display);
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  max-width: 12ch;
}

.edurepo-masthead__desc {
  margin-top: 16px;
  color: var(--text-secondary);
  line-height: 1.85;
  font-size: 0.96rem;
}

.edurepo-masthead__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.masthead-stat {
  min-width: 112px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(124, 98, 74, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(247, 239, 229, 0.9));
  box-shadow: var(--shadow-inset);
}

.masthead-stat__label {
  display: block;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.masthead-stat__value {
  display: block;
  margin-top: 6px;
  font-family: var(--font-family-display);
  font-size: 1.2rem;
  color: var(--text-primary);
}

.state-card {
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px dashed rgba(124, 98, 74, 0.18);
  color: var(--text-secondary);
  margin-bottom: 16px;
  background: rgba(255, 252, 247, 0.62);
}

.state-card--error {
  border-color: var(--danger-border);
  color: var(--danger);
  background: rgba(255, 245, 243, 0.9);
}

.theme-section + .theme-section {
  margin-top: 24px;
}

.theme-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.theme-header__main {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.theme-index {
  width: 48px;
  min-width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-display);
  font-size: 1.06rem;
  color: var(--accent);
  background: rgba(255, 245, 231, 0.92);
  border: 1px solid rgba(196, 106, 45, 0.16);
}

.theme-kicker {
  display: inline-flex;
  margin-bottom: 6px;
}

.theme-title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.54rem;
  line-height: 1.04;
}

.theme-count {
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.ed-card {
  border-radius: 22px;
  border: 1px solid rgba(124, 98, 74, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.99), rgba(247, 239, 229, 0.92));
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.ed-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover), var(--shadow-inset);
  border-color: var(--border-strong);
}

.ed-card__cover-wrap {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--bg-muted);
}

.ed-card__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ed-card__cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.ed-card__body {
  padding: 16px;
}

.ed-card__eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.ed-card__title {
  margin-top: 12px;
  font-size: 1.04rem;
  line-height: 1.55;
  color: var(--text-primary);
}

.ed-card__summary {
  margin-top: 10px;
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ed-card__chips {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-primary);
  background: rgba(255, 245, 231, 0.9);
  border: 1px solid rgba(124, 98, 74, 0.12);
}

.chip--1 {
  background: rgba(196, 106, 45, 0.12);
}

.chip--2 {
  background: rgba(111, 123, 92, 0.14);
}

.chip--3,
.chip--soft {
  background: rgba(141, 70, 55, 0.1);
}

.ed-card__foot {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.ed-card__cta {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
}

.load-more-btn {
  margin-top: 18px;
  width: 100%;
  border-radius: 18px;
  border: 1px dashed rgba(196, 106, 45, 0.32);
  background: rgba(255, 249, 240, 0.92);
  color: var(--accent-strong);
  padding: 14px 16px;
  cursor: pointer;
  font-weight: 700;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: var(--bg-overlay);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.modal-panel {
  width: min(980px, 100%);
  max-height: calc(100vh - 36px);
  overflow: auto;
  border-radius: 28px;
  border: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.99), rgba(247, 239, 229, 0.94));
  box-shadow: var(--shadow-hover), var(--shadow-inset);
  padding: 20px;
  position: relative;
}

.modal-close {
  position: sticky;
  top: 0;
  margin-left: auto;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(124, 98, 74, 0.14);
  background: rgba(255, 252, 247, 0.92);
  color: var(--text-primary);
  cursor: pointer;
  z-index: 2;
  box-shadow: var(--shadow-inset);
}

.modal-state {
  padding: 18px;
  text-align: center;
  color: var(--text-secondary);
}

.modal-state--error {
  color: var(--danger);
}

.modal-hero {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  align-items: start;
  margin-top: 8px;
}

.modal-cover {
  width: 100%;
  border-radius: 20px;
  border: 1px solid rgba(124, 98, 74, 0.12);
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.modal-overline {
  display: inline-flex;
  font-size: 0.66rem;
  color: var(--kicker-color);
}

.modal-title {
  margin-top: 12px;
  font-family: var(--font-family-display);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  line-height: 1.08;
  color: var(--text-primary);
}

.modal-chips {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-summary {
  margin-top: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.ps-wrapper {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ps-block,
.glossary {
  border-radius: 22px;
  border: 1px solid rgba(124, 98, 74, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(247, 239, 229, 0.88));
  padding: 16px;
}

.ps-label {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.74rem;
  color: var(--accent-strong);
  background: rgba(255, 245, 231, 0.92);
  border: 1px solid rgba(196, 106, 45, 0.16);
  margin-bottom: 10px;
}

.md-renderer {
  color: var(--text-secondary);
  line-height: 1.82;
}

.md-renderer :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}

.md-h2,
.md-h3 {
  color: var(--text-primary);
}

.md-h2 {
  margin-bottom: 10px;
  font-size: 1.12rem;
}

.md-h3 {
  margin-bottom: 8px;
  font-size: 1rem;
}

.md-p + .md-p,
.md-p + .md-ul,
.md-ul + .md-p,
.md-ul + .md-ul,
.md-quote + .md-p,
.md-quote + .md-ul {
  margin-top: 8px;
}

.md-ul {
  padding-left: 20px;
}

.md-ul li + li {
  margin-top: 6px;
}

.md-quote {
  border-left: 3px solid rgba(196, 106, 45, 0.32);
  background: rgba(255, 245, 231, 0.9);
  border-radius: 14px;
  padding: 10px 12px;
}

.hl {
  background: rgba(196, 106, 45, 0.18);
  border-radius: 4px;
  padding: 0 2px;
}

.kw {
  background: rgba(111, 123, 92, 0.16);
  border-radius: 4px;
  padding: 0 2px;
}

.glossary-title {
  color: var(--text-primary);
  margin-bottom: 10px;
  font-family: var(--font-family-display);
  font-size: 1.1rem;
}

.glossary-item + .glossary-item {
  margin-top: 10px;
}

.glossary-term {
  color: var(--text-primary);
  font-weight: 700;
}

.glossary-explain {
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.7;
}

.origin-link {
  margin-top: 14px;
  display: inline-flex;
  color: var(--accent);
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .edurepo-layout {
    grid-template-columns: 1fr;
  }

  .edurepo-sidebar {
    position: static;
  }
}

@media (max-width: 900px) {
  .edurepo-main {
    padding: 18px;
    border-radius: 28px;
  }

  .edurepo-masthead {
    flex-direction: column;
    align-items: stretch;
  }

  .edurepo-masthead__stats {
    justify-content: flex-start;
  }

  .modal-hero {
    grid-template-columns: 1fr;
  }

  .modal-cover {
    max-width: 320px;
  }
}

@media (max-width: 720px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .edurepo-sidebar,
  .edurepo-main,
  .edurepo-shell,
  .modal-panel {
    border-radius: 24px;
  }

  .edurepo-main {
    padding: 16px;
  }

  .theme-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
