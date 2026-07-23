<template>
  <aside class="app-sidebar" :class="{ 'app-sidebar--mobile-open': isMobileOpen }">
    <div class="app-sidebar__brand">
      <div class="brand-mark">
        <img :src="brandLogoSrc" alt="CogniMatrix" class="brand-mark__image" />
      </div>
      <div class="brand-copy">
        <div class="brand-kicker">LINGJING / CONTENT DESK</div>
        <div class="brand-title">灵境</div>
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
      <template v-for="item in resolvedNavItems" :key="item.key">
        <button
          v-if="item.mode"
          type="button"
          class="nav-item nav-item--button"
          :class="{ 'nav-item--active': isActive(item) }"
          @click="handleNavItemClick(item)"
        >
          <span class="nav-item__icon" v-html="item.icon" />
          <span class="nav-item__label">{{ item.label }}</span>
        </button>
        <RouterLink
          v-else
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item) }"
          @click="emit('close-mobile')"
        >
          <span class="nav-item__icon" v-html="item.icon" />
          <span class="nav-item__label">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <section class="app-sidebar__panel">
      <button type="button" class="workshop-history-create" @click="goToWelcomePage">
        <span class="workshop-history-create__icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span>新对话</span>
      </button>
      <div class="workshop-history">
        <div class="workshop-history__head">
          <div>
            <span class="section-kicker">RECENT THREADS</span>
            <div class="workshop-history__title">近期对话</div>
          </div>
          <div class="workshop-history__summary">{{ filteredConversations.length }} 条</div>
        </div>
        <div class="workshop-history__list">
          <div
            v-for="item in filteredConversations"
            :key="item.id"
            class="workshop-history__item"
            :class="{ 'workshop-history__item--active': item.id === activeConversationId }"
          >
            <button type="button" class="workshop-history__item-main" @click="openConversation(item.id)">
              <span class="workshop-history__item-title">{{ item.title || '新对话' }}</span>
              <span class="workshop-history__item-meta">
                <span class="workshop-history__item-mode">{{ conversationModeLabel(item) }}</span>
                <span class="workshop-history__item-tokens">{{ formatTokenCount(getConversationTokenTotal(item.id)) }} tokens</span>
              </span>
            </button>
            <button
              v-if="filteredConversations.length > 1"
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
          <div v-if="!filteredConversations.length" class="workshop-history__empty">暂无近期对话</div>
        </div>
      </div>
    </section>

    <div class="app-sidebar__user">
      <div class="user-meta">
        <div class="user-kicker">SESSION</div>
        <div class="user-label">当前用户</div>
        <div class="user-name">{{ userName }}</div>
        <div class="user-token-total">总 Token {{ formatTokenCount(userTokenTotal) }}</div>
      </div>
      <button type="button" class="logout-btn" @click="logout">{{ authActionLabel }}</button>
    </div>

    <Teleport to="body">
      <div v-if="skillSelectorOpen" class="modal-mask" @click.self="skillSelectorOpen = false">
        <div class="modal">
          <div class="modal__header">
            <div class="modal__title">选择 Skill</div>
            <button type="button" class="modal__close" @click="skillSelectorOpen = false">×</button>
          </div>
          <p class="modal__hint">选中的 Skill 会作为对话生成时的额外能力注入。</p>
          <p v-if="skillError" class="modal__error">{{ skillError }}</p>
          <div v-if="skillsLoading" class="modal__empty">加载中...</div>
          <div v-else-if="!skills.length" class="modal__empty">暂无可用 Skill</div>
          <div v-else class="modal__list">
            <button type="button" class="modal__item" :class="{ active: selectedSkillIds.length === 0 }" @click="clearSkillSelection">
              清空已选 Skill
            </button>
            <button
              v-for="item in skills"
              :key="item.id"
              type="button"
              class="modal__item"
              :class="{ active: isSkillSelected(item.id) }"
              @click="toggleSkillSelection(item)"
            >
              <span>{{ item.name }}</span><small>v{{ item.latest_version || '1.0.0' }} {{ isSkillSelected(item.id) ? '· 已选' : '' }}</small>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="skillManagerOpen" class="modal-mask" @click.self="skillManagerOpen = false">
        <div class="modal modal--wide">
          <div class="modal__header">
            <div class="modal__title">Skill 仓库管理</div>
            <button type="button" class="modal__close" @click="skillManagerOpen = false">×</button>
          </div>
          <p class="modal__hint">可以创建、启停和删除 Skill，删除为软删除。</p>
          <p v-if="skillError" class="modal__error">{{ skillError }}</p>
          <form class="skill-create-form" @submit.prevent="submitCreateSkill">
            <input v-model.trim="newSkillForm.name" class="skill-input" placeholder="Skill 名称" required />
            <input v-model.trim="newSkillForm.slug" class="skill-input" placeholder="Slug（可选）" />
            <input v-model.trim="newSkillForm.version" class="skill-input" placeholder="版本，例如 1.0.0" required />
            <textarea v-model="newSkillForm.description" class="skill-textarea" rows="2" placeholder="描述（可选）"></textarea>
            <textarea v-model="newSkillForm.markdown" class="skill-textarea" rows="6" placeholder="Skill Markdown 内容" required></textarea>
            <button type="submit" class="skill-primary-btn" :disabled="skillSaving">{{ skillSaving ? '提交中...' : '创建 Skill' }}</button>
                    </form>
          <div class="skill-zip-upload">
            <div class="skill-zip-upload__title">或通过 ZIP 创建</div>
            <input type="file" class="skill-input" accept=".zip,application/zip" @change="handleZipFileChange" />
            <div class="skill-zip-upload__hint" v-if="selectedZipFileName">已选择浏览器文件：{{ selectedZipFileName }}</div>
            <button type="button" class="skill-primary-btn" :disabled="browserZipUploadDisabled" @click="submitCreateSkillFromZip">
              {{ skillSaving ? '上传中...' : '上传 ZIP 创建 Skill' }}
            </button>
            <p v-if="skillError" class="modal__error skill-zip-upload__error">{{ skillError }}</p>
            <div class="skill-zip-upload__hint">ZIP 包请按原生 Skill 结构上传，入口文件必须是 `SKILL.md`，也可附带 `references/`、`examples.md`、`scripts/`、`templates/` 等文件。名称可自动取自 ZIP 文件名，版本默认 `1.0.0`。</div>
            <div class="skill-zip-upload__hint">支持自动去掉单一顶层目录，也会忽略 `__MACOSX`、`.DS_Store` 这类压缩包元数据文件。</div>
            <div class="skill-zip-upload__title">或从 Backend 目录导入</div>
            <div class="skill-zip-upload__hint" v-if="localZipRoot">扫描目录：{{ localZipRoot }}</div>
            <button type="button" class="skill-inline-btn" :disabled="localZipLoading || skillSaving" @click="loadLocalZipFiles">
              {{ localZipLoading ? '扫描中...' : '刷新 Backend ZIP 列表' }}
            </button>
            <div v-if="localZipFiles.length" class="modal__list">
              <button
                v-for="item in localZipFiles"
                :key="item.filename"
                type="button"
                class="modal__item"
                :class="{ active: selectedLocalZipFilename === item.filename }"
                @click="selectLocalZip(item)"
              >
                <span>{{ item.filename }}</span><small>{{ formatReferenceSize(item.size) }} · {{ item.modified_at || '未知时间' }}</small>
              </button>
            </div>
            <div v-else-if="!localZipLoading" class="modal__empty">Backend 目录下暂未发现可导入的 ZIP 文件</div>
            <div class="skill-zip-upload__hint" v-if="selectedLocalZipFilename">当前将直接导入：{{ selectedLocalZipFilename }}</div>
            <button type="button" class="skill-primary-btn" :disabled="localZipUploadDisabled" @click="submitCreateSkillFromLocalZip">
              {{ skillSaving ? '导入中...' : '从 Backend 目录导入 ZIP' }}
            </button>
          </div>
          <div class="modal__section-title">已有 Skill</div>
          <div v-if="skillsLoading" class="modal__empty">加载中...</div>
          <div v-else-if="!skills.length" class="modal__empty">暂无 Skill</div>
          <div v-else class="modal__list">
            <div v-for="item in skills" :key="item.id" class="modal__row">
              <div>
                <div class="modal__row-title">{{ item.name }}</div>
                <div class="modal__row-meta">slug: {{ item.slug }} · v{{ item.latest_version || '-' }} · {{ item.is_active ? '启用中' : '已禁用' }} · p{{ item.priority ?? 50 }} · {{ item.mode_scope || 'skill_assistant' }}</div>
              </div>
              <div class="modal__row-actions">
                <button type="button" class="skill-inline-btn" @click="openSkillViewer(item)">查看</button>
                <button type="button" class="skill-inline-btn" @click="renameSkill(item)">改名</button>
                <button type="button" class="skill-inline-btn" @click="editSkillRouting(item)">路由</button>
                <button type="button" class="skill-inline-btn" @click="toggleSkillStatus(item)">{{ item.is_active ? '禁用' : '启用' }}</button>
                <button type="button" class="skill-inline-btn skill-inline-btn--danger" @click="removeSkill(item)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="skillViewerOpen" class="modal-mask" @click.self="skillViewerOpen = false">
        <div class="modal modal--wide">
          <div class="modal__header">
            <div class="modal__title">查看 Skill</div>
            <button type="button" class="modal__close" @click="skillViewerOpen = false">×</button>
          </div>
          <p v-if="viewingSkill" class="modal__hint">
            {{ viewingSkill.name }} · {{ viewingSkill.slug }} · v{{ viewingSkill.latest_version || '-' }}
          </p>
          <p v-if="skillViewerError" class="modal__error">{{ skillViewerError }}</p>
          <div v-if="skillViewerLoading" class="modal__empty">加载中...</div>
          <template v-else>
            <div v-if="viewingSkillVersionMeta" class="skill-viewer-package">
              <div class="skill-viewer-package__meta">
                <span>入口文件：{{ viewingSkillVersionMeta.entry_file || 'SKILL.md' }}</span>
                <span>附属文件数：{{ viewingSkillVersionMeta.reference_count ?? 0 }}</span>
              </div>
              <div class="skill-viewer-package__title">Manifest 文件列表</div>
              <div v-if="viewingSkillManifestRefs.length" class="skill-viewer-package__list">
                <div v-for="refItem in viewingSkillManifestRefs" :key="refItem.path" class="skill-viewer-package__item">
                  <span class="skill-viewer-package__path">{{ refItem.path }}</span>
                  <span class="skill-viewer-package__size">{{ formatReferenceSize(refItem.size) }}</span>
                </div>
              </div>
              <div v-else class="modal__empty">该 Skill 版本暂时没有 references 文件</div>
            </div>
            <pre class="skill-viewer-pre"><code>{{ viewingSkillMarkdown }}</code></pre>
          </template>
        </div>
      </div>
    </Teleport>

    <DeleteConversationConfirmModal
      v-model:open="deleteConversationModalOpen"
      @confirm="confirmRemoveConversation"
      @cancel="clearPendingDelete"
    />
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout as logoutApi } from '../api/auth.js'
import {
  createWorkshopSkill,
  createWorkshopSkillFromLocalZip,
  createWorkshopSkillFromZip,
  deleteWorkshopSkill,
  fetchAgentDoConversationTokenUsage,
  fetchAgentDoUserTokenUsage,
  fetchWorkshopLocalZipFiles,
  fetchWorkshopSkillVersion,
  fetchWorkshopSkills,
  patchWorkshopSkillMeta,
  patchWorkshopSkillRouting,
  patchWorkshopSkillStatus,
} from '../api/workshop.js'
import { deleteWorkshopConversationDeep, fetchWorkshopConversations } from '../api/workshopConversations.js'
import {
  clearCurrentUser,
  getAuthChangedEventName,
  getCurrentUser,
  getUserDisplayName,
  isAdminUser,
} from '../utils/auth.js'
import {
  removeWorkshopConversationState,
} from '../utils/workshopHistory.js'
import {
  FUNCTION_MODE,
  getPathForFunctionMode,
  getRouteFunctionMode,
  normalizeFunctionMode,
} from '../utils/functionMode.js'
import DeleteConversationConfirmModal from './DeleteConversationConfirmModal.vue'

