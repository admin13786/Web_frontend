import { createRouter, createWebHistory } from 'vue-router'
import { trackPageView } from '../api/analytics.js'
import {
  getCurrentUser,
  getDefaultRouteForUser,
  isAdminUser,
} from '../utils/auth.js'
import {
  FUNCTION_MODE,
  getPathForFunctionMode,
  normalizeFunctionMode,
} from '../utils/functionMode.js'

function resolveAppHome() {
  return getDefaultRouteForUser(getCurrentUser())
}

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () => resolveAppHome(),
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
        meta: {
          requiresAuth: true,
          title: '灵境首页',
          description: '从新闻、工坊与课堂三个入口开始今天的内容工作流。',
        },
      },
      {
        path: 'channel',
        name: 'Channel',
        component: () => import('../views/ChannelView.vue'),
        meta: {
          requiresAuth: true,
          title: 'AI趣闻萃取',
          description: '查看今日热点、AI概览与延伸阅读入口。',
        },
      },
      {
        path: 'workshop',
        name: 'Workshop',
        component: () => import('../views/WorkshopView.vue'),
        meta: {
          requiresAuth: true,
          functionMode: FUNCTION_MODE.WORKSHOP,
          title: '创意工坊',
          description: '把需求整理成可预览页面、交互原型与创意作品。',
        },
      },
      {
        path: 'skills',
        name: 'SkillAssistant',
        component: () => import('../views/WorkshopView.vue'),
        meta: {
          requiresAuth: true,
          functionMode: FUNCTION_MODE.SKILL_ASSISTANT,
          title: 'Skill 助手',
          description: '把任务交给 Agent，并结合 Skills 与附件完成交付型输出。',
        },
      },
      {
        path: 'openmaic',
        name: 'OpenMAIC',
        component: () => import('../views/OpenMAICView.vue'),
        meta: {
          requiresAuth: true,
          title: 'OpenMAIC',
          description: '跳转进入 OpenMAIC 课堂体验。',
        },
      },
      {
        path: 'edu-repo',
        name: 'EduRepo',
        component: () => import('../views/EduRepoView.vue'),
        meta: {
          requiresAuth: true,
          title: 'EduRepo',
          description: '将热点内容加工为更适合沉浸阅读的知识卡片。',
        },
      },
      {
        path: 'edurepo',
        redirect: '/edu-repo',
      },
      {
        path: 'news/:newsId',
        name: 'NewsDetail',
        component: () => import('../views/NewsDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '新闻原文',
          description: '查看原文线索、来源信息与后续讲解入口。',
        },
      },
      {
        path: 'brief/:newsId',
        name: 'NewsBrief',
        component: () => import('../views/NewsBriefView.vue'),
        meta: {
          requiresAuth: true,
          title: 'AI简报',
          description: '用更轻松易读的方式理解同一条新闻。',
        },
      },
    ],
  },
  {
    path: '/admin/monitor',
    name: 'AdminMonitor',
    component: () => import('../views/AdminMonitorRedirectView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '运营看板',
      description: '进入爬虫与推送控制台。',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: '登录',
      description: '登录后进入你的灵境工作台。',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if ((to.path === '/workshop' || to.path === '/skills') && 'fm' in (to.query || {})) {
    const nextMode = normalizeFunctionMode(to.query.fm)
    const nextPath = getPathForFunctionMode(nextMode)
    const { fm: _ignoredMode, ...restQuery } = to.query || {}
    return {
      path: nextPath,
      query: restQuery,
    }
  }

  const user = getCurrentUser()
  const isLoggedIn = Boolean(user?.username && user?.token)

  if (to.name === 'Login') {
    if (!isLoggedIn) return true
    return getDefaultRouteForUser(user)
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      name: 'Login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.requiresAdmin && !isAdminUser(user)) {
    return getDefaultRouteForUser(user)
  }

  return true
})

router.afterEach((to) => {
  void trackPageView(to)
})

export default router
