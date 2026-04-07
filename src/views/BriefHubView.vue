<template>
  <div class="brief-hub">
    <header class="brief-hub__hero">
      <div>
        <p class="hero-eyebrow">Brief Center</p>
        <h1 class="hero-title">热点简报中心</h1>
        <p class="hero-desc">把热点资讯集中在一个入口里，支持打开原文、生成简报和跳转讲解。</p>
      </div>
      <button type="button" class="hero-action" :disabled="loading" @click="fetchItems">
        {{ loading ? '加载中...' : '刷新热点' }}
      </button>
    </header>

    <section v-if="error" class="state-card">
      <p>{{ error }}</p>
      <button type="button" class="state-btn" @click="fetchItems">重试</button>
    </section>

    <section v-else-if="loading" class="state-card">
      <p>正在整理热点与可用简报入口...</p>
    </section>

    <section v-else class="brief-hub__grid">
      <article
        v-for="item in briefs"
        :key="item.id"
        class="brief-card"
      >
        <div class="brief-card__meta">
          <span class="brief-rank">#{{ item.id }}</span>
          <span class="brief-domain">{{ item.source || '热点资讯' }}</span>
        </div>
        <h2 class="brief-title">{{ item.title }}</h2>
        <p class="brief-summary">{{ item.summary }}</p>

        <div class="brief-actions">
          <a
            v-if="item.url"
            class="brief-link"
            :href="item.url"
            target="_blank"
            rel="noreferrer noopener"
          >
            打开原文
          </a>
          <RouterLink
            v-if="item.newsId"
            class="brief-link brief-link--primary"
            :to="`/brief/${encodeURIComponent(item.newsId)}`"
          >
            查看简报
          </RouterLink>
          <button
            type="button"
            class="brief-link"
            @click="explainNews(item)"
          >
            讲解
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
    item?.source || '热点资讯',
    item?.tag ? `标签 ${item.tag}` : '',
    `当前排序第 ${index + 1} 位`,
  ].filter(Boolean)

  return `${parts.join(' · ')}。可从这里快速生成简报或跳转到原文。`
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
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function explainNews(item) {
  if (!item?.title) return
  const url = buildOpenMAICDialogPrefillHomeUrl(getOpenMAICAppUrl(), item.title)
  window.location.href = url
}

fetchItems()
</script>

<style scoped>
.brief-hub {
  min-height: 100%;
}

.brief-hub__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 28px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
}

.hero-eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #93c5fd;
}

.hero-title {
  margin-top: 10px;
  font-size: 2rem;
  line-height: 1.2;
}

.hero-desc {
  margin-top: 10px;
  max-width: 680px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-action,
.state-btn {
  border: 1px solid rgba(147, 197, 253, 0.22);
  background: rgba(59, 130, 246, 0.14);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 12px 16px;
  cursor: pointer;
}

.state-card {
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.brief-hub__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.brief-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: var(--shadow-soft);
}

.brief-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.brief-rank {
  color: #93c5fd;
  font-weight: 700;
}

.brief-title {
  font-size: 1.08rem;
  line-height: 1.6;
}

.brief-summary {
  color: var(--text-secondary);
  line-height: 1.7;
}

.brief-actions {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.brief-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
}

.brief-link--primary {
  background: rgba(59, 130, 246, 0.18);
  border-color: rgba(147, 197, 253, 0.26);
}

@media (max-width: 900px) {
  .brief-hub__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .brief-hub__grid {
    grid-template-columns: 1fr;
  }
}
</style>
