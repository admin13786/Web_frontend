<template>
  <div class="brief-page">
    <nav class="brief-nav">
      <router-link to="/channel" class="brief-back">← 返回AI新闻早咖啡</router-link>
      <a
        v-if="article?.url"
        class="brief-nav__link"
        :href="article.url"
        target="_blank"
        rel="noreferrer noopener"
      >
        打开原网页 ↗
      </a>
    </nav>

    <section v-if="loading" class="brief-state">
      <span class="state-kicker">AI BRIEF</span>
      <h2>正在整理这一条新闻的 AI 简报</h2>
      <p>会优先读取后端已经生成的简报，必要时再实时补一版。</p>
    </section>

    <section v-else-if="error" class="brief-state brief-state--error">
      <span class="state-kicker">UNAVAILABLE</span>
      <h2>这条简报暂时没有生成成功</h2>
      <p>{{ error }}</p>
      <button type="button" class="retry-btn" @click="loadAll">重新加载</button>
    </section>

    <article v-else class="brief-article">
      <header class="brief-hero">
        <time v-if="displayDate" class="hero-date">{{ displayDate }}</time>
        <h1 class="hero-title">{{ brief?.headline || article?.title || '' }}</h1>
        <div class="brief-divider" />
      </header>

      <section class="brief-card">
        <div class="brief-card__head">
          <span class="brief-card__index">01</span>
          <h2 class="brief-card__title">{{ brief?.headline || article?.title || '' }}</h2>
        </div>

        <div class="brief-card__body">
          <p
            v-for="(paragraph, index) in displayParagraphs"
            :key="`${routeNewsId}-${index}`"
            class="brief-paragraph"
          >
            {{ paragraph }}
          </p>
        </div>

        <div v-if="brief?.tags?.length" class="tag-list">
          <span v-for="tag in brief.tags" :key="tag" class="tag-chip">{{ tag }}</span>
        </div>

        <section v-if="normalizedSources.length" class="source-section">
          <span class="source-section__title">来源</span>
          <div class="source-stack">
            <a
              v-for="(source, index) in normalizedSources"
              :key="`${source.url || source.label}-${index}`"
              class="source-link"
              :href="source.url"
              target="_blank"
              rel="noreferrer noopener"
            >
              <strong>{{ source.label }}</strong>
              <span>{{ source.domain }}</span>
            </a>
          </div>
        </section>
      </section>
    </article>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { generateNewsBrief, getNewsArticle } from '../api/newsBrief.js'

const route = useRoute()
const routeNewsId = computed(() => String(route.params.newsId || '').trim())

const loading = ref(true)
const error = ref('')
const article = ref(null)
const brief = ref(null)

const displayDate = computed(() => {
  return formatDate(article.value?.published_at || article.value?.publishedAt || '')
})

const normalizedSources = computed(() => {
  const base = Array.isArray(brief.value?.sources) ? brief.value.sources : []
  const mapped = base
    .map((item) => {
      const url = String(item?.url || '').trim()
      const label = String(item?.label || article.value?.source || '原文来源').trim()
      const domain = extractDomain(url) || label
      return url || label ? { url, label, domain } : null
    })
    .filter(Boolean)

  if (mapped.length) return mapped

  const url = String(article.value?.url || '').trim()
  if (!url) return []
  return [{
    url,
    label: String(article.value?.source || '原文来源').trim() || '原文来源',
    domain: extractDomain(url) || url,
  }]
})

