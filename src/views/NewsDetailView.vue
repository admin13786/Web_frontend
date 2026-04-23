<template>
  <div class="story-page">
    <nav class="story-nav">
      <router-link to="/channel" class="nav-back">← 返回 AI观察哨</router-link>
      <div class="nav-actions">
        <button
          type="button"
          class="nav-action nav-action--primary"
          :disabled="!hasBrief"
          @click="goToSummary"
        >
          查看 AI 简报
        </button>
        <a
          v-if="article?.url"
          :href="article.url"
          class="nav-action"
          target="_blank"
          rel="noreferrer noopener"
        >
          打开原文
        </a>
      </div>
    </nav>

    <section v-if="loading" class="story-state">
      <span class="state-kicker">LOADING DOSSIER</span>
      <h2>正在整理这条新闻的原文线索</h2>
      <p>稍等片刻，页面会切换到适合阅读的档案视图。</p>
    </section>

    <section v-else-if="error" class="story-state story-state--error">
      <span class="state-kicker">UNAVAILABLE</span>
      <h2>这条新闻暂时打不开</h2>
      <p>{{ error }}</p>
      <button type="button" class="retry-btn" @click="loadArticle">重新加载</button>
    </section>

    <article v-else-if="article" class="story-article">
      <header class="story-hero">
        <div class="story-heading">
          <span class="story-kicker">NEWS DOSSIER</span>
          <h1 class="story-title">{{ article.title }}</h1>
          <p class="story-dek">{{ dekText }}</p>
          <div class="story-meta-strip">
            <span v-if="displayDate" class="meta-chip">{{ displayDate }}</span>
            <span v-if="sourceLabel" class="meta-chip">{{ sourceLabel }}</span>
            <span v-if="sourceDomain" class="meta-chip">{{ sourceDomain }}</span>
          </div>
        </div>

        <aside class="story-rail">
          <section class="rail-card">
            <span class="rail-kicker">继续处理</span>
            <button type="button" class="rail-cta" @click="openExplain">
              交给 OpenMAIC 继续讲解
            </button>
            <p class="rail-copy">
              用这条新闻标题作为预填内容，直接跳到课堂侧继续拆解背景、概念和影响。
            </p>
          </section>

          <section class="rail-card rail-card--facts">
            <span class="rail-kicker">速览</span>
            <div
              v-for="item in quickFacts"
              :key="item.label"
              class="fact-row"
            >
              <span class="fact-label">{{ item.label }}</span>
              <strong class="fact-value">{{ item.value }}</strong>
            </div>
          </section>
        </aside>
      </header>

      <section class="story-body">
        <div class="story-main">
          <div v-if="coverUrl" class="story-cover">
            <img :src="coverUrl" :alt="article.title" class="story-cover__image" />
          </div>

          <section class="story-panel">
            <div class="section-head">
              <span class="section-kicker">摘要导读</span>
              <h2>先读这 30 秒版本</h2>
            </div>
            <p class="lead-copy">{{ leadText }}</p>
          </section>

          <section class="story-panel">
            <div class="section-head">
              <span class="section-kicker">正文档案</span>
              <h2>原文整理</h2>
            </div>
            <p
              v-for="(paragraph, index) in bodyParagraphs"
              :key="`${routeNewsId}-${index}`"
              class="body-paragraph"
            >
              {{ paragraph }}
            </p>
          </section>
        </div>

        <aside class="story-side">
          <section class="side-note">
            <span class="section-kicker">阅读建议</span>
            <h3>怎么用这页最省力</h3>
            <ul class="note-list">
              <li>先看摘要导读，确认这条新闻值不值得继续追。</li>
              <li>想快速理解脉络时，直接点上方的 OpenMAIC 讲解入口。</li>
              <li>需要原始上下文时，再回到原文链接做二次核对。</li>
            </ul>
          </section>

          <section v-if="article.summary && article.summary !== leadText" class="side-note">
            <span class="section-kicker">一句话概览</span>
            <p class="side-summary">{{ article.summary }}</p>
          </section>
        </aside>
      </section>
    </article>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNewsArticle } from '../api/newsBrief.js'
import { buildOpenMAICDialogPrefillHomeUrl, getOpenMAICAppUrl } from '../config.js'

const route = useRoute()
const router = useRouter()

const routeNewsId = computed(() => String(route.params.newsId || '').trim())
const explainAuto = computed(() => route.query.explain === '1')

const loading = ref(true)
const error = ref('')
const article = ref(null)

