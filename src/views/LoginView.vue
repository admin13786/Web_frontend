<template>
  <div class="login-page">
    <div class="login-bg-pattern" />
    <div
      class="login-layout"
      v-motion
      :initial="{ opacity: 0, y: 40 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }"
    >
      <section class="login-intro">
        <span class="login-kicker">LINGJING / ACCESS DESK</span>
        <h1 class="login-title">{{ mode === 'login' ? '先登录，再进入你的灵境工作台' : '创建账号，保存你的创作与资讯轨迹' }}</h1>
        <p class="login-subtitle">
          {{
            mode === 'login'
              ? '登录后可继续查看 AI 趣闻萃取、进入 AI 工坊，并保留你自己的对话与阅读记录。'
              : '注册完成后会自动进入站内，后续新闻浏览、工坊对话和摘要阅读都会按你的账号独立保存。'
          }}
        </p>

        <div class="login-points">
          <div class="login-point">
            <span class="login-point__label">NEWS DESK</span>
            <strong>每日热点、AI 概览与原文阅读入口统一归档。</strong>
          </div>
          <div class="login-point">
            <span class="login-point__label">WORKSHOP</span>
            <strong>工坊会话与预览记录跟随账号隔离，不再混用。</strong>
          </div>
          <div class="login-point">
            <span class="login-point__label">ACCOUNT</span>
            <strong>管理员账号会自动进入运营看板，普通用户进入主站。</strong>
          </div>
        </div>
      </section>

      <section class="login-card">
        <div class="mode-switch">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: mode === 'login' }"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: mode === 'register' }"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'" class="form-group">
            <label for="displayName">显示名称</label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              placeholder="例如：小林 / 产品运营"
            />
          </div>

          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              :placeholder="mode === 'register' ? '至少 6 位密码' : '请输入密码'"
              required
            />
          </div>

          <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>

          <button type="submit" class="login-btn" :disabled="loading">
            {{
              loading
                ? (mode === 'login' ? '登录中...' : '注册中...')
                : (mode === 'login' ? '登录并进入' : '注册并进入')
            }}
          </button>
        </form>

        <p class="login-footnote">
          {{ mode === 'login' ? '未登录用户无法直接进入站内页面。' : '注册完成后会自动保存当前登录态。' }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, register } from '../api/auth.js'
import { getDefaultRouteForUser, saveCurrentUser } from '../utils/auth.js'

const router = useRouter()
const route = useRoute()
const initialMode = String(route.query.mode || '').trim() === 'register' ? 'register' : 'login'
const mode = ref(initialMode)
const displayName = ref('')
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

function switchMode(nextMode) {
  mode.value = nextMode
  errorMsg.value = ''
  username.value = ''
  password.value = ''
  displayName.value = ''
}

function resolvePostLoginTarget(savedUser) {
  const defaultRoute = getDefaultRouteForUser(savedUser)
  if (savedUser?.isAdmin) return defaultRoute

  const redirect = String(route.query.redirect || '').trim()
  if (redirect.startsWith('/')) return redirect
  return defaultRoute
}

function completeAuth(response, fallbackUsername, fallbackDisplayName) {
  const savedUser = saveCurrentUser({
    username: response.user?.username || fallbackUsername,
    displayName: response.user?.displayName || fallbackDisplayName || fallbackUsername,
    role: response.user?.role,
    token: response.token,
  })
  router.replace(resolvePostLoginTarget(savedUser))
}

async function handleSubmit() {
  errorMsg.value = ''

  if (!username.value.trim()) {
    errorMsg.value = '用户名不能为空'
    return
  }
  if (!password.value) {
    errorMsg.value = '密码不能为空'
    return
  }
  if (mode.value === 'register' && password.value.length < 6) {
    errorMsg.value = '密码至少需要 6 位'
    return
  }

  loading.value = true
  try {
    if (mode.value === 'login') {
      const response = await login({
        username: username.value.trim(),
        password: password.value,
      })
      if (response.success && response.token) {
        completeAuth(response, username.value.trim(), username.value.trim())
      } else {
        errorMsg.value = response.message || '登录失败'
      }
    } else {
      const normalizedDisplayName = displayName.value.trim() || username.value.trim()
      const response = await register({
        username: username.value.trim(),
        password: password.value,
        displayName: normalizedDisplayName,
      })
      if (response.success && response.token) {
        completeAuth(response, username.value.trim(), normalizedDisplayName)
      } else {
        errorMsg.value = response.message || '注册失败'
      }
    }
  } catch (error) {
    errorMsg.value = error?.message || '网络异常，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  position: relative;
  overflow: hidden;
}

.login-bg-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 58% 36% at 8% 8%, rgba(196, 106, 45, 0.16), transparent 68%),
    radial-gradient(ellipse 42% 28% at 92% 10%, rgba(111, 123, 92, 0.14), transparent 70%),
    radial-gradient(ellipse 54% 40% at 62% 100%, rgba(141, 70, 55, 0.1), transparent 72%);
  pointer-events: none;
}

