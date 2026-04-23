import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import { fetchCurrentSession } from './api/auth.js'
import router from './router'
import './styles/global.css'
import 'vue3-markdown/dist/vue3-markdown.css'
import { clearCurrentUser, getCurrentUser, saveCurrentUser } from './utils/auth.js'

async function bootstrapAuthSession() {
  const currentUser = getCurrentUser()
  if (!currentUser?.username || !currentUser?.token) return

  try {
    const session = await fetchCurrentSession()
    if (session?.success && session.user?.username) {
      saveCurrentUser({
        ...currentUser,
        ...session.user,
        token: currentUser.token,
      })
      return
    }
    if (session?.status === 401) {
      clearCurrentUser()
    }
  } catch (error) {
    console.warn('[auth] bootstrap session validation failed:', error)
  }
}

async function initApp() {
  await bootstrapAuthSession()

  const app = createApp(App)
  app.use(MotionPlugin)
  app.use(router)
  app.mount('#app')
}

void initApp()
