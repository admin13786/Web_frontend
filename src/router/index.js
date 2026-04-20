import { createRouter, createWebHistory } from 'vue-router'
import { trackPageView } from '../api/analytics.js'
import { getCurrentUser } from '../utils/auth.js'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        redirect: '/workshop',
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
        meta: {
          requiresAuth: false,
          title: '欢迎页',
          description: '选择工作区并开始新的内容创作流程',
        },
      },
      {
        path: 'channel',
        name: 'Channel',
        component: () => import('../views/ChannelView.vue'),
        meta: {
          requiresAuth: false,
          title: 'AI新闻早咖啡',
          description: '查看热点排行与讲解入口',
        },
      },
      {
        path: 'workshop',
        name: 'Workshop',
        component: () => import('../views/WorkshopView.vue'),
        meta: {
          requiresAuth: false,
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
        path: 'edu-repo',
        name: 'EduRepo',
        component: () => import('../views/EduRepoView.vue'),
        meta: {
          requiresAuth: false,
          title: 'EduRepo',
          description: 'AI 科普内容加工与教育内容浏览',
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
          requiresAuth: false,
          title: '资讯详情',
          description: '查看原文与资讯详情',
        },
      },
      {
        path: 'brief/:newsId',
        name: 'NewsBrief',
        component: () => import('../views/NewsBriefView.vue'),
        meta: {
          requiresAuth: false,
          title: '简报详情',
          description: '从AI新闻早咖啡跳转查看摘要',
        },
      },
    ],
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

router.beforeEach((to) => {
  const user = getCurrentUser()

  if (to.name === 'Login' && user) {
    return '/'
  }

  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  return true
})

router.afterEach((to) => {
  void trackPageView(to)
})

export default router
