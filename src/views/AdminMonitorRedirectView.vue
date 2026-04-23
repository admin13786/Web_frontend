<template>
  <div class="admin-redirect-page">
    <div class="admin-redirect-card">
      <span class="admin-redirect-kicker">LINGJING / OPERATIONS DESK</span>
      <h1 class="admin-redirect-title">正在进入运营看板</h1>
      <p class="admin-redirect-desc">
        管理员账号已识别，系统会把你带到新闻爬取与推送控制台。若浏览器没有自动跳转，可以手动进入。
      </p>

      <div class="admin-redirect-actions">
        <a class="admin-redirect-primary" :href="monitorUrl">打开看板</a>
        <button type="button" class="admin-redirect-secondary" @click="goHome">
          返回主站
        </button>
      </div>

      <p class="admin-redirect-url">{{ monitorUrl }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMonitorAppUrl } from '../config.js'
import { getCurrentUser } from '../utils/auth.js'

const router = useRouter()

function buildMonitorUrl() {
  const base = getMonitorAppUrl()
  const token = String(getCurrentUser()?.token || '').trim()
  if (!token) return base
  const loginUrl = new URL('/login', window.location.origin).toString()
  const hash = new URLSearchParams({ token, login: loginUrl }).toString()
  return `${base}#${hash}`
}

const monitorUrl = computed(() => buildMonitorUrl())

function goHome() {
  router.replace('/home')
}

onMounted(() => {
  window.setTimeout(() => {
    window.location.assign(monitorUrl.value)
  }, 180)
})
</script>

<style scoped>
.admin-redirect-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.admin-redirect-card {
  width: min(560px, 100%);
  padding: 32px;
  border-radius: 28px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-elevated), var(--bg-card));
  box-shadow: var(--shadow-card), var(--shadow-inset);
}

.admin-redirect-kicker {
  display: inline-flex;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.admin-redirect-title {
  margin: 16px 0 0;
  font-family: var(--font-family-display);
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 0.98;
}

.admin-redirect-desc {
  margin: 18px 0 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.admin-redirect-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.admin-redirect-primary,
.admin-redirect-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  text-decoration: none;
  cursor: pointer;
  font: inherit;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.admin-redirect-primary {
  background: linear-gradient(135deg, var(--accent), #d9894e);
  color: var(--text-contrast);
  border-color: transparent;
}

.admin-redirect-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.admin-redirect-primary:hover,
.admin-redirect-secondary:hover {
  transform: translateY(-1px);
}

.admin-redirect-url {
  margin-top: 18px;
  font-size: 0.84rem;
  color: var(--text-muted);
  word-break: break-all;
}

@media (max-width: 640px) {
  .admin-redirect-card {
    padding: 24px 20px;
  }
}
</style>