const WORKSHOP_CREATE_CONVERSATION_EVENT = 'workshop-create-conversation'
const WORKSHOP_CONVERSATION_DELETED_EVENT = 'workshop-conversation-deleted'
const WORKSHOP_SKILL_SELECTED_EVENT = 'workshop-skill-selected'
const WORKSHOP_OPEN_SKILL_SELECTOR_EVENT = 'workshop-open-skill-selector'
const WORKSHOP_OPEN_SKILL_MANAGER_EVENT = 'workshop-open-skill-manager'
const WORKSHOP_SKILL_STORAGE_KEY = 'workshop-selected-skills'
const WORKSHOP_SKILL_STORAGE_KEY_LEGACY = 'workshop-selected-skill'
const AUTH_CHANGED_EVENT = getAuthChangedEventName()
defineProps({ isMobileOpen: { type: Boolean, default: false } })
const emit = defineEmits(['close-mobile'])

const router = useRouter()
const route = useRoute()
const currentUser = ref(getCurrentUser())
const conversations = ref([])
const conversationTokenTotals = ref({})
const userTokenTotal = ref(0)
const deleteConversationModalOpen = ref(false)
const pendingDeleteConversationId = ref('')
const skills = ref([])
const skillsLoading = ref(false)
const skillSaving = ref(false)
const skillError = ref('')
const skillSelectorOpen = ref(false)
const skillManagerOpen = ref(false)
const selectedSkillIds = ref([])
const selectedSkillMetas = ref([])
const newSkillForm = reactive({ name: '', slug: '', version: '1.0.0', description: '', markdown: '' })
const selectedZipFile = ref(null)
const localZipFiles = ref([])
const localZipLoading = ref(false)
const localZipRoot = ref('')
const selectedLocalZipFilename = ref('')
const skillViewerOpen = ref(false)
const skillViewerLoading = ref(false)
const skillViewerError = ref('')
const viewingSkill = ref(null)
const viewingSkillMarkdown = ref('')
const viewingSkillVersionMeta = ref(null)