function cleanParagraph(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

const displayParagraphs = computed(() => {
  const lead = cleanParagraph(brief.value?.lead || '')
  const rawParagraphs = Array.isArray(brief.value?.paragraphs) ? brief.value.paragraphs : []
  const paragraphs = rawParagraphs.map(cleanParagraph).filter(Boolean)

  let result = paragraphs.length ? paragraphs : (lead ? [lead] : [])

  if (lead && !result.some((item) => item === lead || item.includes(lead) || lead.includes(item))) {
    result = [lead, ...result]
  }

  if (result.length <= 1 && article.value) {
    const summary = cleanParagraph(article.value.summary || '')
    const content = String(article.value.content || article.value.text || '')
      .split(/\n+/)
      .map((item) => cleanParagraph(item))
      .filter((item) => item.length > 20)

    if (summary && !result.includes(summary)) result.push(summary)
    for (const item of content) {
      if (!result.some((existing) => existing.includes(item) || item.includes(existing))) {
        result.push(item)
      }
      if (result.length >= 4) break
    }
  }

  return result.filter(Boolean)
})

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
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function isNumericId(id) {
  return /^[0-9]+$/.test(String(id || ''))
}

async function loadAll() {
  loading.value = true
  error.value = ''
  article.value = null
  brief.value = null

  if (!isNumericId(routeNewsId.value)) {
    error.value = `该条新闻暂不支持生成简报（newsId: ${routeNewsId.value}）`
    loading.value = false
    return
  }

  try {
    const [articleData, briefData] = await Promise.all([
      getNewsArticle(routeNewsId.value),
      generateNewsBrief(Number(routeNewsId.value)),
    ])
    article.value = articleData
    brief.value = briefData
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
watch(() => routeNewsId.value, loadAll)
</script>

<style scoped>
.brief-page {
  width: min(1080px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brief-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 4px;
}

.brief-back {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.98rem;
  transition: color var(--transition-fast);
}

.brief-back:hover {
  color: var(--accent);
}

.brief-nav__link {
  color: #6d76ff;
  text-decoration: none;
  font-size: 1rem;
  transition:
    color var(--transition-fast),
    transform var(--transition-fast);
}

.brief-nav__link:hover {
  color: #515cff;
  transform: translateY(-1px);
}

.brief-state {
  padding: 36px;
  border-radius: 32px;
  border: 1px solid var(--border-soft);
  background:
    radial-gradient(circle at top center, rgba(158, 187, 255, 0.18), transparent 44%),
    linear-gradient(180deg, rgba(249, 251, 255, 0.96), rgba(243, 246, 252, 0.94));
  box-shadow: var(--shadow-soft);
}

.brief-state--error {
  border-color: var(--danger-border);
  background:
    radial-gradient(circle at top center, rgba(255, 176, 176, 0.14), transparent 44%),
    linear-gradient(180deg, rgba(255, 251, 251, 0.96), rgba(250, 241, 241, 0.94));
}

.state-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--kicker-color);
}

.brief-state h2 {
  margin-top: 14px;
  font-family: var(--font-family-display);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
}

.brief-state p {
  margin-top: 12px;
  max-width: 56ch;
  line-height: 1.8;
  color: var(--text-secondary);
}

.retry-btn {
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 16px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-inset);
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.retry-btn:hover {
  transform: translateY(-1px);
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.brief-article {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brief-hero {
  padding: 24px 28px 18px;
  border-radius: 34px;
  background:
    radial-gradient(circle at top center, rgba(158, 187, 255, 0.22), transparent 56%),
    linear-gradient(180deg, rgba(248, 250, 255, 0.92), rgba(242, 245, 251, 0.82));
}

.hero-date {
  display: block;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.92rem;
  letter-spacing: 0.03em;
}

.hero-title {
  margin: 24px auto 0;
  max-width: 14ch;
  text-align: center;
  font-family: var(--font-family-display);
  font-size: clamp(2.3rem, 4.8vw, 4rem);
  line-height: 1.18;
  color: #1d2940;
}

.brief-divider {
  height: 1px;
  margin-top: 34px;
  background: linear-gradient(90deg, transparent, rgba(95, 111, 142, 0.24), transparent);
}

.brief-card {
  padding: 40px 42px 36px;
  border-radius: 34px;
  border: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 251, 255, 0.92)),
    var(--bg-card);
  box-shadow:
    0 26px 60px rgba(157, 176, 214, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.brief-card__head {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.brief-card__index {
  padding-top: 4px;
  font-family: var(--font-family-display);
  font-size: 1.95rem;
  line-height: 1;
  color: #afb8c8;
}

.brief-card__title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(1.78rem, 3vw, 2.45rem);
  line-height: 1.3;
  color: #1d2940;
}

.brief-card__body {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.brief-paragraph {
  margin: 0;
  font-size: 1rem;
  line-height: 1.95;
  color: #5d6f8e;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(120, 132, 255, 0.08);
  border: 1px solid rgba(120, 132, 255, 0.18);
  color: #6872ff;
  font-size: 0.9rem;
}

.source-section {
  margin-top: 40px;
}

.source-section__title {
  display: inline-flex;
  color: #8a97ab;
  font-size: 0.94rem;
  font-weight: 600;
}

.source-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.source-link {
  display: flex;
  align-items: baseline;
  gap: 14px;
  color: inherit;
  text-decoration: none;
}

.source-link strong {
  font-size: 0.98rem;
  font-weight: 500;
  color: #2a3448;
  transition: color var(--transition-fast);
}

.source-link span {
  color: #8a96aa;
  font-size: 0.9rem;
  transition: color var(--transition-fast);
}

.source-link:hover strong {
  color: var(--accent);
}

.source-link:hover span {
  color: #6f7d94;
}

@media (max-width: 1080px) {
  .brief-page {
    width: min(920px, 100%);
  }
}

@media (max-width: 720px) {
  .brief-page {
    gap: 20px;
    width: 100%;
  }

  .brief-nav {
    flex-wrap: wrap;
    gap: 10px;
  }

  .brief-hero {
    padding: 18px 18px 14px;
    border-radius: 24px;
  }

  .hero-title {
    max-width: none;
    font-size: 2rem;
  }

  .brief-divider {
    margin-top: 22px;
  }

  .brief-card {
    padding: 24px 20px 26px;
    border-radius: 24px;
  }

  .brief-card__head {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .brief-card__index {
    font-size: 1.6rem;
  }

  .brief-card__body {
    margin-top: 22px;
    gap: 18px;
  }

  .source-link {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
}
</style>
