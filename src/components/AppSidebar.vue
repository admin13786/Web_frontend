<template>
  <aside class="app-sidebar" :class="{ 'app-sidebar--mobile-open': isMobileOpen }">
    <div class="app-sidebar__brand">
      <div class="brand-mark">
        <img :src="brandLogoSrc" alt="CogniMatrix" class="brand-mark__image" />
      </div>
      <div>
      <div class="brand-title">Education</div>
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
        <span class="nav-item__label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <section class="app-sidebar__panel">
      <button type="button" class="workshop-history-create" @click="createConversation">
        <span class="workshop-history-create__icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span>新对话</span>
      </button>

      <div class="workshop-history">
        <div class="workshop-history__title">近期对话</div>

        <div class="workshop-history__list">
          <div
            v-for="item in pagedConversations"
            :key="item.id"
            class="workshop-history__item"
            :class="{ 'workshop-history__item--active': item.id === activeConversationId }"
          >
            <button
              type="button"
              class="workshop-history__item-main"
              @click="openConversation(item.id)"
            >
              <span class="workshop-history__item-title">{{ item.title || '新对话' }}</span>
              <span class="workshop-history__item-time">{{ formatConversationTime(item.updatedAt) }}</span>
            </button>

            <button
              v-if="conversations.length > 1"
              type="button"
              class="workshop-history__delete"
              title="删除对话"
              aria-label="删除对话"
              @click.stop="requestRemoveConversation(item.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          </div>

          <div v-if="!pagedConversations.length" class="workshop-history__empty">
            暂无近期对话
          </div>
        </div>

        <div v-if="totalPages > 1" class="workshop-history__pagination">
          <button
            type="button"
            class="workshop-history__page-btn"
            :disabled="page === 0"
            @click="page -= 1"
          >
            上一页
          </button>
          <span class="workshop-history__page-indicator">{{ page + 1 }} / {{ totalPages }}</span>
          <button
            type="button"
            class="workshop-history__page-btn"
            :disabled="page >= totalPages - 1"
            @click="page += 1"
          >
            下一页
          </button>
        </div>
      </div>
    </section>

    <div class="app-sidebar__user">
      <div class="user-meta">
        <div class="user-label">当前用户</div>
        <div class="user-name">{{ userName }}</div>
      </div>
      <button type="button" class="logout-btn" @click="logout">退出登录</button>
    </div>

    <DeleteConversationConfirmModal
      v-model:open="deleteConversationModalOpen"
      @confirm="confirmRemoveConversation"
      @cancel="clearPendingDelete"
    />
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout as logoutApi } from '../api/auth.js'
import {
  deleteWorkshopConversation,
  fetchWorkshopConversations,
  saveWorkshopConversation,
} from '../api/workshopConversations.js'
import { clearCurrentUser, getCurrentUser, getUserDisplayName } from '../utils/auth.js'
import { createEmptyConversation } from '../utils/workshopHistory.js'
import DeleteConversationConfirmModal from './DeleteConversationConfirmModal.vue'

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
const conversations = ref([])
const deleteConversationModalOpen = ref(false)
const pendingDeleteConversationId = ref('')
const page = ref(0)
const PER_PAGE = 5

const userName = computed(() => getUserDisplayName(currentUser) || '未登录')
const brandLogoSrc = computed(() => '/branding/cognimatrix-logo-cutout.png')
const activeConversationId = computed(() => String(route.query.cid || conversations.value[0]?.id || ''))
const totalPages = computed(() => Math.max(1, Math.ceil(conversations.value.length / PER_PAGE)))
const pagedConversations = computed(() => {
  const start = page.value * PER_PAGE
  return conversations.value.slice(start, start + PER_PAGE)
})

const navItems = [
  {
    label: 'AI新闻早咖啡',
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

function clampPage(nextPage = page.value) {
  const maxPage = Math.max(0, totalPages.value - 1)
  page.value = Math.min(Math.max(nextPage, 0), maxPage)
}

function syncPageByConversationId(id) {
  const index = conversations.value.findIndex((item) => item.id === id)
  if (index === -1) {
    clampPage()
    return
  }
  clampPage(Math.floor(index / PER_PAGE))
}

async function loadWorkshopHistory() {
  try {
    conversations.value = await fetchWorkshopConversations()
    syncPageByConversationId(activeConversationId.value)
  } catch (error) {
    console.error('load workshop sidebar conversations failed:', error)
    conversations.value = []
    clampPage(0)
  }
}

function openConversation(id) {
  if (!id) return
  syncPageByConversationId(id)
  router.push({
    path: '/workshop',
    query: {
      ...route.query,
      cid: id,
    },
  })
}

async function createConversation() {
  const conversation = createEmptyConversation()
  try {
    await saveWorkshopConversation(conversation)
  } catch (error) {
    console.error('create workshop conversation failed:', error)
  }
  await loadWorkshopHistory()
  openConversation(conversation.id)
}

function emitWorkshopHistoryChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('workshop-history-changed'))
}