const isAuthenticated = computed(() => Boolean(currentUser.value?.username))
const isAdmin = computed(() => isAdminUser(currentUser.value))
const userName = computed(() => getUserDisplayName(currentUser.value) || '游客模式')
const authActionLabel = computed(() => (isAuthenticated.value ? '退出登录' : '登录 / 注册'))
const brandLogoSrc = computed(() => '/branding/cognimatrix-logo-cutout.png')
const currentFunctionMode = computed(() => getRouteFunctionMode(route))
const isSkillAssistantMode = computed(() => currentFunctionMode.value === FUNCTION_MODE.SKILL_ASSISTANT)
const filteredConversations = computed(() => conversations.value)
const activeConversationId = computed(() => String(route.query.cid || ''))
const selectedZipFileName = computed(() => String(selectedZipFile.value?.name || '').trim())
const browserZipUploadDisabled = computed(() => skillSaving.value || !selectedZipFile.value)
const localZipUploadDisabled = computed(() => skillSaving.value || !selectedLocalZipFilename.value)
const viewingSkillManifestRefs = computed(() => {
  const references = viewingSkillVersionMeta.value?.manifest?.references
  if (!Array.isArray(references)) return []
  return references
    .map((item) => ({
      path: String(item?.path || '').trim(),
      size: Number(item?.size || 0),
    }))
    .filter((item) => item.path)
})

function conversationModeLabel(conversation) {
  return normalizeFunctionMode(conversation?.conversationMode) === FUNCTION_MODE.SKILL_ASSISTANT ? 'Skill 助手' : '创意工坊'
}

const navItems = [
  { key: 'channel', label: 'AI趣闻萃取', to: '/channel', path: '/channel', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="4" height="10" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="17" rx="1"/></svg>' },
  { key: 'news-chat', label: '新闻问答', to: '/news-chat', path: '/news-chat', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>' },
  { key: 'edurepo', label: 'EduRepo', to: '/edu-repo', path: '/edu-repo', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a3 3 0 0 1 3 3v1h1a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1v1a3 3 0 1 1-6 0v-1H8a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4h1V6a3 3 0 0 1 3-3z"/><path d="M9 11h6"/><path d="M12 8v6"/></svg>' },
  { key: 'workshop', label: '创意工坊', to: { path: '/workshop', query: { new: '1' } }, path: '/workshop', mode: FUNCTION_MODE.WORKSHOP, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z"/><path d="M12 8v8"/><path d="M8.5 10l7 4"/></svg>' },
  { key: 'skill-assistant', label: 'Skill 助手', to: { path: '/skills', query: { new: '1' } }, path: '/skills', mode: FUNCTION_MODE.SKILL_ASSISTANT, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v10H8l-4 4z"/><path d="M8 9h8"/><path d="M8 12h6"/></svg>' },
  { key: 'openmaic', label: 'OpenMAIC', to: '/openmaic', path: '/openmaic', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 20h8"/><path d="M12 18v2"/></svg>' },
]

const resolvedNavItems = computed(() => {
  if (!isAdmin.value) return navItems
  return [
    {
      key: 'admin-monitor',
      label: '运营看板',
      to: '/admin/monitor',
      path: '/admin/monitor',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19h16"/><path d="M7 16V8"/><path d="M12 16V5"/><path d="M17 16v-4"/></svg>',
    },
    ...navItems,
  ]
})

function isActive(item) {
  if (item.mode) {
    return route.path === getPathForFunctionMode(item.mode)
  }
  return route.path === item.path || route.path.startsWith(`${item.path}/`)
}

async function handleNavItemClick(item) {
  emit('close-mobile')
  if (!item?.mode) return

  const targetMode = normalizeFunctionMode(item.mode)
  const targetPath = getPathForFunctionMode(targetMode)

  if (route.path === targetPath) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WORKSHOP_CREATE_CONVERSATION_EVENT, { detail: { mode: targetMode, forceNew: true } }))
    }
    return
  }

  await router.push({ path: targetPath, query: { new: '1', t: String(Date.now()) } })
}

function formatTokenCount(value) {
  const count = Number(value || 0)
  if (!Number.isFinite(count) || count <= 0) return '0'
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(Math.round(count))
}

function getConversationTokenTotal(conversationId) {
  return Number(conversationTokenTotals.value[String(conversationId || '')] || 0)
}

async function loadUserTokenUsage() {
  if (!isAuthenticated.value) {
    userTokenTotal.value = 0
    return
  }
  const username = String(currentUser.value?.username || '').trim()
  try {
    const payload = await fetchAgentDoUserTokenUsage(username)
    userTokenTotal.value = Number(payload?.tokenUsage?.total_tokens || 0)
  } catch (error) {
    console.error('load workshop user token usage failed:', error)
    userTokenTotal.value = 0
  }
}

async function loadConversationTokenUsage(items) {
  if (!isAuthenticated.value) {
    conversationTokenTotals.value = {}
    return
  }
  const username = String(currentUser.value?.username || '').trim()

  const nextTotals = {}
  await Promise.all(
    (Array.isArray(items) ? items : []).map(async (item) => {
      const conversationId = String(item?.id || '').trim()
      if (!conversationId) return
      try {
        const payload = await fetchAgentDoConversationTokenUsage({
          username,
          conversationId,
        })
        nextTotals[conversationId] = Number(payload?.tokenUsage?.total_tokens || 0)
      } catch (error) {
        console.error(`load conversation token usage failed: ${conversationId}`, error)
        nextTotals[conversationId] = 0
      }
    })
  )
  conversationTokenTotals.value = nextTotals
}

function emitWorkshopHistoryChanged() { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('workshop-history-changed')) }
function clearPendingDelete() { pendingDeleteConversationId.value = '' }
function handleWorkshopHistoryChanged() { loadWorkshopHistory() }
function handleAuthChanged() {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.username) {
    router.replace('/login')
    return
  }
  loadWorkshopHistory()
}

