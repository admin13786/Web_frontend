import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/channel',
    name: 'Channel',
    component: () => import('../views/ChannelView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/workshop',
    name: 'Workshop',
    component: () => import('../views/WorkshopView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/news/:newsId',
    name: 'NewsDetail',
    component: () => import('../views/NewsDetailView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简单认证守卫 - 演示用
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  if (to.meta.requiresAuth && !isLoggedIn && to.path !== '/') {
    next('/')
  } else if (to.path === '/' && isLoggedIn) {
    next('/home')
  } else {
    next()
  }
})

export default router
