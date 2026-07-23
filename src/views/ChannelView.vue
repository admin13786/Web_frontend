<template>
  <div class="channel-page">
    <section class="channel-masthead">
      <div class="masthead-copy">
        <span class="masthead-kicker">LINGJING / MORNING DESK</span>
        <h1 class="masthead-title">AI 趣闻萃取</h1>
        <p class="masthead-desc">
          把今天值得看的 AI 热点整理成更轻松易读的卡片，你可以在这里快速切换商业视角与开发者视角。
        </p>
      </div>

      <div class="channel-switch">
        <button
          type="button"
          class="channel-switch__btn"
          :class="{ 'channel-switch__btn--active': isMainRanking }"
          @click="switchToMain"
        >
          <span class="channel-switch__label">商业 / 行业</span>
          <span class="channel-switch__hint">更偏市场、产品与公司动态</span>
        </button>
        <button
          type="button"
          class="channel-switch__btn"
          :class="{ 'channel-switch__btn--active': !isMainRanking }"
          @click="switchToSub"
        >
          <span class="channel-switch__label">开发者 / 技术</span>
          <span class="channel-switch__hint">更偏工程、工具与能力变化</span>
        </button>
        <RouterLink to="/news-chat" class="channel-switch__link">
          <span class="channel-switch__label">新闻问答</span>
          <span class="channel-switch__hint">直接向新闻库提问并看引用</span>
        </RouterLink>
      </div>
    </section>

    <div v-if="loadError" class="state-card state-card--error">
      <p>{{ loadError }}</p>
      <button type="button" class="retry-btn" @click="fetchAll">重试</button>
    </div>
    <div v-else-if="actionMessage" class="state-card state-card--notice">
      {{ actionMessage }}
    </div>
    <div v-else-if="loading" class="state-card">正在整理今天的榜单内容…</div>

    <div v-else class="channel-stage">
      <section class="feature-column">
        <header class="section-head">
          <div>
            <span class="section-kicker">CURATED PANELS</span>
            <h2 class="section-title">{{ activeFeatureTitle }}</h2>
          </div>
          <p class="section-desc">{{ activeFeatureDeck }}</p>
        </header>

        <div class="feature-grid">
          <article
            v-for="(item, index) in activeFeatureItems"
            :key="item.id"
            class="feature-card"
            v-motion
            :initial="{ opacity: 0, y: 18 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.38, delay: index * 0.05 } }"
          >
            <div class="feature-card__head">
              <span class="feature-card__index">{{ formatRankId(item.id) }}</span>
              <span class="feature-card__metric">{{ item.viewsText }}</span>
            </div>

            <div class="feature-card__body">
              <button type="button" class="feature-card__title" @click="openNews(item)">
                {{ displayTitle(item.title) }}
              </button>
              <p class="feature-card__overview">{{ newsOverview(item) }}</p>

              <button
                type="button"
                class="feature-card__cover-shell"
                @click="openNews(item)"
                @keydown.enter.prevent="openNews(item)"
                @keydown.space.prevent="openNews(item)"
              >
                <div v-if="item.coverUrl" class="feature-card__cover feature-card__cover--thumb">
                  <img
                    class="cover-image"
                    :src="item.coverUrl"
                    :alt="displayTitle(item.title)"
                    loading="lazy"
                    @error="onCoverError(item)"
                    @load="onCoverLoad($event, item)"
                  />
                  <div class="cover-overlay" />
                </div>
                <div v-else class="feature-card__cover">
                  <span class="feature-card__placeholder">暂无封面</span>
                </div>
              </button>
            </div>

            <div class="feature-card__foot">
              <span class="feature-card__source">{{ featureSource(item) }}</span>
              <button type="button" class="feature-card__link" @click="openNewsUrl(item)">
                查看原文
              </button>
            </div>
          </article>
        </div>

        <button
          v-if="hasMoreItems"
          type="button"
          class="load-more-btn"
          @click="loadMoreVideos"
        >
          随机加载更多
        </button>
      </section>

      <aside class="brief-rail">
        <header class="section-head section-head--rail">
          <div>
            <span class="section-kicker">INDEX RAIL</span>
            <h2 class="section-title">{{ activeRailTitle }}</h2>
          </div>
          <p class="section-desc">{{ activeRailDeck }}</p>
        </header>

        <div class="rail-list">
          <article
            v-for="(item, index) in activeRailItems"
            :key="`${activeRailTitle}-${item.id}`"
            class="rail-item"
            v-motion
            :initial="{ opacity: 0, x: 10 }"
            :enter="{ opacity: 1, x: 0, transition: { duration: 0.32, delay: index * 0.04 } }"
          >
            <div class="rail-item__rank" :class="{ 'rail-item__rank--top': item.id <= 3 }">
              {{ formatRankId(item.id) }}
            </div>

            <div class="rail-item__main">
              <button type="button" class="rail-item__title" @click="openNews(item)">
                {{ displayTitle(item.title) }}
              </button>
              <p class="rail-item__overview">{{ newsOverview(item) }}</p>
              <div class="rail-item__meta">
                <span>{{ railSource(item) }}</span>
                <span>·</span>
                <span>{{ railMetric(item) }}</span>
              </div>
            </div>

            <div class="rail-item__actions" @click.stop>
              <button
                type="button"
                class="rail-action rail-action--soft"
                @click="summaryNews(item)"
                :disabled="!item?.newsId"
              >
                AI简报
              </button>
              <button
                type="button"
                class="rail-action"
                @click="explainNews(item)"
                :disabled="explainLoading"
              >
                {{ explainLoading ? '生成中…' : '划重点' }}
              </button>
            </div>
          </article>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRankWeibo } from '../api/rank.js'
