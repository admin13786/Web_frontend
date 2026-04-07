import { createRouter, createWebHistory } from 'vue-router'
import { login } from '../api/auth.js'
import { DEFAULT_USER, getCurrentUser, saveCurrentUser } from '../utils/auth.js'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/channel',
      },
      {
        path: 'channel',
        name: 'Channel',
        component: () => import('../views/ChannelView.vue'),
        meta: {
          requiresAuth: true,
          title: 'AI新闻早咖啡',
          description: '查看热点排行与讲解入口',
        },
      },
      {
        path: 'workshop',
        name: 'Workshop',
        component: () => import('../views/WorkshopView.vue'),
        meta: {
          requiresAuth: true,
          title: '创意工坊',
          description: '对话生成与结果预览',
        },
      },
      {
        path: 'openmaic',
        name: 'OpenMAIC',
        component: () => import('../views/OpenMAICView.vue'),
        meta: {
          requiresAuth: true,
          title: 'OpenMAIC',
          description: '内嵌应用入口',
        },
      },
      {
        path: 'news/:newsId',
        name: 'NewsDetail',
        component: () => import('../views/NewsDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '资讯详情',
          description: '查看原文与资讯详情',
        },
      },
      {
        path: 'brief/:newsId',
        name: 'NewsBrief',
        component: () => import('../views/NewsBriefView.vue'),
        meta: {
          requiresAuth: true,
          title: '简报详情',
          description: '从AI新闻早咖啡跳转查看摘要',
        },
      },
    ],
  },
  {
    path: '/home',
    redirect: '/channel',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let defaultLoginPromise = null

async function ensureDefaultUser() {
  if (!defaultLoginPromise) {
    const existing = getCurrentUser()
    if (!existing) {
      saveCurrentUser({
        username: DEFAULT_USER.username,
        displayName: DEFAULT_USER.displayName,
        token: `default_local_${Date.now()}`,
      })
    }

    defaultLoginPromise = login({
      username: DEFAULT_USER.username,
      password: DEFAULT_USER.password,
    })
      .then((res) => {
        if (res.success && res.token) {
          saveCurrentUser({
            username: res.user?.username || DEFAULT_USER.username,
            displayName: res.user?.displayName || DEFAULT_USER.displayName,
            token: res.token,
          })
          return true
        }
        return !!getCurrentUser()
      })
      .catch(() => !!getCurrentUser())
      .finally(() => {
        defaultLoginPromise = null
      })
  }

  return defaultLoginPromise
}

router.beforeEach(async (to) => {
  let user = getCurrentUser()
  if (!user && to.meta.requiresAuth) {
    const ok = await ensureDefaultUser()
    if (ok) user = getCurrentUser()
  }

  if (to.name === 'Login' && user) {
    return '/'
  }

  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  return true
})

export default router