function loadStoredSkillSelection() {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(WORKSHOP_SKILL_STORAGE_KEY) || window.localStorage.getItem(WORKSHOP_SKILL_STORAGE_KEY_LEGACY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    let list = []
    if (Array.isArray(parsed?.skills)) {
      list = parsed.skills
    } else if (Array.isArray(parsed)) {
      list = parsed
    } else if (parsed?.id) {
      list = [parsed]
    }
    selectedSkillMetas.value = list
      .map((item) => ({ id: String(item?.id || ''), name: String(item?.name || ''), version: String(item?.version || '') }))
      .filter((item) => item.id)
    selectedSkillIds.value = selectedSkillMetas.value.map((item) => item.id)
    window.localStorage.removeItem(WORKSHOP_SKILL_STORAGE_KEY_LEGACY)
    persistSkillSelection(selectedSkillMetas.value)
  } catch {
    window.localStorage.removeItem(WORKSHOP_SKILL_STORAGE_KEY)
    window.localStorage.removeItem(WORKSHOP_SKILL_STORAGE_KEY_LEGACY)
  }
}

function persistSkillSelection(skillsList) {
  if (typeof window === 'undefined') return
  if (!Array.isArray(skillsList) || skillsList.length === 0) {
    window.localStorage.removeItem(WORKSHOP_SKILL_STORAGE_KEY)
    return
  }
  const normalized = skillsList.map((item) => ({
    id: String(item?.id || ''),
    name: String(item?.name || ''),
    version: String(item?.version || item?.latest_version || ''),
  })).filter((item) => item.id)
  window.localStorage.setItem(WORKSHOP_SKILL_STORAGE_KEY, JSON.stringify({ skills: normalized }))
}

function emitSkillSelection(skillsList) {
  if (typeof window === 'undefined') return
  const normalized = Array.isArray(skillsList)
    ? skillsList.map((item) => ({
      id: String(item?.id || ''),
      name: String(item?.name || ''),
      version: String(item?.version || item?.latest_version || ''),
    })).filter((item) => item.id)
    : []
  window.dispatchEvent(new CustomEvent(WORKSHOP_SKILL_SELECTED_EVENT, { detail: { skills: normalized } }))
}

function handleOpenSkillSelectorRequested() {
  void openSkillSelector()
}

function handleOpenSkillManagerRequested() {
  void openSkillManager()
}

async function loadSkills({ activeOnly = false } = {}) {
  skillsLoading.value = true
  skillError.value = ''
  try {
    const data = await fetchWorkshopSkills({ page: 1, pageSize: 100, includeDeleted: false, isActive: activeOnly ? true : undefined })
    skills.value = Array.isArray(data?.items) ? data.items : []
    const skillMap = new Map(skills.value.map((item) => [item.id, item]))
    selectedSkillMetas.value = selectedSkillMetas.value
      .filter((item) => skillMap.has(item.id))
      .map((item) => {
        const latest = skillMap.get(item.id)
        return { id: item.id, name: String(latest?.name || item.name || ''), version: String(latest?.latest_version || item.version || '') }
      })
    selectedSkillIds.value = selectedSkillMetas.value.map((item) => item.id)
  } catch (error) {
    skillError.value = error instanceof Error ? error.message : String(error)
  } finally { skillsLoading.value = false }
}

async function openSkillSelector() { await loadSkills({ activeOnly: true }); skillSelectorOpen.value = true }
async function loadLocalZipFiles() {
  localZipLoading.value = true
  skillError.value = ''
  try {
    const data = await fetchWorkshopLocalZipFiles()
    localZipRoot.value = String(data?.root_dir || '')
    localZipFiles.value = Array.isArray(data?.items) ? data.items : []
    if (!localZipFiles.value.some((item) => item.filename === selectedLocalZipFilename.value)) {
      selectedLocalZipFilename.value = localZipFiles.value[0]?.filename || ''
    }
  } catch (error) {
    skillError.value = error instanceof Error ? error.message : String(error)
  } finally {
    localZipLoading.value = false
  }
}

async function openSkillManager() {
  await Promise.all([loadSkills(), loadLocalZipFiles()])
  skillManagerOpen.value = true
}

function isSkillSelected(skillId) {
  return selectedSkillIds.value.includes(String(skillId || ''))
}

function clearSkillSelection() {
  selectedSkillIds.value = []
  selectedSkillMetas.value = []
  persistSkillSelection([])
  emitSkillSelection([])
  skillSelectorOpen.value = false
}

function toggleSkillSelection(skill) {
  const id = String(skill?.id || '')
  if (!id) return
  if (isSkillSelected(id)) {
    selectedSkillIds.value = selectedSkillIds.value.filter((item) => item !== id)
    selectedSkillMetas.value = selectedSkillMetas.value.filter((item) => item.id !== id)
  } else {
    selectedSkillIds.value = [...selectedSkillIds.value, id]
    selectedSkillMetas.value = [
      ...selectedSkillMetas.value,
      { id, name: String(skill?.name || ''), version: String(skill?.latest_version || '') },
    ]
  }
  persistSkillSelection(selectedSkillMetas.value)
  emitSkillSelection(selectedSkillMetas.value)
}

async function submitCreateSkill() {
  if (!newSkillForm.name.trim() || !newSkillForm.version.trim() || !newSkillForm.markdown.trim()) return
  skillSaving.value = true
  skillError.value = ''
  try {
    await createWorkshopSkill({ name: newSkillForm.name.trim(), slug: newSkillForm.slug.trim(), description: newSkillForm.description.trim(), version: newSkillForm.version.trim(), markdown: newSkillForm.markdown, changelog: 'created from sidebar manager' })
    newSkillForm.name = ''; newSkillForm.slug = ''; newSkillForm.version = '1.0.0'; newSkillForm.description = ''; newSkillForm.markdown = ''
    await loadSkills()
  } catch (error) {
    skillError.value = error instanceof Error ? error.message : String(error)
  } finally { skillSaving.value = false }
}