import { getOpenMAICAppUrl, buildOpenMAICDialogPrefillHomeUrl } from '../config.js'

const router = useRouter()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const isMainRanking = ref(true)
const leftData = ref([])
const rightData = ref([])
const leftmostData = ref([])
const rightmostData = ref([])
const loading = ref(true)
const loadError = ref('')
const actionMessage = ref('')
const LEFT_NEWS_COUNT = 10
const LOAD_MORE_COUNT = 5
const FALLBACK_COVER = '/favicon.svg'
const DEFAULT_COVER_POOL = [
  '/channel-covers/creative-rank-1.png',
  '/channel-covers/creative-rank-2.png',
  '/channel-covers/creative-rank-3.png',
  '/channel-covers/creative-rank-4.png',
  '/channel-covers/creative-rank-5.png',
  '/channel-covers/skill-rank-1.png',
  '/channel-covers/skill-rank-2.png',
  '/channel-covers/skill-rank-3.png',
  '/channel-covers/skill-rank-4.png',
  '/channel-covers/skill-rank-5.png',
]

const activeFeatureTitle = computed(() => (isMainRanking.value ? '商业热榜' : '开发者热榜'))
const activeFeatureDeck = computed(() => (
  isMainRanking.value
    ? '从市场、产品与公司动作里，快速看清今天最值得追踪的 AI 变化。'
    : '从工具、工程实践与技术动态里，快速找到值得关注的新能力。'
))
const activeRailTitle = computed(() => (isMainRanking.value ? '商业 / 行业' : '开发者 / 技术'))
const activeRailDeck = computed(() => (
  isMainRanking.value
    ? '更适合快速扫榜，查看来源、热度与简报入口。'
    : '更适合查看技术向热点、原文与解释入口。'
))
const activeFeatureItems = computed(() => (isMainRanking.value ? leftData.value : rightData.value))
const activeRailItems = computed(() => (isMainRanking.value ? leftmostData.value : rightmostData.value))
const hasMoreItems = computed(() => (isMainRanking.value ? mainPool.value.length > 0 : subPool.value.length > 0))

