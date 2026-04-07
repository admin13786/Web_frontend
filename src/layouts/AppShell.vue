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
        <img :src="brandLogoSrc" alt="CogniMatrix" class="topbar-logo" />
        <div class="topbar-copy">
          <div class="topbar-title">{{ currentMeta.title || '内容工作台' }}</div>
          <div class="topbar-subtitle">{{ currentMeta.description || '统一侧边栏工作区' }}</div>
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

.app-shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
}

.app-shell__main {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-shell__topbar {
  display: none;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--topbar-border);
  background: var(--topbar-bg);
  backdrop-filter: blur(18px);
}

.topbar-menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--bg-glass-border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.topbar-logo {
  width: 40px;
  height: 40px;
  padding: 4px;
  border-radius: 12px;
  background: var(--brand-mark-bg);
  border: 1px solid var(--brand-mark-border);
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.topbar-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.topbar-subtitle {
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.app-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

@media (max-width: 960px) {
  .app-shell__topbar {
    display: flex;
  }

  .app-shell__content {
    padding: 16px;
  }
}
</style>
