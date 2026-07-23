<template>
  <div class="news-chat-page">
    <section class="chat-hero">
      <div>
        <span class="chat-kicker">NEWS RAG ASSISTANT</span>
        <h1 class="chat-title">新闻问答机器人</h1>
        <p class="chat-desc">
          基于已爬取的新闻库进行意图识别、混合检索和引用式回答。适合追问热点背景、比较多条新闻，或快速整理今日重点。
        </p>
      </div>
      <div class="chat-status">
        <span class="status-dot" :class="{ 'status-dot--active': !!sessionId }" />
        <span>{{ sessionId ? '会话已保存' : '新会话' }}</span>
      </div>
    </section>

    <section class="chat-layout">
      <main class="chat-main">
        <div class="message-list">
          <article v-if="!messages.length" class="empty-card">
            <span class="chat-kicker">TRY FIRST</span>
            <h2>可以直接问新闻库</h2>
            <p>例如“今天 OpenAI 有什么重要动态？”、“最近 AI Agent 产品有什么趋势？”、“推荐几条值得看的开发者新闻”。</p>
          </article>

          <article
            v-for="(message, index) in messages"
            :key="`${message.role}-${index}`"
            class="message-card"
            :class="`message-card--${message.role}`"
          >
            <div class="message-role">{{ message.role === 'user' ? '你' : '新闻助手' }}</div>
            <p class="message-content">{{ message.content }}</p>
          </article>

          <article v-if="loading" class="message-card message-card--assistant">
            <div class="message-role">新闻助手</div>
            <p class="message-content">正在识别意图、检索新闻库并组织引用...</p>
          </article>
        </div>

        <form class="chat-input-panel" @submit.prevent="submitMessage">
          <textarea
            v-model="draft"
            class="chat-input"
            rows="3"
            placeholder="输入你的新闻问题，例如：最近 AI Agent 有哪些值得关注的产品动态？"
            :disabled="loading"
            @keydown.enter.exact.prevent="submitMessage"
          />
          <div class="chat-input-actions">
            <div class="chat-options">
              <label>
                <span>时间范围</span>
                <select v-model.number="days" class="chat-select" :disabled="loading">
                  <option :value="3">近 3 天</option>
                  <option :value="7">近 7 天</option>
                  <option :value="14">近 14 天</option>
                  <option :value="30">近 30 天</option>
                </select>
              </label>
              <label>
                <span>引用数量</span>
                <select v-model.number="limit" class="chat-select" :disabled="loading">
                  <option :value="4">4 条</option>
                  <option :value="6">6 条</option>
                  <option :value="8">8 条</option>
                </select>
              </label>
            </div>
            <button type="submit" class="send-btn" :disabled="loading || !draft.trim()">
              {{ loading ? '生成中...' : '发送' }}
            </button>
          </div>
        </form>
      </main>

      <aside class="chat-side">
        <section class="side-card">
          <div class="side-card__head">
            <span class="chat-kicker">QUICK PROMPTS</span>
            <h2>快速测试</h2>
          </div>
          <div class="prompt-list">
            <button
              v-for="item in quickPrompts"
              :key="item"
              type="button"
              class="prompt-chip"
              :disabled="loading"
              @click="usePrompt(item)"
            >
              {{ item }}
            </button>
          </div>
        </section>

        <section class="side-card">
          <div class="side-card__head">
            <span class="chat-kicker">SESSIONS</span>
            <h2>最近会话</h2>
          </div>
          <div class="session-actions">
            <button type="button" class="session-action" :disabled="loading" @click="startNewSession">
              新建会话
            </button>
            <button type="button" class="session-action" :disabled="sessionsLoading" @click="loadSessions">
              {{ sessionsLoading ? '刷新中...' : '刷新列表' }}
            </button>
          </div>
          <div v-if="sessionsLoading" class="session-empty">正在读取...</div>
          <div v-else-if="!sessions.length" class="session-empty">暂无已保存会话</div>
          <div v-else class="session-list">
            <button
              v-for="item in sessions"
              :key="item.sessionId"
              type="button"
              class="session-item"
              :class="{ 'session-item--active': item.sessionId === sessionId }"
              :disabled="loading"
              @click="openSession(item.sessionId)"
            >
              <span>{{ item.title || '新闻对话' }}</span>
              <small>{{ item.lastMessage || `${item.historyCount || 0} 条消息` }}</small>
            </button>
          </div>
        </section>

        <section v-if="latestIntent" class="side-card">
          <div class="side-card__head">
            <span class="chat-kicker">ROUTER</span>
            <h2>意图识别</h2>
          </div>
          <div class="fact-list">
            <div class="fact-row">
              <span>意图</span>
              <strong>{{ latestIntent.intent || '-' }}</strong>
            </div>
            <div class="fact-row">
              <span>路由</span>
              <strong>{{ latestIntent.router || '-' }}</strong>
            </div>
            <div class="fact-row">
              <span>检索词</span>
              <strong>{{ latestIntent.query || '最新新闻' }}</strong>
            </div>
          </div>
        </section>

        <section v-if="latestCitations.length" class="side-card">
          <div class="side-card__head">
            <span class="chat-kicker">CITATIONS</span>
            <h2>引用来源</h2>
          </div>
          <div class="citation-list">
            <a
              v-for="item in latestCitations"
              :key="`${item.index}-${item.id}`"
              class="citation-item"
              :href="item.url"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span class="citation-index">[{{ item.index }}]</span>
              <span class="citation-title">{{ item.title }}</span>
              <small>{{ item.source || '未知来源' }}</small>
            </a>
          </div>
        </section>

        <section v-if="error" class="side-card side-card--error">
          <div class="side-card__head">
            <span class="chat-kicker">ERROR</span>
            <h2>请求失败</h2>
          </div>
          <p>{{ error }}</p>
        </section>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getNewsChatSession, listNewsChatSessions, sendNewsChatMessage } from '../api/newsChat.js'

