<template>
  <div class="brief-hub">
    <header class="hub-hero">
      <div class="hub-copy">
        <span class="hub-kicker">BRIEF ARCHIVE</span>
        <h1 class="hub-title">热榜简报中心</h1>
        <p class="hub-desc">
          把今天值得继续阅读的热榜线索收成一排卡片。你可以直接打开原文、切到 AI 简报，或者继续交给
          OpenMAIC 做讲解。
        </p>
      </div>
      <button type="button" class="hub-refresh" :disabled="loading" @click="fetchItems">
        {{ loading ? '正在刷新…' : '刷新热榜' }}
      </button>
    </header>

    <section v-if="error" class="hub-state hub-state--error">
      <span class="hub-kicker">UNAVAILABLE</span>
      <h2>热榜暂时没有拉取成功</h2>
      <p>{{ error }}</p>
      <button type="button" class="hub-refresh" @click="fetchItems">重新获取</button>
    </section>

    <section v-else-if="loading" class="hub-state">
      <span class="hub-kicker">LOADING BOARD</span>
      <h2>正在整理今日值得读的线索</h2>
      <p>稍等片刻，页面会展示适合继续处理的简报入口。</p>
    </section>

    <section v-else class="hub-grid">
      <article
        v-for="(item, index) in briefs"
        :key="item.id"
        class="hub-card"
        :class="{ 'hub-card--feature': index === 0 }"
      >
        <div class="hub-card__meta">
          <span class="hub-rank">#{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="hub-source">{{ item.source || 'AI 热榜' }}</span>
        </div>

        <h2 class="hub-card__title">{{ item.title }}</h2>
        <p class="hub-card__summary">{{ item.summary }}</p>

        <div class="hub-card__actions">
          <a
            v-if="item.url"
            class="card-link"
            :href="item.url"
            target="_blank"
            rel="noreferrer noopener"
          >
            原文
          </a>
          <RouterLink
            v-if="item.newsId"
            class="card-link card-link--primary"
            :to="`/brief/${encodeURIComponent(item.newsId)}`"
          >
            AI 简报
          </RouterLink>
          <button type="button" class="card-link" @click="explainNews(item)">
            OpenMAIC 讲解
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getRankWeibo } from '../api/rank.js'
import { buildOpenMAICDialogPrefillHomeUrl, getOpenMAICAppUrl } from '../config.js'

const briefs = ref([])
const loading = ref(true)
const error = ref('')

function buildSummary(item, index) {
  const parts = [
    item?.source || 'AI 热榜',
    item?.tag ? `标签 ${item.tag}` : '',
    `当前排序第 ${index + 1} 位`,
  ].filter(Boolean)

  return `${parts.join(' · ')}。这条线索适合继续生成简报，或直接跳到后续讲解。`
}

async function fetchItems() {
  loading.value = true
  error.value = ''

  try {
    const [main, sub] = await Promise.all([getRankWeibo('main'), getRankWeibo('sub')])
    const merged = [...(main.list || []), ...(sub.list || [])]
      .filter((item) => item?.title)
      .slice(0, 12)
      .map((item, index) => ({
        ...item,
        id: index + 1,
        summary: buildSummary(item, index),
      }))

    briefs.value = merged
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

function explainNews(item) {
  if (!item?.title) return
  const url = buildOpenMAICDialogPrefillHomeUrl(getOpenMAICAppUrl(), item.title)
  window.location.assign(url)
}

fetchItems()
</script>

<style scoped>
.brief-hub {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hub-hero,
.hub-state {
  padding: 32px;
  border-radius: 30px;
  border: 1px solid var(--border-soft);
  background:
    radial-gradient(circle at top right, rgba(196, 106, 45, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(245, 236, 225, 0.92));
  box-shadow: var(--shadow-card);
}

.hub-state--error {
  border-color: var(--danger-border);
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(249, 235, 232, 0.92)),
    var(--bg-card);
}

.hub-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 22px;
}

.hub-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--kicker-color);
}

.hub-title {
  margin-top: 16px;
  font-family: var(--font-family-display);
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
}

.hub-desc,
.hub-state p {
  margin-top: 16px;
  max-width: 56ch;
  color: var(--text-secondary);
  line-height: 1.9;
}

.hub-state h2 {
  margin-top: 14px;
  font-family: var(--font-family-display);
  font-size: 1.9rem;
}

.hub-refresh {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.hub-refresh:hover {
  transform: translateY(-1px);
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.hub-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border-radius: 26px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 251, 246, 0.9);
  box-shadow: var(--shadow-soft);
}

.hub-card--feature {
  background:
    radial-gradient(circle at top right, rgba(196, 106, 45, 0.1), transparent 28%),
    linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(245, 236, 225, 0.94));
  box-shadow: var(--shadow-card);
}

.hub-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.hub-rank {
  color: var(--accent-strong);
  font-weight: 700;
}

.hub-card__title {
  font-family: var(--font-family-display);
  font-size: 1.34rem;
  line-height: 1.35;
}

.hub-card__summary {
  color: var(--text-secondary);
  line-height: 1.85;
}

.hub-card__actions {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.card-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 252, 247, 0.86);
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.card-link:hover {
  transform: translateY(-1px);
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.card-link--primary {
  background: linear-gradient(180deg, rgba(196, 106, 45, 0.16), rgba(196, 106, 45, 0.08));
  border-color: rgba(196, 106, 45, 0.28);
  color: var(--accent-strong);
}

@media (max-width: 960px) {
  .hub-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hub-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .brief-hub {
    gap: 18px;
  }

  .hub-hero,
  .hub-state,
  .hub-card {
    padding: 22px;
    border-radius: 24px;
  }

  .hub-refresh {
    width: 100%;
    justify-content: center;
  }
}
</style>