function handleZipFileChange(event) {
  const file = event?.target?.files?.[0]
  selectedZipFile.value = file || null
  skillError.value = ''
  if (file && !/\.zip$/i.test(String(file.name || ''))) {
    skillError.value = '请选择 .zip 格式文件'
    return
  }
  if (file && !newSkillForm.name.trim()) {
    const guessedName = String(file.name || '').replace(/\.zip$/i, '').trim()
    if (guessedName) {
      newSkillForm.name = guessedName
    }
  }
}

function selectLocalZip(item) {
  const filename = String(item?.filename || '').trim()
  if (!filename) return
  selectedLocalZipFilename.value = filename
  skillError.value = ''
  if (!newSkillForm.name.trim()) {
    const guessedName = filename.replace(/\.zip$/i, '').trim()
    if (guessedName) {
      newSkillForm.name = guessedName
    }
  }
}

async function submitCreateSkillFromZip() {
  skillError.value = ''
  if (!selectedZipFile.value) {
    skillError.value = '请选择 ZIP 文件'
    return
  }
  if (!/\.zip$/i.test(String(selectedZipFile.value?.name || ''))) {
    skillError.value = '仅支持上传 .zip 文件'
    return
  }
  if (!newSkillForm.version.trim()) {
    skillError.value = '版本不能为空，例如 1.0.0'
    return
  }
  if (!newSkillForm.name.trim()) {
    const guessedName = String(selectedZipFile.value?.name || '').replace(/\.zip$/i, '').trim()
    if (guessedName) {
      newSkillForm.name = guessedName
    } else {
      skillError.value = '名称不能为空，请填写 Skill 名称'
      return
    }
  }
  skillSaving.value = true
  try {
    await createWorkshopSkillFromZip(
      {
        name: newSkillForm.name.trim(),
        slug: newSkillForm.slug.trim(),
        description: newSkillForm.description.trim(),
        version: newSkillForm.version.trim(),
        changelog: 'created from sidebar zip upload',
      },
      selectedZipFile.value,
    )
    newSkillForm.name = ''; newSkillForm.slug = ''; newSkillForm.version = '1.0.0'; newSkillForm.description = ''; newSkillForm.markdown = ''
    selectedZipFile.value = null
    await loadSkills()
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error)
    if (/must contain skill\.md/i.test(rawMessage)) {
      skillError.value = '上传失败：ZIP 中没有找到可用的 `SKILL.md`，请放在压缩包根目录或唯一顶层目录下。'
    } else if (/multiple markdown candidates/i.test(rawMessage)) {
      skillError.value = '上传失败：ZIP 中存在多个 Markdown 入口，请只保留一个 `SKILL.md` 作为入口。'
    } else if (/slug already exists/i.test(rawMessage)) {
      skillError.value = '上传失败：同名 Skill 已存在，请修改名称或 Slug。'
    } else if (/unsafe relative path|invalid absolute file path/i.test(rawMessage)) {
      skillError.value = '上传失败：ZIP 中包含不安全路径，请移除绝对路径或 `..` 等目录跳转后重试。'
    } else if (/UTF-8 encoded/i.test(rawMessage)) {
      skillError.value = '上传失败：`SKILL.md` 必须使用 UTF-8 编码。'
    } else if (/Failed to fetch|NetworkError/i.test(rawMessage)) {
      skillError.value = '上传失败：当前前端没有连上 Workshop 后端，请检查 `/api/workshop` 代理或服务是否启动。'
    } else {
      skillError.value = rawMessage
    }
  } finally { skillSaving.value = false }
}

async function submitCreateSkillFromLocalZip() {
  skillError.value = ''
  if (!selectedLocalZipFilename.value) {
    skillError.value = '请先从 Backend ZIP 列表中选择一个文件'
    return
  }
  if (!newSkillForm.version.trim()) {
    skillError.value = '版本不能为空，例如 1.0.0'
    return
  }
  if (!newSkillForm.name.trim()) {
    const guessedName = String(selectedLocalZipFilename.value || '').replace(/\.zip$/i, '').trim()
    if (guessedName) {
      newSkillForm.name = guessedName
    } else {
      skillError.value = '名称不能为空，请填写 Skill 名称'
      return
    }
  }
  skillSaving.value = true
  try {
    await createWorkshopSkillFromLocalZip({
      filename: selectedLocalZipFilename.value,
      name: newSkillForm.name.trim(),
      slug: newSkillForm.slug.trim(),
      description: newSkillForm.description.trim(),
      version: newSkillForm.version.trim(),
      changelog: 'created from backend local zip import',
    })
    newSkillForm.name = ''; newSkillForm.slug = ''; newSkillForm.version = '1.0.0'; newSkillForm.description = ''; newSkillForm.markdown = ''
    selectedZipFile.value = null
    selectedLocalZipFilename.value = ''
    await Promise.all([loadSkills(), loadLocalZipFiles()])
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error)
    if (/not found/i.test(rawMessage)) {
      skillError.value = '导入失败：在 Backend 目录中没有找到这个 ZIP 文件，请先刷新 Backend ZIP 列表。'
    } else if (/slug already exists/i.test(rawMessage)) {
      skillError.value = '导入失败：同名 Skill 已存在，请修改名称或 Slug。'
    } else if (/Failed to fetch|NetworkError/i.test(rawMessage)) {
      skillError.value = '导入失败：当前前端没有连上 Workshop 后端，请检查 `/api/workshop` 代理或服务是否启动。'
    } else {
      skillError.value = rawMessage
    }
  } finally {
    skillSaving.value = false
  }
}

async function openSkillViewer(item) {
  if (!item?.id || !item?.latest_version) return
  skillViewerOpen.value = true
  skillViewerLoading.value = true
  skillViewerError.value = ''
  viewingSkill.value = item
  viewingSkillMarkdown.value = ''
  viewingSkillVersionMeta.value = null
  try {
    const data = await fetchWorkshopSkillVersion(item.id, item.latest_version)
    viewingSkillMarkdown.value = String(data?.markdown || '').trim() || '(该版本没有 Markdown 内容)'
    viewingSkillVersionMeta.value = data || null
  } catch (error) {
    skillViewerError.value = error instanceof Error ? error.message : String(error)
  } finally {
    skillViewerLoading.value = false
  }
}