.login-layout {
  width: 100%;
  max-width: 1060px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
  gap: 32px;
  align-items: stretch;
  position: relative;
  z-index: 1;
}

.login-intro {
  padding: 40px 8px 40px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 22px;
}

.login-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 252, 247, 0.72);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
  box-shadow: var(--shadow-inset);
}

.login-title {
  margin: 0;
  max-width: 11ch;
  font-family: var(--font-family-display);
  font-size: clamp(2.5rem, 5vw, 4.3rem);
  line-height: 0.96;
  letter-spacing: 0.01em;
}

.login-subtitle {
  max-width: 48ch;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.9;
}

.login-points {
  display: grid;
  gap: 14px;
  max-width: 520px;
}

.login-point {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.92), rgba(247, 239, 229, 0.88));
  box-shadow: var(--shadow-soft), var(--shadow-inset);
}

.login-point__label {
  display: inline-flex;
  margin-bottom: 8px;
  font-family: var(--font-family-mono);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  color: var(--kicker-color);
}

.login-point strong {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.login-card {
  padding: 34px;
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(247, 239, 229, 0.94));
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card), var(--shadow-inset);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent 28%),
    radial-gradient(circle at top right, rgba(196, 106, 45, 0.12), transparent 34%);
  pointer-events: none;
}

.mode-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  padding: 4px;
  border-radius: 18px;
  border: 1px solid var(--border-soft);
  background: rgba(239, 229, 214, 0.6);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  position: relative;
  z-index: 1;
}

.mode-btn {
  flex: 1;
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 700;
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.mode-btn.active {
  background: linear-gradient(135deg, var(--accent), #d9894e);
  color: var(--text-contrast);
  box-shadow: 0 10px 22px rgba(196, 106, 45, 0.18);
}

.mode-btn:not(.active):hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.form-group input {
  padding: 15px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  box-shadow: var(--shadow-inset);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
  background: rgba(255, 253, 249, 0.98);
}

.login-btn {
  margin-top: 6px;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--accent), #d9894e);
  color: var(--text-contrast);
  border: none;
  border-radius: 18px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), filter var(--transition-fast);
  box-shadow: 0 16px 32px rgba(196, 106, 45, 0.18);
}

.login-btn:hover {
  filter: brightness(1.03);
  transform: translateY(-2px);
}

.login-btn:active {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-error {
  margin: 0;
  padding: 2px 0;
  font-size: 0.9rem;
  color: var(--danger);
}

.login-footnote {
  margin-top: 18px;
  position: relative;
  z-index: 1;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.6;
}

[data-theme='dark'] .login-bg-pattern {
  background:
    radial-gradient(ellipse 52% 34% at 8% 8%, rgba(201, 138, 74, 0.18), transparent 62%),
    radial-gradient(ellipse 36% 22% at 92% 10%, rgba(156, 166, 134, 0.1), transparent 60%),
    radial-gradient(ellipse 44% 28% at 62% 100%, rgba(209, 145, 125, 0.08), transparent 64%);
}

[data-theme='dark'] .login-kicker,
[data-theme='dark'] .login-point,
[data-theme='dark'] .login-card {
  border-color: rgba(230, 201, 171, 0.12);
}

[data-theme='dark'] .login-kicker {
  background: rgba(255, 244, 228, 0.05);
}

[data-theme='dark'] .login-point {
  background: linear-gradient(180deg, rgba(34, 26, 22, 0.94), rgba(19, 15, 13, 0.96));
}

[data-theme='dark'] .login-card {
  background: linear-gradient(180deg, rgba(31, 24, 21, 0.98), rgba(18, 14, 12, 0.96));
}

[data-theme='dark'] .login-card::before {
  background:
    linear-gradient(180deg, rgba(255, 244, 228, 0.04), transparent 28%),
    radial-gradient(circle at top right, rgba(201, 138, 74, 0.18), transparent 34%);
}

[data-theme='dark'] .mode-switch {
  background: rgba(255, 244, 228, 0.05);
  border-color: rgba(230, 201, 171, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 244, 228, 0.05);
}

[data-theme='dark'] .mode-btn:not(.active):hover {
  color: var(--text-primary);
  background: rgba(255, 244, 228, 0.05);
}

[data-theme='dark'] .form-group input:focus {
  background: rgba(26, 19, 17, 0.98);
}

@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 560px;
  }

  .login-intro {
    padding: 0;
    gap: 16px;
  }

  .login-title {
    max-width: none;
    font-size: 2.5rem;
  }

  .login-subtitle {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    padding: 24px 20px;
  }

  .login-title {
    font-size: 2.1rem;
  }
}
</style>
