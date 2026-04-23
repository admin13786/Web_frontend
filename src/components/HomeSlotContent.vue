<template>
  <div class="slot-content" :class="`slot-content--${card}`">
    <div class="card-head">
      <span class="card-kicker">{{ kicker }}</span>
      <span v-if="featured" class="card-badge">主入口</span>
    </div>
    <h2 class="card-title">{{ title }}</h2>
    <p class="card-desc">{{ desc }}</p>
    <div class="card-footer">
      <div class="card-entry">
        <span class="card-action">{{ action }}</span>
        <span class="card-support">{{ support }}</span>
      </div>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: { type: String, required: true },
  featured: { type: Boolean, default: false },
})

const content = {
  channel: {
    kicker: 'MORNING BRIEF',
    title: 'AI趣闻萃取',
    desc: '把今天最值得看的 3 条 AI 热点、AI 概览与原文线索整理成轻量晨读。',
    action: '浏览今日 3 条',
    support: '进入当天卡片与 AI 简报',
  },
  workshop: {
    kicker: 'CREATIVE DESK',
    title: 'AI工坊',
    desc: '输入你的想法，生成可预览页面、交互原型或轻量作品，把需求快速落成雏形。',
    action: '进入创意工坊',
    support: '继续你的个人对话与预览记录',
  },
  remain: {
    kicker: 'LIVE CLASSROOM',
    title: 'OpenMAIC',
    desc: '直接跳转到课堂端，继续使用沉浸式教学、互动讲解与场景化学习能力。',
    action: '打开 OpenMAIC',
    support: '保持当前主站工作流不被打断',
  },
}

const kicker = computed(() => content[props.card]?.kicker || '')
const title = computed(() => content[props.card]?.title || '')
const desc = computed(() => content[props.card]?.desc || '')
const action = computed(() => content[props.card]?.action || '')
const support = computed(() => content[props.card]?.support || '')
</script>

<style scoped>
.slot-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  width: 100%;
  height: 100%;
  gap: 14px;
  text-align: left;
}

.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-kicker {
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.card-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 252, 247, 0.86);
  color: var(--text-secondary);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
}

.card-title {
  font-family: var(--font-family-display);
  font-size: clamp(1.6rem, 2vw, 2.2rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: 0.01em;
  max-width: 12ch;
}

.card-desc {
  color: var(--text-secondary);
  font-size: 0.96rem;
  line-height: 1.75;
  max-width: 30ch;
}

.card-footer {
  width: 100%;
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-top: auto;
  gap: 12px;
}

.card-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-action {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-strong);
  letter-spacing: 0.04em;
}

.card-support {
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.6;
}

.card-arrow {
  font-size: 1.28rem;
  line-height: 1;
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.slot-content--channel .card-badge {
  background: rgba(111, 123, 92, 0.08);
}

.slot-content--workshop .card-badge {
  background: rgba(196, 106, 45, 0.1);
}

.slot-content--remain .card-badge {
  background: rgba(141, 70, 55, 0.08);
}

.slot-content--channel .card-arrow {
  color: var(--support-olive);
}

.slot-content--remain .card-arrow {
  color: var(--support-burgundy);
}

.slot-content--workshop .card-title {
  max-width: 8ch;
}

.slot-content--remain .card-title {
  max-width: none;
}

[data-theme='dark'] .card-badge {
  background: rgba(255, 244, 228, 0.05);
  border-color: rgba(230, 201, 171, 0.12);
  color: var(--text-secondary);
}

[data-theme='dark'] .slot-content--channel .card-badge {
  background: rgba(156, 166, 134, 0.12);
}

[data-theme='dark'] .slot-content--workshop .card-badge {
  background: rgba(201, 138, 74, 0.14);
}

[data-theme='dark'] .slot-content--remain .card-badge {
  background: rgba(209, 145, 125, 0.12);
}

[data-theme='dark'] .card-title {
  color: var(--text-primary);
}

[data-theme='dark'] .card-desc,
[data-theme='dark'] .card-support {
  color: rgba(232, 214, 192, 0.78);
}

@media (max-width: 768px) {
  .slot-content {
    gap: 12px;
  }

  .card-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-title {
    max-width: none;
    font-size: 1.45rem;
  }

  .card-desc {
    max-width: none;
    font-size: 0.92rem;
  }
}
</style>