function formatReferenceSize(size) {
  const value = Number(size || 0)
  if (!Number.isFinite(value) || value <= 0) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

async function renameSkill(item) {
  const currentName = String(item?.name || '').trim()
  if (!item?.id || typeof window === 'undefined') return
  const raw = window.prompt('请输入新的 Skill 名称', currentName || '')
  if (raw === null) return
  const nextName = String(raw).trim()
  if (!nextName) {
    skillError.value = 'Skill 名称不能为空'
    return
  }
  if (nextName === currentName) return
  try {
    skillError.value = ''
    await patchWorkshopSkillMeta(item.id, { name: nextName })
    await loadSkills()
    const refreshed = skills.value.find((skill) => skill.id === item.id)
    if (refreshed && selectedSkillIds.value.includes(item.id)) {
      selectedSkillMetas.value = selectedSkillMetas.value.map((skill) => (
        skill.id === item.id
          ? { id: refreshed.id, name: refreshed.name, version: refreshed.latest_version || '' }
          : skill
      ))
      persistSkillSelection(selectedSkillMetas.value)
      emitSkillSelection(selectedSkillMetas.value)
    }
  } catch (error) {
    skillError.value = error instanceof Error ? error.message : String(error)
  }
}

async function editSkillRouting(item) {
  if (!item?.id || typeof window === 'undefined') return
  const currentPriority = Number.isFinite(Number(item?.priority)) ? Number(item.priority) : 50
  const currentModeScope = String(item?.mode_scope || 'skill_assistant')
  const currentRoutingTags = Array.isArray(item?.routing_tags) ? item.routing_tags.join(',') : ''
  const currentTriggerKeywords = Array.isArray(item?.trigger_keywords) ? item.trigger_keywords.join(',') : ''
  const currentExcludeKeywords = Array.isArray(item?.exclude_keywords) ? item.exclude_keywords.join(',') : ''

  const priorityRaw = window.prompt('priority (0-100)', String(currentPriority))
  if (priorityRaw === null) return
  const modeScopeRaw = window.prompt('mode_scope (skill_assistant/workshop/both)', currentModeScope)
  if (modeScopeRaw === null) return
  const routingTagsRaw = window.prompt('routing_tags（逗号分隔）', currentRoutingTags)
  if (routingTagsRaw === null) return
  const triggerKeywordsRaw = window.prompt('trigger_keywords（逗号分隔）', currentTriggerKeywords)
  if (triggerKeywordsRaw === null) return
  const excludeKeywordsRaw = window.prompt('exclude_keywords（逗号分隔）', currentExcludeKeywords)
  if (excludeKeywordsRaw === null) return

  function parseList(raw) {
    return String(raw || '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
  }

  try {
    skillError.value = ''
    await patchWorkshopSkillRouting(item.id, {
      priority: Number(priorityRaw),
      mode_scope: String(modeScopeRaw || '').trim(),
      routing_tags: parseList(routingTagsRaw),
      trigger_keywords: parseList(triggerKeywordsRaw),
      exclude_keywords: parseList(excludeKeywordsRaw),
    })
    await loadSkills()
  } catch (error) {
    skillError.value = error instanceof Error ? error.message : String(error)
  }
}

async function toggleSkillStatus(item) { try { await patchWorkshopSkillStatus(item.id, !item.is_active); await loadSkills() } catch (error) { skillError.value = error instanceof Error ? error.message : String(error) } }
async function removeSkill(item) { if (typeof window !== 'undefined' && !window.confirm(`确认删除 Skill「${item.name}」吗？`)) return; try { await deleteWorkshopSkill(item.id); await loadSkills() } catch (error) { skillError.value = error instanceof Error ? error.message : String(error) } }

async function loadWorkshopHistory() {
  if (!isAuthenticated.value) {
    conversations.value = []
    conversationTokenTotals.value = {}
    userTokenTotal.value = 0
    return
  }
  try {
    const items = await fetchWorkshopConversations()
    conversations.value = Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          conversationMode: normalizeFunctionMode(item?.conversationMode),
        }))
      : []
    await Promise.all([
      loadConversationTokenUsage(conversations.value),
      loadUserTokenUsage(),
    ])
  } catch (error) {
    console.error('load workshop sidebar conversations failed:', error)
    conversations.value = []
    conversationTokenTotals.value = {}
    userTokenTotal.value = 0
  }
}

function openConversation(id) {
  if (!id) return
  const conversation = conversations.value.find((item) => item.id === id)
  const mode = normalizeFunctionMode(conversation?.conversationMode || currentFunctionMode.value)
  const { new: _newConversationFlag, ...restQuery } = route.query || {}
  router.push({ path: getPathForFunctionMode(mode), query: { ...restQuery, cid: id } })
}
async function goToWelcomePage() {
  const mode = currentFunctionMode.value
  if (route.path === getPathForFunctionMode(mode)) {
    window.dispatchEvent(new CustomEvent(WORKSHOP_CREATE_CONVERSATION_EVENT, { detail: { mode } }))
    return
  }
  await router.push({ path: getPathForFunctionMode(mode), query: { new: '1', t: String(Date.now()) } })
}

function requestRemoveConversation(id) {
  const conversationId = String(id || '').trim()
  if (!conversationId || conversations.value.length <= 1) return
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
  const nextActiveId = nextConversations[currentIndex]?.id || nextConversations[currentIndex - 1]?.id || nextConversations[0]?.id || ''
  try {
    if (isAuthenticated.value) {
      await deleteWorkshopConversationDeep({ username: currentUser.value?.username || '', conversationId })
      removeWorkshopConversationState(currentUser.value?.username || '', conversationId, nextActiveId)
    }
    conversations.value = nextConversations
    window.dispatchEvent(new CustomEvent(WORKSHOP_CONVERSATION_DELETED_EVENT, { detail: { conversationId, nextActiveId } }))
    emitWorkshopHistoryChanged()
    if (activeConversationId.value === conversationId && nextActiveId) openConversation(nextActiveId)
  } catch (error) { console.error('delete workshop conversation failed:', error) }
}

async function logout() {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  await logoutApi().catch(() => null)
  clearCurrentUser()
  router.push('/login')
}

watch(() => route.fullPath, () => loadWorkshopHistory(), { immediate: true })

