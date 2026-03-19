<template>
  <div class="login-page">
    <div class="login-bg-pattern" />
    <div
      class="login-card"
      v-motion
      :initial="{ opacity: 0, y: 40 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }"
    >
      <h1 class="login-title">欢迎回来</h1>
      <p class="login-subtitle">登录以继续访问您的仪表盘</p>
      
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
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
            placeholder="请输入密码"
            required
          />
        </div>
        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
        <button type="submit" class="login-btn" :disabled="loading">{{ loading ? '登录中…' : '登录' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  if (!username.value.trim() || !password.value) return
  loading.value = true
  try {
    const res = await login({ username: username.value.trim(), password: password.value })
    if (res.success && res.token) {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('token', res.token)
      router.push('/home')
    } else {
      errorMsg.value = res.message || '登录失败'
    }
  } catch (e) {
    errorMsg.value = e.message || '网络错误，请稍后重试'
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
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.login-bg-pattern {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(99, 102, 241, 0.08), transparent);
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}

.login-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.login-btn {
  margin-top: 8px;
  padding: 16px 24px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.login-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
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
  padding: 10px 0;
  font-size: 0.9rem;
  color: var(--accent);
}
</style>