const quickPrompts = [
  '今天 AI 行业有哪些最新新闻？',
  '最近 AI Agent 产品有什么趋势？',
  '推荐几条适合开发者关注的新闻',
  'OpenAI 最近有什么重要动态？',
]

const draft = ref('')
const messages = ref([])
const sessionId = ref('')
const latestIntent = ref(null)
const latestCitations = ref([])
const sessions = ref([])
const sessionsLoading = ref(false)
const loading = ref(false)
const error = ref('')
const days = ref(7)
const limit = ref(6)
const STORAGE_KEY = 'lingjing-news-chat-session-id'

const requestHistory = computed(() => {
  return messages.value
    .map((item) => ({ role: item.role, content: item.content }))
    .slice(-10)
})

function usePrompt(prompt) {
  draft.value = prompt
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .map((item) => ({
      role: String(item?.role || '').trim() === 'assistant' ? 'assistant' : 'user',
      content: String(item?.content || '').trim(),
    }))
    .filter((item) => item.content)
}

function startNewSession() {
  sessionId.value = ''
  messages.value = []
  latestIntent.value = null
  latestCitations.value = []
  error.value = ''
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

async function loadSessions() {
  sessionsLoading.value = true
  try {
    sessions.value = await listNewsChatSessions(12)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    sessionsLoading.value = false
  }
}

async function openSession(id) {
  const normalizedId = String(id || '').trim()
  if (!normalizedId || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const session = await getNewsChatSession(normalizedId)
    sessionId.value = session.sessionId || normalizedId
    messages.value = normalizeHistory(session.history)
    latestIntent.value = null
    latestCitations.value = []
    window.localStorage.setItem(STORAGE_KEY, sessionId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

async function submitMessage() {
  const message = draft.value.trim()
  if (!message || loading.value) return

  const historyBeforeSend = requestHistory.value
  messages.value.push({ role: 'user', content: message })
  draft.value = ''
  error.value = ''
  loading.value = true

  try {
    const result = await sendNewsChatMessage({
      message,
      sessionId: sessionId.value,
      history: historyBeforeSend,
      days: days.value,
      limit: limit.value,
    })
    sessionId.value = result.sessionId || sessionId.value
    if (sessionId.value) {
      window.localStorage.setItem(STORAGE_KEY, sessionId.value)
    }
    latestIntent.value = result.intent || null
    latestCitations.value = Array.isArray(result.citations) ? result.citations : []
    messages.value.push({
      role: 'assistant',
      content: result.answer || '没有生成有效回答。',
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    messages.value.push({
      role: 'assistant',
      content: `这次问答失败：${error.value}`,
    })
  } finally {
    loading.value = false
    void loadSessions()
  }
}

onMounted(async () => {
  await loadSessions()
  try {
    const savedSessionId = window.localStorage.getItem(STORAGE_KEY)
    if (savedSessionId) {
      await openSession(savedSessionId)
    }
  } catch {
    // ignore storage errors
  }
})
</script>

<style scoped>
.news-chat-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.chat-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding: 30px;
  border-radius: 30px;
  border: 1px solid var(--border-soft);
  background:
    radial-gradient(circle at top right, rgba(65, 105, 225, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(255, 252, 247, 0.96), rgba(239, 246, 255, 0.94));
  box-shadow: var(--shadow-card);
}

.chat-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--kicker-color);
}

.chat-title {
  margin-top: 12px;
  font-family: var(--font-family-display);
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
}

.chat-desc {
  margin-top: 14px;
  max-width: 68ch;
  color: var(--text-secondary);
  line-height: 1.8;
}

.chat-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #c2c7d0;
}

.status-dot--active {
  background: #2fb872;
}

.chat-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.chat-main,
.side-card {
  border-radius: 28px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 251, 246, 0.92);
  box-shadow: var(--shadow-soft);
}

.chat-main {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 220px);
  overflow: hidden;
}

.message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow: auto;
}

