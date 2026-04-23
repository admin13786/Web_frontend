<template>
  <div class="home-page">
    <div class="home-bg" />
    <div class="home-shell">
      <div class="home-lead">
        <div class="home-copy">
          <span class="home-kicker">LINGJING / EDITORIAL DESK</span>
          <h1 class="home-title">把今天的 AI 灵感编排进你的桌面</h1>
          <p class="home-subtitle">
            从热点、创作到课堂，把你今天要看的 AI 线索与产出放进同一张编辑工作台。
          </p>
        </div>

        <div class="account-bar">
          <div class="account-chip">
            <span class="account-label">账号</span>
            <strong>{{ userName }}</strong>
          </div>
          <button type="button" class="account-logout" @click="logout">退出</button>
        </div>
      </div>

      <div class="desk-curation">
        <div class="desk-curation__copy">
          <span class="desk-curation__kicker">DESK ARRANGEMENT</span>
          <p class="desk-curation__text">先看热点，再进工坊推进创作，最后切到课堂继续沉浸体验，整套路径都围绕你的账号独立保存。</p>
        </div>
        <div class="desk-curation__tabs" role="group" aria-label="桌面入口切换">
          <button
            v-for="item in deckOptions"
            :key="item.key"
            type="button"
            class="desk-tab"
            :class="{ 'desk-tab--active': centerCard === item.key }"
            :aria-pressed="centerCard === item.key"
            @click="setFocusCard(item.key)"
          >
            <span class="desk-tab__eyebrow">{{ item.eyebrow }}</span>
            <span class="desk-tab__label">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <div class="home-layout">
        <div
          class="card slot-left"
          :class="slotClass(leftCard)"
          v-motion
          :initial="{ opacity: 0, x: -30 }"
          :enter="{ opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 } }"
          role="link"
          tabindex="0"
          :aria-label="navigationLabel(leftCard)"
          @click="handleSlotNavigate(leftCard)"
          @keydown.enter.prevent="handleSlotNavigate(leftCard)"
          @keydown.space.prevent="handleSlotNavigate(leftCard)"
        >
          <Transition name="card-fade" mode="out-in">
            <slot-content
              :key="'left-' + leftCard"
              :card="leftCard"
              :featured="false"
            />
          </Transition>
        </div>

        <div
          class="card slot-center"
          :class="slotClass(centerCard)"
          v-motion
          :initial="{ opacity: 0, y: -20 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }"
          role="link"
          tabindex="0"
          :aria-label="navigationLabel(centerCard)"
          @click="handleSlotNavigate(centerCard)"
          @keydown.enter.prevent="handleSlotNavigate(centerCard)"
          @keydown.space.prevent="handleSlotNavigate(centerCard)"
        >
          <Transition name="card-fade" mode="out-in">
            <slot-content
              :key="'center-' + centerCard"
              :card="centerCard"
              :featured="true"
            />
          </Transition>
        </div>

        <div
          class="card slot-right"
          :class="slotClass(rightCard)"
          v-motion
          :initial="{ opacity: 0, x: 30 }"
          :enter="{ opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.3 } }"
          role="link"
          tabindex="0"
          :aria-label="navigationLabel(rightCard)"
          @click="handleSlotNavigate(rightCard)"
          @keydown.enter.prevent="handleSlotNavigate(rightCard)"
          @keydown.space.prevent="handleSlotNavigate(rightCard)"
        >
          <Transition name="card-fade" mode="out-in">
            <slot-content
              :key="'right-' + rightCard"
              :card="rightCard"
              :featured="false"
            />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout as logoutApi } from '../api/auth.js'
import SlotContent from '../components/HomeSlotContent.vue'
import { getOpenMAICAppUrl } from '../config.js'
import { clearCurrentUser, getCurrentUser, getUserDisplayName } from '../utils/auth.js'

const router = useRouter()
const currentUser = getCurrentUser()

const deckOptions = [
  { key: 'channel', label: 'AI趣闻萃取', eyebrow: 'NEWS' },
  { key: 'workshop', label: 'AI工坊', eyebrow: 'WORKSHOP' },
  { key: 'remain', label: 'OpenMAIC', eyebrow: 'CLASSROOM' },
]

const order = ref(['channel', 'workshop', 'remain'])
const isAnimating = ref(false)
const TRANSITION_DURATION = 320
const userName = computed(() => getUserDisplayName(currentUser) || '未登录')

const leftCard = computed(() => order.value[0])
const centerCard = computed(() => order.value[1])
const rightCard = computed(() => order.value[2])

const focusLayouts = {
  channel: ['remain', 'channel', 'workshop'],
  workshop: ['channel', 'workshop', 'remain'],
  remain: ['workshop', 'remain', 'channel'],
}

function slotClass(card) {
  return {
    'is-channel': card === 'channel',
    'is-workshop': card === 'workshop',
    'is-remain': card === 'remain',
  }
}