function displayTitle(title) {
  return String(title || '').trim()
}

function newsOverview(item) {
  const overview = String(item?.overview || item?.summary || '').trim()
  if (overview) return overview
  return 'AI 概览正在整理中，稍后可查看完整摘要。'
}

function formatWan(viewsNum) {
  const n = Number(viewsNum)
  if (!Number.isFinite(n)) return String(viewsNum ?? '')
  if (n >= 10000) {
    const wan = n / 10000
    const s = wan.toFixed(1).replace(/\.0$/, '')
    return `${s}万`
  }
  return String(n)
}

function formatRankId(id) {
  const n = Number(id)
  if (!Number.isFinite(n)) return String(id ?? '')
  return String(n).padStart(2, '0')
}

function pickDefaultCover(item) {
  const id = Math.max(1, Number(item?.id || 1))
  return DEFAULT_COVER_POOL[(id - 1) % DEFAULT_COVER_POOL.length] || FALLBACK_COVER
}

function buildCoverCandidates(item, fallbackCover) {
  const candidates = []
  if (item?.coverUrl) candidates.push(String(item.coverUrl))
  candidates.push(fallbackCover || FALLBACK_COVER)
  return [...new Set(candidates.filter(Boolean))]
}

function mapNewsForLeft(item) {
  const fallbackCover = pickDefaultCover(item)
  const coverCandidates = buildCoverCandidates(item, fallbackCover)
  return {
    ...item,
    fallbackCover,
    coverCandidates,
    coverCandidateIndex: 0,
    coverUrl: coverCandidates[0] || fallbackCover,
    coverCheckDone: false,
    viewsText: item?.viewsText || `${formatWan(item?.viewsNum)} 热度`,
  }
}

function moveToNextCover(item) {
  if (!item) return
  const list = Array.isArray(item.coverCandidates) ? item.coverCandidates : []
  if (!list.length) {
    item.coverUrl = item.fallbackCover || FALLBACK_COVER
    item.coverCheckDone = true
    return
  }
  const cur = Number(item.coverCandidateIndex || 0)
  const next = Math.min(cur + 1, list.length - 1)
  item.coverCandidateIndex = next
  item.coverUrl = list[next]
  item.coverCheckDone = false
}

function onCoverError(item) {
  if (!item) return
  const retries = Number(item._coverRetries || 0)
  if (retries < 2 && item.coverUrl && !item.coverUrl.startsWith('/')) {
    item._coverRetries = retries + 1
    const sep = item.coverUrl.includes('?') ? '&' : '?'
    item.coverUrl = item.coverUrl.replace(/[?&]_r=\d+/, '') + `${sep}_r=${retries + 1}`
    return
  }
  item._coverRetries = 0
  moveToNextCover(item)
}

function onCoverLoad(_event, item) {
  if (!item || item.coverCheckDone) return
  item._coverRetries = 0
  item.coverCheckDone = true
}

function openNews(item) {
  const newsId = String(item?.newsId || '').trim()
  if (/^[0-9]+$/.test(newsId)) {
    router.push(`/brief/${encodeURIComponent(newsId)}`)
  }
}

function openNewsUrl(item) {
  const url = item?.url
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  openNews(item)
}

function summaryNews(item) {
  const newsId = String(item?.newsId || '').trim()
  if (!newsId) return
  if (/^[0-9]+$/.test(newsId)) {
    router.push(`/brief/${encodeURIComponent(newsId)}`)
  } else {
    actionMessage.value = '当前新闻没有可跳转的简报页。'
    setTimeout(() => {
      actionMessage.value = ''
    }, 2000)
  }
}

function featureSource(item) {
  return String(item?.source || activeFeatureTitle.value).trim()
}

function railSource(item) {
  return String(item?.source || activeRailTitle.value).trim()
}