const hasBrief = computed(() => /^[0-9]+$/.test(routeNewsId.value))
const coverUrl = computed(() => article.value?.cover_url || article.value?.coverUrl || '')
const sourceDomain = computed(() => extractDomain(article.value?.url || ''))
const sourceLabel = computed(() => {
  return String(article.value?.source || sourceDomain.value || '').trim()
})
const displayDate = computed(() => {
  return formatDate(article.value?.published_at || article.value?.publishedAt || '')
})
const leadText = computed(() => {
  const summary = normalizeInline(article.value?.summary || '')
  if (summary) return summary
  const content = normalizeInline(article.value?.content || article.value?.text || '')
  return content.slice(0, 180) + (content.length > 180 ? '…' : '')
})
const dekText = computed(() => {
  return leadText.value || '这条新闻的原文已经整理成适合快速阅读的档案页。'
})
const bodyParagraphs = computed(() => {
  const raw = String(article.value?.content || article.value?.text || article.value?.summary || '').trim()
  const normalized = raw.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const byBreaks = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)

  const candidate = byBreaks.length > 1 ? byBreaks : normalized
    .split(/(?<=[。！？!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const merged = []
  let buffer = ''
  for (const paragraph of candidate) {
    if ((buffer + paragraph).length < 120) {
      buffer = `${buffer}${buffer ? ' ' : ''}${paragraph}`.trim()
    } else {
      if (buffer) merged.push(buffer)
      buffer = paragraph
    }
  }
  if (buffer) merged.push(buffer)

  return merged.length ? merged : [normalized]
})
const quickFacts = computed(() => {
  const items = [
    { label: '栏目', value: 'AI观察哨' },
    displayDate.value ? { label: '发布时间', value: displayDate.value } : null,
    sourceLabel.value ? { label: '来源', value: sourceLabel.value } : null,
    sourceDomain.value ? { label: '域名', value: sourceDomain.value } : null,
  ]
  return items.filter(Boolean)
})

function normalizeInline(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function formatDate(raw) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function openExplain() {
  if (!article.value?.title) return
  const url = buildOpenMAICDialogPrefillHomeUrl(getOpenMAICAppUrl(), article.value.title)
  window.location.assign(url)
}

function goToSummary() {
  if (!hasBrief.value) return
  router.push(`/brief/${encodeURIComponent(routeNewsId.value)}`)
}

async function loadArticle() {
  loading.value = true
  error.value = ''
  article.value = null

  try {
    article.value = await getNewsArticle(routeNewsId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }

  if (explainAuto.value && article.value?.title) {
    window.setTimeout(() => openExplain(), 120)
  }
}

onMounted(loadArticle)
watch(() => routeNewsId.value, loadArticle)
</script>

<style scoped>
.story-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.story-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-back {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.92rem;
  letter-spacing: 0.04em;
}

.nav-back:hover {
  color: var(--accent);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-action,
.retry-btn,
.rail-cta {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 999px;
  padding: 11px 16px;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.nav-action:hover,
.retry-btn:hover,
.rail-cta:hover {
  transform: translateY(-1px);
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.nav-action--primary,
.rail-cta {
  background: linear-gradient(180deg, rgba(196, 106, 45, 0.16), rgba(196, 106, 45, 0.08));
  border-color: rgba(196, 106, 45, 0.28);
  color: var(--accent-strong);
}

.nav-action:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  transform: none;
}

.story-state {
  padding: 34px;
  border-radius: 28px;
  border: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.94), rgba(245, 236, 226, 0.94)),
    var(--bg-card);
  box-shadow: var(--shadow-soft);
}

.story-state--error {
  border-color: var(--danger-border);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.94), rgba(249, 235, 232, 0.92)),
    var(--bg-card);
}

.state-kicker,
.story-kicker,
.rail-kicker,
.section-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--kicker-color);
}

.story-state h2 {
  margin-top: 14px;
  font-family: var(--font-family-display);
  font-size: clamp(1.7rem, 3vw, 2.5rem);
}

.story-state p {
  margin-top: 12px;
  max-width: 56ch;
  line-height: 1.8;
  color: var(--text-secondary);
}

.retry-btn {
  margin-top: 18px;
}

.story-article {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.story-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 360px);
  gap: 22px;
  align-items: start;
}

.story-heading {
  padding: 34px;
  border-radius: 34px;
  border: 1px solid var(--border-soft);
  background:
    radial-gradient(circle at top right, rgba(196, 106, 45, 0.1), transparent 32%),
    linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(245, 236, 225, 0.92));
  box-shadow: var(--shadow-card);
}

.story-title {
  margin-top: 18px;
  font-family: var(--font-family-display);
  font-size: clamp(2.2rem, 5vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: 0.01em;
  max-width: 14ch;
}

.story-dek {
  margin-top: 20px;
  max-width: 54ch;
  color: var(--text-secondary);
  font-size: 1.02rem;
  line-height: 1.9;
}

.story-meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 252, 247, 0.82);
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.story-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rail-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 251, 246, 0.9);
  box-shadow: var(--shadow-soft);
}

.rail-card--facts {
  background:
    linear-gradient(180deg, rgba(241, 229, 214, 0.76), rgba(255, 251, 246, 0.94)),
    rgba(255, 251, 246, 0.92);
}

.rail-copy {
  margin-top: 12px;
  line-height: 1.8;
  color: var(--text-secondary);
  font-size: 0.94rem;
}

.fact-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(124, 98, 74, 0.1);
}

.fact-row:first-of-type {
  margin-top: 10px;
}

.fact-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.fact-label {
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.fact-value {
  font-weight: 600;
  line-height: 1.6;
}

.story-body {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.8fr);
  gap: 22px;
}

.story-main,
.story-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.story-cover {
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 251, 246, 0.9);
  box-shadow: var(--shadow-soft);
}

.story-cover__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.story-panel,
.side-note {
  padding: 24px 24px 26px;
  border-radius: 26px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 251, 246, 0.9);
  box-shadow: var(--shadow-soft);
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.section-head h2,
.side-note h3 {
  font-family: var(--font-family-display);
  font-size: 1.45rem;
  line-height: 1.2;
}

.lead-copy,
.body-paragraph,
.side-summary {
  color: var(--text-secondary);
  line-height: 1.9;
  font-size: 0.98rem;
}

.body-paragraph + .body-paragraph {
  margin-top: 16px;
}

.note-list {
  margin-top: 14px;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .story-hero,
  .story-body {
    grid-template-columns: 1fr;
  }

  .story-title {
    max-width: none;
  }
}

@media (max-width: 720px) {
  .story-page {
    gap: 18px;
  }

  .story-heading,
  .story-panel,
  .side-note,
  .rail-card,
  .story-state {
    padding: 22px;
    border-radius: 24px;
  }

  .story-title {
    font-size: 2rem;
  }

  .nav-actions {
    width: 100%;
  }

  .nav-action,
  .retry-btn {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>