onMounted(() => {
  loadStoredSkillSelection()
  window.addEventListener('workshop-history-changed', handleWorkshopHistoryChanged)
  window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
  window.addEventListener(WORKSHOP_OPEN_SKILL_SELECTOR_EVENT, handleOpenSkillSelectorRequested)
  window.addEventListener(WORKSHOP_OPEN_SKILL_MANAGER_EVENT, handleOpenSkillManagerRequested)
})

onBeforeUnmount(() => {
  window.removeEventListener('workshop-history-changed', handleWorkshopHistoryChanged)
  window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
  window.removeEventListener(WORKSHOP_OPEN_SKILL_SELECTOR_EVENT, handleOpenSkillSelectorRequested)
  window.removeEventListener(WORKSHOP_OPEN_SKILL_MANAGER_EVENT, handleOpenSkillManagerRequested)
})
</script>

<style scoped>
.app-sidebar {
  width: 304px;
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-right: 1px solid var(--topbar-border);
  background: var(--sidebar-bg);
  position: sticky;
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.46);
}

.app-sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 14% 4%, rgba(196, 106, 45, 0.08), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 18%);
  pointer-events: none;
}

.app-sidebar > * {
  position: relative;
  z-index: 1;
}

.app-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 22px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: var(--brand-mark-bg);
  border: 1px solid var(--brand-mark-border);
  padding: 5px;
  flex-shrink: 0;
}

.brand-mark__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-copy {
  min-width: 0;
}

.brand-kicker {
  font-family: var(--font-family-mono);
  font-size: 0.63rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.brand-title {
  margin-top: 2px;
  font-family: var(--font-family-display);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.brand-subtitle {
  margin-top: 2px;
  font-size: 0.74rem;
  color: var(--text-secondary);
}

.mobile-close-btn {
  display: none;
  margin-left: auto;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-inset);
  cursor: pointer;
}

.app-sidebar__nav {
  display: grid;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 16px;
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid rgba(124, 98, 74, 0.08);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.nav-item--button {
  width: 100%;
  text-align: left;
  font: inherit;
  cursor: pointer;
  appearance: none;
}

.nav-item:hover,
.nav-item:focus-visible {
  border-color: var(--border-strong);
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(243, 232, 217, 0.92));
  transform: translateY(-1px);
  outline: none;
}

.nav-item--active {
  border-color: rgba(196, 106, 45, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 248, 238, 0.98), rgba(247, 229, 209, 0.96));
  box-shadow: 0 14px 30px rgba(196, 106, 45, 0.08), var(--shadow-inset);
}

.nav-item__icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-icon-color);
  background: var(--sidebar-icon-bg);
  flex-shrink: 0;
}

.nav-item--active .nav-item__icon {
  color: var(--sidebar-icon-active-color);
  background: var(--sidebar-icon-active-bg);
}

