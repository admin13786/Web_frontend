<template>
  <div class="channel-page">
    <div class="channel-header">
      <router-link to="/home" class="back-link">← 返回主页</router-link>
      <div class="title-group">
        <!-- 主榜在左时：频道排行榜大、副频道排行榜小（右下角） -->
        <template v-if="isMainRanking">
          <div class="title-row">
            <h1 class="page-title title-main" @click="switchToMain">频道排行榜</h1>
            <span class="page-title title-sub sub-badge" @click="switchToSub">副频道排行榜</span>
          </div>
        </template>
        <!-- 副榜在左时：副频道排行榜大、频道排行榜小（右下角），交换顺序 -->
        <template v-else>
          <div class="title-row">
            <h1 class="page-title title-main" @click="switchToSub">副频道排行榜</h1>
            <span class="page-title title-sub sub-badge" @click="switchToMain">频道排行榜</span>
          </div>
        </template>
      </div>
    </div>

    <div class="leaderboard-nav">
      <span class="nav-arrows">‹ ›</span>
    </div>

    <div v-if="loadError" class="load-error">
      <p>{{ loadError }}</p>
      <button type="button" class="retry-btn" @click="fetchAll">重试</button>
    </div>
    <div v-else-if="loading" class="load-state">加载中…</div>
    <div v-else class="leaderboard-content" :class="{ 'is-sub': !isMainRanking }">
      <!-- 主频道：创意精选（左）+ 本周新榜（右） -->
      <template v-if="isMainRanking">
        <div class="side-column leaderboard-col video-column">
          <h3 class="column-title">创意精选</h3>
          <div
            v-for="(item, index) in leftData"
            :key="item.id"
            class="leaderboard-item"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.05 } }"
          >
            <div class="item-content">
              <p class="item-title">{{ item.title }}</p>
              <div class="video-placeholder">
                <div class="video-cover">
                  <span class="play-icon">▶</span>
                  <span class="video-label">视频 {{ item.id }}</span>
                </div>
              </div>
            </div>
            <div class="item-meta">
              <span class="item-rank" :class="{ 'rank-top': item.id <= 3 }">#{{ item.id }}</span>
              <span class="item-views">{{ item.views }} 播放</span>
            </div>
          </div>
        </div>

        <div class="side-column leaderboard-col weibo-column">
          <h3 class="column-title">本周新榜</h3>
          <div
            v-for="(item, index) in leftmostData"
            :key="'leftmost-' + item.id"
            class="weibo-rank-item"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: (index + 3) * 0.05 } }"
          >
            <span class="weibo-rank-num" :class="{ 'rank-top3': item.id <= 3 }">{{ item.id }}</span>
            <div class="weibo-rank-content">
              <span class="weibo-rank-title">{{ item.title }}</span>
              <div class="weibo-rank-meta">
                <span class="weibo-rank-count">{{ item.viewsNum }}</span>
                <span v-if="item.tag" class="weibo-tag" :class="'tag-' + item.tag">{{ item.tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 副频道：技能提升（左）+ 热门推荐（右） -->
      <template v-else>
        <div class="side-column leaderboard-col video-column">
          <h3 class="column-title">技能提升</h3>
          <div
            v-for="(item, index) in rightData"
            :key="item.id"
            class="leaderboard-item"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.05 } }"
          >
            <div class="item-content">
              <p class="item-title">{{ item.title }}</p>
              <div class="video-placeholder">
                <div class="video-cover">
                  <span class="play-icon">▶</span>
                  <span class="video-label">视频 {{ item.id }}</span>
                </div>
              </div>
            </div>
            <div class="item-meta">
              <span class="item-rank" :class="{ 'rank-top': item.id <= 3 }">#{{ item.id }}</span>
              <span class="item-views">{{ item.views }} 播放</span>
            </div>
          </div>
        </div>

        <div class="side-column leaderboard-col weibo-column">
          <h3 class="column-title">热门推荐</h3>
          <div
            v-for="(item, index) in rightmostData"
            :key="'rightmost-' + item.id"
            class="weibo-rank-item"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: (index + 3) * 0.05 } }"
          >
            <span class="weibo-rank-num" :class="{ 'rank-top3': item.id <= 3 }">{{ item.id }}</span>
            <div class="weibo-rank-content">
              <span class="weibo-rank-title">{{ item.title }}</span>
              <div class="weibo-rank-meta">
                <span class="weibo-rank-count">{{ item.viewsNum }}</span>
                <span v-if="item.tag" class="weibo-tag" :class="'tag-' + item.tag">{{ item.tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRankVideo, getRankWeibo } from '../api/rank.js'

const isMainRanking = ref(true)
const leftData = ref([])
const rightData = ref([])
const leftmostData = ref([])
const rightmostData = ref([])
const loading = ref(true)
const loadError = ref('')

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
    const [mainVideo, mainWeibo, subVideo, subWeibo] = await Promise.all([
      getRankVideo('main'),
      getRankWeibo('main'),
      getRankVideo('sub'),
      getRankWeibo('sub'),
    ])
    leftData.value = mainVideo.list || []
    leftmostData.value = mainWeibo.list || []
    rightData.value = subVideo.list || []
    rightmostData.value = subWeibo.list || []
  } catch (e) {
    loadError.value = e.message || '加载排行榜失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.channel-page {
  min-height: 100vh;
  padding: 32px 24px;
}