function railMetric(item) {
  return String(item?.viewsText || `${formatWan(item?.viewsNum)} 热度`).trim()
}

const mainPool = ref([])
const subPool = ref([])

function loadMoreVideos() {
  if (isMainRanking.value) {
    const pool = mainPool.value
    if (!pool.length) return
    const batch = pool.splice(0, LOAD_MORE_COUNT)
    const startId = leftData.value.length + 1
    leftData.value.push(
      ...batch.map((item, index) => mapNewsForLeft({ ...item, id: startId + index })),
    )
  } else {
    const pool = subPool.value
    if (!pool.length) return
    const batch = pool.splice(0, LOAD_MORE_COUNT)
    const startId = rightData.value.length + 1
    rightData.value.push(
      ...batch.map((item, index) => mapNewsForLeft({ ...item, id: startId + index })),
    )
  }
}

const explainLoading = ref(false)
const explainError = ref('')

async function explainNews(item) {
  const title = item?.title
  if (!title) return

  const appUrl = getOpenMAICAppUrl()

  explainLoading.value = true
  explainError.value = ''
  actionMessage.value = `正在为你打开 OpenMAIC，准备解读：${title}`

  try {
    const url = buildOpenMAICDialogPrefillHomeUrl(appUrl, title)
    await sleep(200)
    window.location.href = url
  } catch (error) {
    explainError.value = error instanceof Error ? error.message : String(error)
    actionMessage.value = `打开失败：${explainError.value}`
    setTimeout(() => {
      actionMessage.value = ''
    }, 5000)
  } finally {
    explainLoading.value = false
  }
}

function switchToMain() {
  isMainRanking.value = true
}

function switchToSub() {
  isMainRanking.value = false
}

