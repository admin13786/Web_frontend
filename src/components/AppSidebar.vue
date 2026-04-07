<template>
  <aside class="app-sidebar" :class="{ 'app-sidebar--mobile-open': isMobileOpen }">
    <div class="app-sidebar__brand">
      <div class="brand-mark">LW</div>
      <div>
        <div class="brand-title">教育</div>
        <div class="brand-subtitle">内容工作台</div>
      </div>
      <button type="button" class="mobile-close-btn" @click="$emit('close-mobile')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <nav class="app-sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ 'nav-item--active': isActive(item) }"
        @click="$emit('close-mobile')"
      >
        <span class="nav-item__icon" v-html="item.icon" />
        <span class="nav-item__copy">
          <span class="nav-item__label">{{ item.label }}</span>
          <span class="nav-item__desc">{{ item.description }}</span>
        </span>
      </RouterLink>
    </nav>

    <div class="app-sidebar__user">
      <div class="user-meta">
        <div class="user-label">当前用户</div>
        <div class="user-name">{{ userName }}</div>
      </div>
      <button type="button" class="logout-btn" @click="logout">退出登录</button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout as logoutApi } from '../api/auth.js'
import { clearCurrentUser, getCurrentUser, getUserDisplayName } from '../utils/auth.js'

defineProps({
  isMobileOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close-mobile'])

const router = useRouter()
const route = useRoute()
const currentUser = getCurrentUser()

const userName = computed(() => getUserDisplayName(currentUser) || '未登录')

const navItems = [
  {
    label: '频道排行榜',
    description: '热点排行与讲解入口',
    to: '/channel',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="4" height="10" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="17" rx="1"/></svg>',
  },
  {
    label: '创意工坊',
    description: '对话生成与结果预览',
    to: '/workshop',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z"/><path d="M12 8v8"/><path d="M8.5 10l7 4"/></svg>',
  },
  {
    label: 'OpenMAIC',
    description: '内嵌应用入口',
    to: '/openmaic',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 20h8"/><path d="M12 18v2"/></svg>',
  },
]

function isActive(item) {
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

async function logout() {
  await logoutApi().catch(() => null)
  clearCurrentUser()
  router.push('/login')
}
</script>

<style scoped>
.app-sidebar {
  width: 252px;
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(24, 26, 34, 0.98), rgba(20, 21, 28, 0.94)),
    rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  overflow-y: auto;
}

.app-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: #eef2ff;
  background: linear-gradient(135deg, #4f46e5, #0ea5e9);
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.28);
}

.brand-title {
  font-size: 1rem;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.mobile-close-btn {
  display: none;
  margin-left: auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  align-items: center;
  justify-content: center;
}

.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.02);
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}

.nav-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item--active {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(129, 140, 248, 0.3);
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.08);
}

.nav-item__icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c7d2fe;
  background: rgba(99, 102, 241, 0.14);
  flex-shrink: 0;
}

.nav-item__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.nav-item__label {
  font-size: 0.88rem;
  font-weight: 700;
}

.nav-item__desc {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.app-sidebar__user {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.user-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.user-name {
  margin-top: 4px;
  font-size: 0.88rem;
  font-weight: 700;
}

.logout-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 9px 12px;
  cursor: pointer;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform var(--transition-smooth);
  }

  .app-sidebar--mobile-open {
    transform: translateX(0);
  }

  .mobile-close-btn {
    display: inline-flex;
  }
}
</style>