.channel-header {
  max-width: 1400px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  transition: color var(--transition-fast);
  flex-shrink: 0;
}

.back-link:hover {
  color: var(--accent);
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.title-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 16px;
  position: relative;
}

.page-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0;
  cursor: pointer;
  transition: color var(--transition-fast), font-size var(--transition-fast);
}

.page-title.title-main {
  font-size: 1.75rem;
  color: var(--text-primary);
}

.page-title.title-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-left: auto;
  padding-bottom: 4px;
}

.page-title.sub-badge:hover {
  color: var(--accent);
}

.page-title.title-main:hover {
  color: var(--accent);
}

.leaderboard-nav {
  max-width: 1400px;
  margin: 0 auto 24px;
  display: flex;
  justify-content: center;
}

.nav-arrows {
  font-size: 1.25rem;
  color: var(--text-muted);
  letter-spacing: 0.5em;
}

.load-error,
.load-state {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-secondary);
}

.load-error p {
  margin: 0 0 16px;
}

.retry-btn {
  padding: 10px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  cursor: pointer;
}

.retry-btn:hover {
  background: var(--accent-hover);
}

.leaderboard-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2.2fr 0.7fr;
  gap: 20px;
  align-items: start;
}

.leaderboard-col {
  min-width: 0;
}

.video-column {
  min-width: 0;
}

.column-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  padding-left: 4px;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.leaderboard-item {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.leaderboard-item:hover {
  box-shadow: var(--shadow-card);
}

.item-content {
  padding: 24px;
}

.item-title {
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 16px;
}

.video-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.video-cover {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05));
}

.play-icon {
  font-size: 2.5rem;
  color: var(--accent);
  opacity: 0.9;
}

.video-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.item-meta {
  padding: 16px 24px;
  border-top: 1px solid var(--bg-glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.item-rank {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-muted);
}

.item-rank.rank-top {
  color: var(--accent);
}

.item-views {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 微博热搜风格 */
.weibo-column {
  gap: 10px;
}

.weibo-rank-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  transition: background var(--transition-fast);
}

.weibo-rank-item:hover {
  background: var(--bg-card-hover);
}

.weibo-rank-num {
  flex-shrink: 0;
  width: 24px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #f97316;
  line-height: 1.4;
}

.weibo-rank-num.rank-top3 {
  color: #ef4444;
}

.weibo-rank-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weibo-rank-title {
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.45;
}

.weibo-rank-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weibo-rank-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.weibo-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.weibo-tag.tag-热 {
  background: #ef4444;
  color: white;
}

.weibo-tag.tag-新 {
  background: #ef4444;
  color: white;
}

.weibo-tag.tag-重磅 {
  background: #64748b;
  color: white;
}

.weibo-tag.tag-首发 {
  background: #38bdf8;
  color: white;
}

/* 响应式 */
@media (max-width: 1200px) {
  .leaderboard-content {
    grid-template-columns: 1.6fr 0.8fr;
  }
}

@media (max-width: 768px) {
  .leaderboard-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .title-row {
    flex-wrap: wrap;
  }

  .page-title.title-sub {
    margin-left: 0;
    padding-bottom: 0;
  }
}
</style>