.empty-card,
.message-card {
  border-radius: 22px;
  border: 1px solid var(--border-soft);
  padding: 18px;
  background: rgba(255, 255, 255, 0.7);
}

.empty-card h2 {
  margin-top: 10px;
  font-family: var(--font-family-display);
  font-size: 1.8rem;
}

.empty-card p {
  margin-top: 10px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.message-card {
  max-width: 86%;
}

.message-card--user {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(38, 78, 112, 0.92), rgba(51, 111, 125, 0.9));
  color: #fff;
}

.message-card--assistant {
  align-self: flex-start;
}

.message-role {
  font-size: 0.78rem;
  opacity: 0.72;
  margin-bottom: 8px;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.85;
}

.chat-input-panel {
  border-top: 1px solid var(--border-soft);
  padding: 16px;
  background: rgba(255, 255, 255, 0.62);
}

.chat-input {
  width: 100%;
  resize: vertical;
  min-height: 92px;
  border: 1px solid var(--border-soft);
  border-radius: 20px;
  padding: 14px 16px;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.9);
  outline: none;
  line-height: 1.7;
}

.chat-input:focus {
  border-color: var(--border-strong);
  box-shadow: 0 0 0 3px rgba(65, 105, 225, 0.12);
}

.chat-input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 12px;
}

.chat-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chat-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.chat-select {
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-primary);
}

.send-btn {
  border: none;
  border-radius: 999px;
  padding: 11px 22px;
  background: #1f5e67;
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.chat-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  padding: 20px;
}

.side-card--error {
  border-color: var(--danger-border);
  background: rgba(255, 246, 246, 0.94);
}

.side-card__head h2 {
  margin-top: 8px;
  font-family: var(--font-family-display);
  font-size: 1.42rem;
}

.prompt-list,
.citation-list,
.fact-list,
.session-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.session-action {
  flex: 1;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
  cursor: pointer;
}

.session-empty {
  margin-top: 14px;
  color: var(--text-secondary);
}

.session-item {
  text-align: left;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
  cursor: pointer;
}

.session-item span {
  display: block;
  font-weight: 600;
  line-height: 1.5;
}

.session-item small {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.session-item--active {
  border-color: rgba(31, 94, 103, 0.35);
  background: rgba(31, 94, 103, 0.08);
}

.prompt-chip {
  text-align: left;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 11px 12px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
  cursor: pointer;
}

.prompt-chip:hover {
  border-color: var(--border-strong);
}

.fact-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-secondary);
}

.fact-row strong {
  color: var(--text-primary);
  text-align: right;
}

.citation-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.68);
  color: var(--text-primary);
  text-decoration: none;
}

.citation-index {
  color: #1f5e67;
  font-weight: 700;
}

.citation-title {
  line-height: 1.45;
}

.citation-item small {
  grid-column: 2;
  color: var(--text-secondary);
}

@media (max-width: 980px) {
  .chat-hero {
    align-items: start;
    flex-direction: column;
  }

  .chat-layout {
    grid-template-columns: 1fr;
  }

  .message-card {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .chat-hero,
  .side-card {
    padding: 18px;
    border-radius: 22px;
  }

  .chat-input-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .send-btn {
    width: 100%;
  }
}
</style>
