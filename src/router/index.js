import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    redirect: '/',
  },
  {
    path: '/channel',
    name: 'Channel',
    component: () => import('../views/ChannelView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/workshop',
    name: 'Workshop',
    component: () => import('../views/WorkshopView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/news/:newsId',
    name: 'NewsDetail',
    component: () => import('../views/NewsDetailView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/brief/:newsId',
    name: 'NewsBrief',
    component: () => import('../views/NewsBriefView.vue'),
    meta: { requiresAuth: false }
  },
  // 如需恢复登录页面，取消下面注释
  // {
  //   path: '/login',
  //   name: 'Login',
  //   component: () => import('../views/LoginView.vue'),
  //   meta: { requiresAuth: false }
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 登录验证已关闭 - 所有页面无需登录即可访问
// 如需恢复登录验证，取消下面注释：
/*
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  if (to.meta.requiresAuth && !isLoggedIn && to.path !== '/') {
    next('/')
  } else if (to.path === '/' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})
*/

export default router