async function fetchAll() {
  loading.value = true
  loadError.value = ''
  try {
    const [mainWeibo, subWeibo] = await Promise.all([
      getRankWeibo('main'),
      getRankWeibo('sub'),
    ])

    const orderedMain = Array.isArray(mainWeibo.list) ? [...mainWeibo.list] : []
    const mainLeftItems = orderedMain.slice(0, LEFT_NEWS_COUNT)
    leftData.value = mainLeftItems.map((item) => mapNewsForLeft(item))
    mainPool.value = orderedMain.slice(LEFT_NEWS_COUNT)
    leftmostData.value = orderedMain

    const orderedSub = Array.isArray(subWeibo.list) ? [...subWeibo.list] : []
    const subLeftItems = orderedSub.slice(0, LEFT_NEWS_COUNT)
    rightData.value = subLeftItems.map((item) => mapNewsForLeft(item))
    subPool.value = orderedSub.slice(LEFT_NEWS_COUNT)
    rightmostData.value = orderedSub
  } catch (error) {
    loadError.value = error?.message || '加载榜单失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.channel-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.channel-masthead {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.masthead-copy,
.channel-switch,
.feature-column,
.brief-rail,
.state-card {
  position: relative;
  border-radius: 28px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.masthead-copy,
.feature-column,
.brief-rail,
.state-card {
  padding: 24px;
}

.masthead-copy::before,
.channel-switch::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(circle at 82% 22%, rgba(196, 106, 45, 0.12), transparent 22%);
}

.masthead-kicker,
.section-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.masthead-title {
  margin: 14px 0 0;
  font-family: var(--font-family-display);
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  max-width: 8ch;
  position: relative;
  z-index: 1;
}

.masthead-desc {
  margin-top: 18px;
  max-width: 54ch;
  color: var(--text-secondary);
  line-height: 1.8;
  position: relative;
  z-index: 1;
}

.channel-switch {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.channel-switch__btn,
.channel-switch__link {
  position: relative;
  z-index: 1;
  border: 1px solid var(--border-soft);
  border-radius: 22px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  text-align: left;
  text-decoration: none;
  padding: 18px;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.channel-switch__btn:hover,
.channel-switch__btn:focus-visible,
.channel-switch__link:hover,
.channel-switch__link:focus-visible {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  outline: none;
}

.channel-switch__link {
  background:
    radial-gradient(circle at top right, rgba(47, 108, 116, 0.16), transparent 40%),
    var(--bg-elevated);
}

.channel-switch__btn--active {
  border-color: rgba(196, 106, 45, 0.26);
  background: linear-gradient(180deg, rgba(255, 248, 238, 0.96), rgba(247, 229, 209, 0.92));
  box-shadow: 0 18px 34px rgba(196, 106, 45, 0.08), var(--shadow-inset);
}

.channel-switch__label {
  display: block;
  font-weight: 700;
  font-size: 1rem;
}

.channel-switch__hint {
  display: block;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.6;
}

.state-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.state-card--notice {
  color: var(--text-primary);
}

.state-card--error {
  border-color: var(--danger-border);
  background: linear-gradient(180deg, var(--bg-elevated), var(--danger-bg));
}

.retry-btn,
.load-more-btn,
.rail-action,
.feature-card__link {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 999px;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.retry-btn,
.load-more-btn {
  padding: 10px 16px;
  font-weight: 700;
}

.retry-btn:hover,
.load-more-btn:hover,
.rail-action:hover:not(:disabled),
.feature-card__link:hover {
  transform: translateY(-1px);
  border-color: var(--border-strong);
}

.channel-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.8fr);
  gap: 20px;
  align-items: start;
}

.feature-column,
.brief-rail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.section-head--rail {
  align-items: start;
  flex-direction: column;
}

.section-title {
  margin-top: 8px;
  font-family: var(--font-family-display);
  font-size: 1.8rem;
  line-height: 1;
}

.section-desc {
  max-width: 42ch;
  color: var(--text-secondary);
  line-height: 1.7;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feature-card,
.rail-item {
  border: 1px solid var(--border-soft);
  border-radius: 24px;
  background: var(--bg-elevated);
  box-shadow: var(--shadow-inset);
}

.feature-card {
  padding: 18px;
  display: grid;
  gap: 14px;
}

.feature-card__head,
.feature-card__foot,
.rail-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.feature-card__index,
.feature-card__metric,
.rail-item__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.82rem;
  font-weight: 700;
}

.rail-item__rank {
  min-width: 46px;
  height: 46px;
  border-radius: 18px;
}

.rail-item__rank--top {
  background: rgba(196, 106, 45, 0.18);
}

.feature-card__body {
  display: grid;
  gap: 12px;
}

.feature-card__title,
.rail-item__title {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.feature-card__title {
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.6;
}

.feature-card__overview,
.rail-item__overview {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.72;
}

.feature-card__overview {
  font-size: 0.9rem;
}

.rail-item__title {
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.6;
}

.rail-item__overview {
  margin-top: 8px;
  font-size: 0.82rem;
}

.feature-card__cover-shell {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.feature-card__cover {
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-muted));
  border: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image,
.cover-overlay {
  position: absolute;
  inset: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.1));
}

.feature-card__placeholder,
.feature-card__source,
.rail-item__meta {
  color: var(--text-secondary);
}

.feature-card__link {
  padding: 8px 14px;
  font-size: 0.8rem;
}

.rail-list {
  display: grid;
  gap: 12px;
}

.rail-item {
  padding: 14px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.rail-item__main {
  min-width: 0;
}

.rail-item__meta {
  justify-content: flex-start;
  margin-top: 6px;
  font-size: 0.78rem;
}

.rail-item__actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rail-action {
  padding: 8px 12px;
  font-size: 0.76rem;
  font-weight: 700;
}

.rail-action--soft {
  background: var(--bg-card);
}

.rail-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .channel-stage,
  .channel-masthead {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: start;
  }

  .rail-item {
    grid-template-columns: 1fr;
  }

  .rail-item__actions {
    justify-content: flex-start;
  }
}
</style>
