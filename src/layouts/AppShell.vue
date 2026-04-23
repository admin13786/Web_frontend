<template>
  <div class="app-shell">
    <AppSidebar :is-mobile-open="mobileSidebarOpen" @close-mobile="mobileSidebarOpen = false" />

    <div
      v-if="mobileSidebarOpen"
      class="app-shell__overlay"
      @click="mobileSidebarOpen = false"
    />

    <main class="app-shell__main">
      <header class="app-shell__topbar">
        <button
          type="button"
          class="topbar-menu-btn"
          aria-label="打开导航"
          @click="mobileSidebarOpen = true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <img :src="brandLogoSrc" alt="灵境" class="topbar-logo" />
        <div class="topbar-copy">
          <div class="topbar-kicker">LINGJING / WEB DESK</div>
          <div class="topbar-title">{{ currentMeta.title || '内容工坊' }}</div>
          <div class="topbar-subtitle">{{ currentMeta.description || '把灵感整理成可执行的页面与能力模块' }}</div>
        </div>
      </header>

      <section class="app-shell__content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'

const route = useRoute()
const mobileSidebarOpen = ref(false)

const currentMeta = computed(() => route.meta || {})
const brandLogoSrc = computed(() => '/branding/cognimatrix-logo-cutout.png')

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
  },
)
</script>

<style scoped>
.app-shell {
  height: 100vh;
  min-height: 100vh;
  display: flex;
  position: relative;
  background: var(--shell-bg);
  overflow: hidden;
}

.app-shell::before,
.app-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.app-shell::before {
  background:
    radial-gradient(circle at 20% 12%, rgba(196, 106, 45, 0.08), transparent 28%),
    radial-gradient(circle at 82% 8%, rgba(111, 123, 92, 0.06), transparent 24%);
  opacity: 0.9;
}

.app-shell::after {
  background-image:
    linear-gradient(rgba(124, 98, 74, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 98, 74, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.42), transparent 72%);
  opacity: 0.65;
}

.app-shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: var(--bg-overlay-strong);
}

.app-shell__main {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.app-shell__topbar {
  display: none;
  align-items: center;
  gap: 14px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--topbar-border);
  background: var(--topbar-bg);
  box-shadow: var(--shadow-inset), var(--shadow-soft);
}

.topbar-menu-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-inset);
}

.topbar-logo {
  width: 44px;
  height: 44px;
  padding: 6px;
  border-radius: 14px;
  background: var(--brand-mark-bg);
  border: 1px solid var(--brand-mark-border);
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.topbar-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.topbar-kicker {
  font-family: var(--font-family-mono);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.topbar-title {
  font-family: var(--font-family-display);
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.topbar-subtitle {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.app-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 36px;
  overflow-y: auto;
  overscroll-behavior: contain;
  position: relative;
  z-index: 1;
}

[data-theme='dark'] .app-shell::before {
  background:
    radial-gradient(circle at 18% 8%, rgba(201, 138, 74, 0.14), transparent 24%),
    radial-gradient(circle at 86% 4%, rgba(156, 166, 134, 0.08), transparent 18%),
    linear-gradient(180deg, rgba(255, 244, 228, 0.03), transparent 28%);
  opacity: 1;
}

[data-theme='dark'] .app-shell::after {
  background-image:
    linear-gradient(rgba(230, 201, 171, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(230, 201, 171, 0.028) 1px, transparent 1px);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.22), transparent 78%);
  opacity: 0.42;
}

[data-theme='dark'] .app-shell__topbar {
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

[data-theme='dark'] .topbar-menu-btn {
  background: rgba(38, 29, 24, 0.92);
  border-color: rgba(230, 201, 171, 0.16);
}

@media (max-width: 960px) {
  .app-shell__topbar {
    display: flex;
  }

  .app-shell__content {
    padding: 18px;
  }
}
</style>