function setFocusCard(card) {
  if (isAnimating.value || centerCard.value === card) return
  isAnimating.value = true
  order.value = [...focusLayouts[card]]
  setTimeout(() => {
    isAnimating.value = false
  }, TRANSITION_DURATION)
}

function handleSlotNavigate(card) {
  if (card === 'channel') {
    router.push('/channel')
    return
  }
  if (card === 'workshop') {
    router.push('/workshop')
    return
  }
  if (card === 'remain') {
    window.location.assign(getOpenMAICAppUrl())
  }
}

function navigationLabel(card) {
  if (card === 'channel') return '打开 AI趣闻萃取'
  if (card === 'workshop') return '打开 AI工坊'
  return '打开 OpenMAIC'
}

async function logout() {
  await logoutApi().catch(() => null)
  clearCurrentUser()
  router.push('/login')
}
</script>

<style scoped>
.home-page {
  display: flex;
  justify-content: center;
  padding: 8px 8px 20px;
  position: relative;
}

.home-shell {
  width: min(1220px, 100%);
  display: flex;
  flex-direction: column;
  gap: 22px;
  position: relative;
  z-index: 1;
}

.home-lead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.home-copy {
  max-width: 680px;
}

.home-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
  margin-bottom: 12px;
}

.home-title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(2.3rem, 4.6vw, 4.15rem);
  line-height: 1.02;
  letter-spacing: 0.01em;
  max-width: 10ch;
}

.home-subtitle {
  margin-top: 14px;
  max-width: 48ch;
  font-size: 0.98rem;
  line-height: 1.78;
  color: var(--text-secondary);
}

.desk-curation {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.desk-curation__copy {
  max-width: 44ch;
}

.desk-curation__kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  color: var(--kicker-color);
}

.desk-curation__text {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.68;
  font-size: 0.92rem;
}

.desk-curation__tabs {
  display: flex;
  align-items: stretch;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.desk-tab {
  min-width: 138px;
  padding: 12px 15px;
  border-radius: 18px;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.desk-tab:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  background: var(--bg-card-hover);
}

.desk-tab--active {
  background: linear-gradient(180deg, rgba(196, 106, 45, 0.16), rgba(196, 106, 45, 0.08));
  border-color: rgba(196, 106, 45, 0.28);
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.desk-tab__eyebrow {
  font-family: var(--font-family-mono);
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

.desk-tab__label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent-strong);
}

.account-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.account-chip {
  padding: 12px 16px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-soft);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  box-shadow: var(--shadow-inset);
}

.account-label {
  color: var(--text-secondary);
}

.account-logout {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 999px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.account-logout:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.home-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 54% 44% at 16% 6%, rgba(196, 106, 45, 0.12), transparent 62%),
    radial-gradient(ellipse 44% 34% at 82% 10%, rgba(111, 123, 92, 0.12), transparent 60%);
  pointer-events: none;
}

.home-layout {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(248px, 0.92fr) minmax(320px, 1.18fr) minmax(260px, 1fr);
  grid-template-areas: 'left center right';
  gap: 24px;
  align-items: start;
}

.card-fade-enter-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
}

.card-fade-enter-to,
.card-fade-leave-from {
  opacity: 1;
}

.slot-left {
  grid-area: left;
  margin-top: 84px;
  min-height: 318px;
  opacity: 0.94;
}

.slot-center {
  grid-area: center;
  min-height: 428px;
  z-index: 2;
}

.slot-right {
  grid-area: right;
  margin-top: 118px;
  min-height: 346px;
  opacity: 0.94;
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card), var(--shadow-inset);
  padding: 28px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 100%;
  transition: box-shadow var(--transition-smooth), background var(--transition-smooth), transform var(--transition-smooth),
    border-color var(--transition-fast);
}

.card:focus-visible {
  outline: 2px solid rgba(196, 106, 45, 0.34);
  outline-offset: 4px;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent 36%),
    linear-gradient(135deg, rgba(196, 106, 45, 0.05), transparent 55%);
  pointer-events: none;
}

.card::after {
  content: '';
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: calc(var(--radius-xl) - 10px);
  pointer-events: none;
}

.card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-hover), var(--shadow-inset);
  transform: translateY(-6px);
}

.slot-left:hover,
.slot-right:hover {
  opacity: 1;
}

.slot-center:hover {
  transform: translateY(-8px);
}

.slot-center::after {
  border-color: rgba(196, 106, 45, 0.18);
}

.is-channel {
  background:
    linear-gradient(180deg, rgba(255, 250, 245, 0.94), rgba(244, 234, 220, 0.96));
}

.is-channel::before {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.46), transparent 34%),
    radial-gradient(circle at top right, rgba(111, 123, 92, 0.12), transparent 36%);
}

.is-workshop {
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(247, 239, 229, 0.96));
}

.is-workshop::before {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.44), transparent 34%),
    radial-gradient(circle at top right, rgba(196, 106, 45, 0.16), transparent 34%);
}