.nav-item__label {
  min-width: 0;
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  flex: 1;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.workshop-history-create,
.workshop-history__skill-btn {
  width: 100%;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.workshop-history-create:hover,
.workshop-history__skill-btn:hover,
.workshop-history-create:focus-visible,
.workshop-history__skill-btn:focus-visible {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  background: var(--bg-card-hover);
  outline: none;
}

.workshop-history-create {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workshop-history-create__icon {
  width: 30px;
  height: 30px;
  border-radius: 12px;
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

.workshop-history__head {
  margin: 2px 2px 8px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
}

.section-kicker {
  display: inline-flex;
  margin-bottom: 4px;
  font-family: var(--font-family-mono);
  font-size: 0.64rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.workshop-history__title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

.workshop-history__summary {
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 252, 247, 0.7);
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
}

.workshop-history__list {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 7px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.workshop-history__item {
  display: flex;
  align-items: stretch;
  gap: 4px;
  border: 1px solid rgba(124, 98, 74, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  color: var(--text-primary);
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.workshop-history__item:hover,
.workshop-history__item:focus-within {
  border-color: var(--border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-inset);
}

.workshop-history__item--active {
  border-color: rgba(196, 106, 45, 0.26);
  background:
    linear-gradient(180deg, rgba(255, 248, 238, 0.98), rgba(247, 229, 209, 0.96));
  box-shadow: 0 14px 28px rgba(196, 106, 45, 0.08), var(--shadow-inset);
}

.workshop-history__item-main {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 10px 10px 10px 12px;
  cursor: pointer;
}

.workshop-history__item-title,
.workshop-history__item-tokens {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workshop-history__item-title {
  font-size: 0.82rem;
  font-weight: 700;
}

.workshop-history__item-meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.workshop-history__item-mode {
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: var(--bg-glass);
  color: var(--text-secondary);
  font-size: 0.62rem;
  line-height: 1;
  white-space: nowrap;
}

.workshop-history__item-tokens {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--sidebar-icon-active-color);
}

.workshop-history__delete {
  width: 30px;
  flex-shrink: 0;
  margin: 4px 4px 4px 0;
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
  transition: opacity var(--transition-fast), visibility var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}

.workshop-history__item--active .workshop-history__delete,
.workshop-history__item:hover .workshop-history__delete,
.workshop-history__item:focus-within .workshop-history__delete {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.workshop-history__delete:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

.workshop-history__empty {
  padding: 16px 14px;
  border-radius: 16px;
  border: 1px dashed var(--border-soft);
  background: rgba(255, 252, 247, 0.54);
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: center;
}

.app-sidebar__user {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 12px;
  border-radius: 20px;
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.user-meta {
  min-width: 0;
}

.user-kicker {
  font-family: var(--font-family-mono);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.user-label {
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.user-name {
  margin-top: 3px;
  font-size: 0.92rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-token-total {
  margin-top: 5px;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--sidebar-icon-active-color);
}

.logout-btn {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: var(--shadow-inset);
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.logout-btn:hover,
.logout-btn:focus-visible {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  background: var(--bg-card-hover);
  outline: none;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100120;
  padding: 16px;
}

.modal {
  width: min(520px, 100%);
  max-height: min(82vh, 760px);
  overflow: auto;
  border-radius: 24px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  padding: 18px;
  box-shadow: var(--shadow-hover), var(--shadow-inset);
}

.modal--wide {
  width: min(720px, 100%);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.modal__title {
  font-family: var(--font-family-display);
  font-size: 1.18rem;
  font-weight: 700;
}

.modal__close {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-inset);
}

.modal__hint {
  margin: 12px 0 14px;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.6;
}

.modal__error {
  margin: 0 0 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger);
  font-size: 0.8rem;
}

.modal__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal__item {
  width: 100%;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  color: var(--text-primary);
  border-radius: 16px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.modal__item:hover,
.modal__item:focus-visible {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  outline: none;
}

.modal__item.active {
  background:
    linear-gradient(180deg, rgba(255, 248, 238, 0.98), rgba(247, 229, 209, 0.96));
  border-color: rgba(196, 106, 45, 0.26);
}

.modal__item small {
  color: var(--text-secondary);
}

.modal__empty {
  border: 1px dashed var(--border-soft);
  border-radius: 16px;
  padding: 14px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  background: var(--bg-muted);
}

.skill-create-form {
  display: grid;
  gap: 10px;
}

.skill-input,
.skill-textarea {
  width: 100%;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  background: var(--bg-input);
  color: var(--text-primary);
  padding: 12px 14px;
  font-size: 0.84rem;
  box-shadow: var(--shadow-inset);
}

.skill-textarea {
  resize: vertical;
}

.skill-primary-btn {
  border: 1px solid rgba(196, 106, 45, 0.26);
  background: linear-gradient(135deg, var(--accent), #d9894e);
  color: var(--text-contrast);
  border-radius: 16px;
  padding: 11px 14px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(196, 106, 45, 0.14);
}

.skill-primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.skill-zip-upload {
  margin-top: 10px;
  border: 1px dashed var(--border-soft);
  border-radius: 18px;
  padding: 12px;
  display: grid;
  gap: 8px;
  background: var(--bg-muted);
}

.skill-zip-upload__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.skill-zip-upload__hint {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.skill-zip-upload__error {
  margin: 0;
}

.modal__section-title {
  margin: 16px 0 8px;
  font-size: 0.84rem;
  color: var(--text-secondary);
  font-weight: 700;
}

.modal__row {
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal__row-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-primary);
}

.modal__row-meta {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 0.74rem;
  line-height: 1.5;
}

.modal__row-actions {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.skill-viewer-package {
  margin-bottom: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  background: var(--bg-muted);
  padding: 12px;
}

.skill-viewer-package__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.skill-viewer-package__title {
  margin-top: 8px;
  margin-bottom: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

.skill-viewer-package__list {
  max-height: 140px;
  overflow: auto;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: var(--bg-elevated);
}

.skill-viewer-package__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-soft);
}

.skill-viewer-package__item:last-child {
  border-bottom: none;
}

.skill-viewer-package__path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: var(--text-primary);
  word-break: break-all;
}

.skill-viewer-package__size {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 0.7rem;
}

.skill-viewer-pre {
  margin: 0;
  max-height: 58vh;
  overflow: auto;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  background: var(--workshop-code-bg);
  color: var(--text-primary);
  padding: 14px;
  font-size: 0.8rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.skill-inline-btn {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 7px 10px;
  font-size: 0.74rem;
  cursor: pointer;
  box-shadow: var(--shadow-inset);
}

.skill-inline-btn--danger {
  border-color: var(--danger-border);
  color: var(--danger);
  background: var(--danger-bg);
}

[data-theme='dark'] .app-sidebar {
  box-shadow: 1px 0 0 rgba(255, 244, 228, 0.04), 16px 0 44px rgba(0, 0, 0, 0.26);
}

[data-theme='dark'] .app-sidebar::before {
  background:
    radial-gradient(circle at 14% 4%, rgba(201, 138, 74, 0.16), transparent 22%),
    linear-gradient(180deg, rgba(255, 244, 228, 0.04), transparent 16%);
}

[data-theme='dark'] .app-sidebar__brand,
[data-theme='dark'] .app-sidebar__panel,
[data-theme='dark'] .app-sidebar__user {
  background:
    linear-gradient(180deg, #49352d, #2d211c);
  border-color: rgba(230, 201, 171, 0.12);
}

[data-theme='dark'] .nav-item,
[data-theme='dark'] .workshop-history__item,
[data-theme='dark'] .modal__item,
[data-theme='dark'] .modal__row {
  background:
    linear-gradient(180deg, #5a4238, #372821);
  border-color: rgba(230, 201, 171, 0.1);
}

[data-theme='dark'] .nav-item:hover,
[data-theme='dark'] .nav-item:focus-visible,
[data-theme='dark'] .workshop-history__item:hover,
[data-theme='dark'] .workshop-history__item:focus-within,
[data-theme='dark'] .modal__item:hover,
[data-theme='dark'] .modal__item:focus-visible {
  border-color: rgba(230, 201, 171, 0.18);
  background:
    linear-gradient(180deg, #6a4d41, #433128);
}

[data-theme='dark'] .nav-item--active,
[data-theme='dark'] .workshop-history__item--active,
[data-theme='dark'] .modal__item.active {
  border-color: rgba(230, 201, 171, 0.22);
  background:
    linear-gradient(180deg, rgba(201, 138, 74, 0.24), rgba(61, 42, 29, 0.7));
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 244, 228, 0.08);
}

[data-theme='dark'] .workshop-history-create,
[data-theme='dark'] .workshop-history__skill-btn,
[data-theme='dark'] .skill-manager-entry,
[data-theme='dark'] .logout-btn,
[data-theme='dark'] .workshop-history__page-btn,
[data-theme='dark'] .modal__close,
[data-theme='dark'] .skill-inline-btn {
  background:
    linear-gradient(180deg, #533d33, #31241e);
  border-color: rgba(230, 201, 171, 0.12);
}

[data-theme='dark'] .workshop-history__item-mode,
[data-theme='dark'] .skill-viewer-package,
[data-theme='dark'] .skill-zip-upload,
[data-theme='dark'] .modal__empty,
[data-theme='dark'] .skill-viewer-pre {
  background: rgba(255, 244, 228, 0.04);
  border-color: rgba(230, 201, 171, 0.1);
}

[data-theme='dark'] .modal,
[data-theme='dark'] .skill-viewer-package__list {
  background:
    linear-gradient(180deg, #48342c, #2a1f1a);
  border-color: rgba(230, 201, 171, 0.14);
}

[data-theme='dark'] .skill-input,
[data-theme='dark'] .skill-textarea {
  background: #372923;
  border-color: rgba(230, 201, 171, 0.12);
}

@media (max-width: 960px) {
  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 30;
    width: min(320px, calc(100vw - 20px));
    transform: translateX(-100%);
    transition: transform var(--transition-smooth);
  }

  .app-sidebar--mobile-open {
    transform: translateX(0);
  }

  .mobile-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>





