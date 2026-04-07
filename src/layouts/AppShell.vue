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

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
  },
)
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  position: relative;
  background:
    radial-gradient(circle at top, rgba(99, 102, 241, 0.12), transparent 30%),
    linear-gradient(180deg, #1b1c23 0%, #15161c 100%);
}

.app-shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(6, 8, 14, 0.6);
  backdrop-filter: blur(4px);
}

.app-shell__main {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-shell__topbar {
  display: none;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(17, 18, 24, 0.9);
  backdrop-filter: blur(18px);
}

.topbar-menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
