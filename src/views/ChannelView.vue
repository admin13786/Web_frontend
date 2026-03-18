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

    <div class="leaderboard-content" :class="{ 'is-sub': !isMainRanking }">
      <!-- 主频道：本周新榜 + 创意精选 -->
      <template v-if="isMainRanking">
        <div class="side-column leaderboard-col weibo-column">
          <h3 class="column-title">本周新榜</h3>
          <div
            v-for="(item, index) in leftmostData"
            :key="'leftmost-' + item.id"
            class="weibo-rank-item"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.05 } }"
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

        <div class="side-column leaderboard-col video-column">
          <h3 class="column-title">创意精选</h3>
          <div
            v-for="(item, index) in leftData"
            :key="item.id"
            class="leaderboard-item"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: (index + 3) * 0.05 } }"
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
      </template>

      <!-- 副频道：热门推荐 + 技能提升（热门推荐在左，技能提升在右） -->
      <template v-else>
        <div class="side-column leaderboard-col weibo-column">
          <h3 class="column-title">热门推荐</h3>
          <div
            v-for="(item, index) in rightmostData"
            :key="'rightmost-' + item.id"
            class="weibo-rank-item"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.05 } }"
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

        <div class="side-column leaderboard-col video-column">
          <h3 class="column-title">技能提升</h3>
          <div
            v-for="(item, index) in rightData"
            :key="item.id"
            class="leaderboard-item"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: (index + 3) * 0.05 } }"
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
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isMainRanking = ref(true)

function switchToMain() {
  isMainRanking.value = true
}

function switchToSub() {
  isMainRanking.value = false
}

const leftmostData = ref([
  { id: 1, title: 'AI 绘画入门：Stable Diffusion 从零到精通的完整指南。', viewsNum: '923847', tag: '热' },
  { id: 2, title: 'ChatGPT 实战：提升工作效率的 50 个提示词技巧。', viewsNum: '785621', tag: '新' },
  { id: 3, title: 'Web3 与元宇宙：区块链技术应用入门解析。', viewsNum: '652341', tag: '' },
  { id: 4, title: 'Midjourney 提示词大全：从入门到出图。', viewsNum: '445237', tag: '新' },
  { id: 5, title: 'Notion AI 工作流：打造个人知识库。', viewsNum: '382186', tag: '' },
  { id: 6, title: 'Python 数据分析实战：Pandas 与可视化入门。', viewsNum: '356421', tag: '' },
  { id: 7, title: 'Figma 设计入门：从零开始做 UI 设计。', viewsNum: '298734', tag: '新' },
  { id: 8, title: 'Docker 容器化部署：从入门到生产环境。', viewsNum: '245891', tag: '' },
  { id: 9, title: 'TypeScript 进阶：类型系统与工程化实践。', viewsNum: '198562', tag: '' },
  { id: 10, title: 'Rust 编程入门：系统级语言从零到精通。', viewsNum: '156234', tag: '' }
])

const leftData = ref([
  { id: 1, title: '【精选】年度最佳创意短片合集，带你领略视觉艺术的边界与可能。', views: '128万' },
  { id: 2, title: '深度解析：从零到一的品牌设计思维，设计师必看的实战案例分享。', views: '96万' },
  { id: 3, title: '前端架构演进之路：Vue 3 + Vite 构建高性能应用的完整实践。', views: '84万' },
  { id: 4, title: '创意摄影技巧：手机也能拍出电影感大片。', views: '72万' },
  { id: 5, title: '动画制作入门：After Effects 从零到出片。', views: '65万' },
  { id: 6, title: '品牌视觉设计：Logo 与 VI 系统完整指南。', views: '58万' },
  { id: 7, title: '短视频脚本写作：爆款内容的底层逻辑。', views: '52万' },
  { id: 8, title: '3D 建模入门：Blender 零基础到独立创作。', views: '46万' },
  { id: 9, title: '插画风格探索：从扁平到赛博朋克的视觉语言。', views: '41万' },
  { id: 10, title: '动态海报设计：Motion Graphics 实战教程。', views: '38万' }
])

const rightData = ref([
  { id: 1, title: '音乐制作入门：如何在 30 天内掌握基础混音与编曲技巧。', views: '72万' },
  { id: 2, title: '摄影后期调色教程：打造电影感画面的 Lightroom 预设分享。', views: '58万' },
  { id: 3, title: '产品经理的日常：从需求分析到原型设计的完整工作流。', views: '45万' },
  { id: 4, title: 'Excel 进阶：数据透视表与 Power Query 实战。', views: '42万' },
  { id: 5, title: 'PPT 设计进阶：从模板到原创的视觉表达。', views: '38万' },
  { id: 6, title: '写作技巧提升：从零开始写出爆款文章。', views: '35万' },
  { id: 7, title: '英语口语速成：职场沟通必备表达。', views: '32万' },
  { id: 8, title: '项目管理入门：敏捷开发与 Scrum 实践。', views: '28万' },
  { id: 9, title: '逻辑思维训练：结构化表达与批判性思考。', views: '25万' },
  { id: 10, title: '时间管理法则：GTD 与番茄工作法实战。', views: '22万' }
])

const rightmostData = ref([
  { id: 1, title: '生活 Vlog 剪辑：手机剪映从入门到出片的完整流程。', viewsNum: '882104', tag: '热' },
  { id: 2, title: '健身跟练：30 天腹肌养成计划，科学燃脂塑形。', viewsNum: '761892', tag: '新' },
  { id: 3, title: '美食探店：城市隐藏宝藏餐厅大揭秘。', viewsNum: '623456', tag: '' },
  { id: 4, title: '旅行攻略：周末短途游的 10 个宝藏目的地。', viewsNum: '512034', tag: '新' },
  { id: 5, title: '居家收纳：小户型空间利用技巧分享。', viewsNum: '408721', tag: '' },
  { id: 6, title: '宠物养护指南：猫咪与狗狗的日常护理。', viewsNum: '365234', tag: '' },
  { id: 7, title: '咖啡入门：从手冲到拉花的完整指南。', viewsNum: '312567', tag: '新' },
  { id: 8, title: '植物养护：室内绿植从养活到养好。', viewsNum: '268901', tag: '' },
  { id: 9, title: '手工 DIY：低成本改造出租屋。', viewsNum: '225634', tag: '' },
  { id: 10, title: '极简生活：断舍离与 minimalist 生活方式。', viewsNum: '198456', tag: '' }
])
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

.leaderboard-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.6fr;
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
    grid-template-columns: 1fr 1.3fr;
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