.is-remain {
  background:
    linear-gradient(180deg, rgba(251, 247, 240, 0.96), rgba(240, 232, 219, 0.96));
}

.is-remain::before {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent 34%),
    radial-gradient(circle at top right, rgba(141, 70, 55, 0.14), transparent 36%);
}

[data-theme='dark'] .home-bg {
  background:
    radial-gradient(ellipse 52% 38% at 16% 4%, rgba(201, 138, 74, 0.18), transparent 58%),
    radial-gradient(ellipse 34% 24% at 84% 10%, rgba(156, 166, 134, 0.1), transparent 52%),
    radial-gradient(ellipse 42% 30% at 52% 100%, rgba(132, 95, 69, 0.08), transparent 62%);
}

[data-theme='dark'] .desk-curation {
  background:
    linear-gradient(180deg, #4a362f, #2c211d),
    var(--bg-card);
  border-color: rgba(230, 201, 171, 0.14);
}

[data-theme='dark'] .desk-tab {
  background:
    linear-gradient(180deg, #5d453b, #382921);
  border-color: rgba(230, 201, 171, 0.1);
  box-shadow: var(--shadow-inset);
}

[data-theme='dark'] .desk-tab:hover {
  background:
    linear-gradient(180deg, #6f5145, #433128);
}

[data-theme='dark'] .desk-tab--active {
  background:
    linear-gradient(180deg, rgba(201, 138, 74, 0.26), rgba(76, 51, 34, 0.72));
  border-color: rgba(230, 201, 171, 0.22);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 244, 228, 0.08);
}

[data-theme='dark'] .desk-tab__label {
  color: var(--text-primary);
}

[data-theme='dark'] .account-chip,
[data-theme='dark'] .account-logout {
  background:
    linear-gradient(180deg, #533d33, #31241e);
  border-color: rgba(230, 201, 171, 0.12);
}

[data-theme='dark'] .card {
  background:
    linear-gradient(180deg, #584036, #32251f);
  border-color: rgba(230, 201, 171, 0.1);
  box-shadow: var(--shadow-card), var(--shadow-inset);
}

[data-theme='dark'] .card::before {
  background:
    linear-gradient(180deg, rgba(255, 244, 228, 0.04), transparent 32%),
    radial-gradient(circle at top right, rgba(201, 138, 74, 0.16), transparent 36%);
}

[data-theme='dark'] .card::after {
  border-color: rgba(230, 201, 171, 0.08);
}

[data-theme='dark'] .card:hover {
  background:
    linear-gradient(180deg, #694b3f, #3b2b24);
  border-color: rgba(230, 201, 171, 0.2);
}

[data-theme='dark'] .is-channel {
  background:
    linear-gradient(180deg, #53423a, #2f2620);
}

[data-theme='dark'] .is-channel::before {
  background:
    linear-gradient(180deg, rgba(255, 244, 228, 0.03), transparent 32%),
    radial-gradient(circle at top right, rgba(156, 166, 134, 0.16), transparent 36%);
}

[data-theme='dark'] .is-workshop {
  background:
    linear-gradient(180deg, #5a4035, #32251f);
}

[data-theme='dark'] .is-workshop::before {
  background:
    linear-gradient(180deg, rgba(255, 244, 228, 0.04), transparent 30%),
    radial-gradient(circle at top right, rgba(201, 138, 74, 0.2), transparent 34%);
}

[data-theme='dark'] .is-remain {
  background:
    linear-gradient(180deg, #55403b, #31241f);
}

[data-theme='dark'] .is-remain::before {
  background:
    linear-gradient(180deg, rgba(255, 244, 228, 0.03), transparent 30%),
    radial-gradient(circle at top right, rgba(209, 145, 125, 0.18), transparent 36%);
}

@media (max-width: 1180px) {
  .home-layout {
    grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
    grid-template-areas:
      'center center'
      'left right';
  }

  .slot-left,
  .slot-right,
  .slot-center {
    margin-top: 0;
    min-height: 0;
  }

  .slot-center {
    min-height: 360px;
  }

  .slot-left,
  .slot-right {
    min-height: 280px;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 8px 0 16px;
  }

  .home-shell {
    gap: 18px;
  }

  .home-lead {
    flex-direction: column;
    gap: 18px;
  }

  .home-title {
    max-width: none;
    font-size: 2.2rem;
  }

  .home-subtitle {
    font-size: 0.94rem;
    max-width: none;
  }

  .desk-curation {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px;
  }

  .desk-curation__tabs {
    width: 100%;
    justify-content: stretch;
  }

  .desk-tab {
    flex: 1 1 100%;
    min-width: 0;
  }

  .account-bar {
    justify-content: space-between;
    width: 100%;
  }

  .home-layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .slot-left,
  .slot-center,
  .slot-right {
    width: 100%;
    min-height: 0;
    opacity: 1;
    margin-top: 0;
  }

  .card {
    min-height: 220px;
    padding: 24px;
  }
}
</style>