function clearPendingDelete() {
  pendingDeleteConversationId.value = ''
}

function requestRemoveConversation(id) {
  const conversationId = String(id || '').trim()
  if (!conversationId || conversations.value.length <= 1) return
  const currentIndex = conversations.value.findIndex((item) => item.id === conversationId)
  if (currentIndex === -1) return
  pendingDeleteConversationId.value = conversationId
  deleteConversationModalOpen.value = true
}

async function confirmRemoveConversation() {
  const conversationId = pendingDeleteConversationId.value.trim()
  clearPendingDelete()
  if (!conversationId || conversations.value.length <= 1) return

  const currentIndex = conversations.value.findIndex((item) => item.id === conversationId)
  if (currentIndex === -1) return

  const nextConversations = conversations.value.filter((item) => item.id !== conversationId)
  const nextActiveId =
    nextConversations[currentIndex]?.id ||
    nextConversations[currentIndex - 1]?.id ||
    nextConversations[0]?.id ||
    ''

  try {
    await deleteWorkshopConversation(conversationId)
    conversations.value = nextConversations
    clampPage()
    emitWorkshopHistoryChanged()

    if (activeConversationId.value === conversationId && nextActiveId) {
      openConversation(nextActiveId)
      return
    }

    syncPageByConversationId(activeConversationId.value)
  } catch (error) {
    console.error('delete workshop conversation failed:', error)
  }
}

function formatConversationTime(raw) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handleWorkshopHistoryChanged() {
  loadWorkshopHistory()
}

async function logout() {
  await logoutApi().catch(() => null)
  clearCurrentUser()
  router.push('/login')
}

watch(
  () => route.fullPath,
  () => {
    loadWorkshopHistory()
  },
  { immediate: true },
)

watch(
  () => activeConversationId.value,
  (id) => {
    syncPageByConversationId(id)
  },
)

watch(
  () => conversations.value.length,
  () => {
    clampPage()
  },
)

onMounted(() => {
  window.addEventListener('workshop-history-changed', handleWorkshopHistoryChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('workshop-history-changed', handleWorkshopHistoryChanged)
})
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
  border-right: 1px solid var(--topbar-border);
  background: var(--sidebar-bg);
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
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 5px;
  background: var(--brand-mark-bg);
  border: 1px solid var(--brand-mark-border);
  box-shadow: var(--shadow-soft);
}

.brand-mark__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
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
  border: 1px solid var(--bg-glass-border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  align-items: center;
  justify-content: center;
}

.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-sidebar__panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 18px;
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid transparent;
  background: var(--bg-muted);
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}

.nav-item:hover {
  transform: translateY(-1px);
  background: var(--bg-elevated);
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
  color: var(--sidebar-icon-color);
  background: var(--sidebar-icon-bg);
  flex-shrink: 0;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.nav-item--active .nav-item__icon {
  color: var(--sidebar-icon-active-color);
  background: var(--sidebar-icon-active-bg);
}

.nav-item__label {
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workshop-history-create {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--bg-glass-border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
}

.workshop-history-create__icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-create-icon-color);
  background: var(--sidebar-create-icon-bg);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.workshop-history {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.workshop-history__title {
  margin: 0 8px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.workshop-history__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workshop-history__item {
  display: flex;
  align-items: stretch;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: var(--bg-muted);
  color: var(--text-primary);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.workshop-history__item--active {
  background: rgba(99, 102, 241, 0.14);
  border-color: rgba(129, 140, 248, 0.2);
}

.workshop-history__item-main {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 12px 14px;
  cursor: pointer;
}

.workshop-history__delete {
  width: 34px;
  flex-shrink: 0;
  margin: 6px 6px 6px 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity var(--transition-fast),
    visibility var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.workshop-history__item--active .workshop-history__delete,
.workshop-history__item:hover .workshop-history__delete,
.workshop-history__item:focus-within .workshop-history__delete {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.workshop-history__item--active .workshop-history__delete {
  background: rgba(86, 90, 129, 0.55);
  color: #f4f4f5;
}

.workshop-history__item--active .workshop-history__delete:hover {
  background: rgba(99, 103, 150, 0.75);
  color: #fff;
}

.workshop-history__delete:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.workshop-history__item-title,
.workshop-history__item-time {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workshop-history__item-title {
  font-size: 0.88rem;
  font-weight: 700;
}

.workshop-history__item-time {
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.workshop-history__empty {
  padding: 14px 12px;
  border-radius: 14px;
  background: var(--bg-muted);
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: center;
}

.workshop-history__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.workshop-history__page-btn {
  min-width: 64px;
  border: 1px solid var(--bg-glass-border);
  border-radius: 999px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  padding: 6px 12px;
  font-size: 0.74rem;
  cursor: pointer;
}

.workshop-history__page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.workshop-history__page-indicator {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.app-sidebar__user {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--bg-glass-border);
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
  border: 1px solid var(--bg-glass-border);
  background: var(--bg-muted);
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
