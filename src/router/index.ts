import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
    path: '/',
    redirect: '/home',
  }, {
    path: '/portal',
    name: 'Portal',
    component: () => import('@/views/Portal.vue'),
    meta: {
      title: 'Life Recorder'
    }
  }, {
    path: '/home',
    name: 'Home',
    redirect: '/home/today',
    component: () => import('@/views/Home.vue'),
    children: [{
      path: 'today',
      name: 'Today',
      component: () => import('@/views/Today.vue'),
      meta: {
        title: 'Today'
      }
    }, {
      path: 'event',
      name: 'Event',
      component: () => import('@/views/Event.vue'),
      meta: {
        title: 'Event'
      }
    }, {
      path: 'analysis',
      name: 'Analysis',
      component: () => import('@/views/Analysis.vue'),
      meta: {
        title: 'Analysis'
      }
    }]
  }]
})

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}

router.beforeEach(to => {
  if (to.name !== 'Portal') {
    const userStore = useUserStore()
    if (!userStore.user) {
      return {
        name: 'Portal'
      }
    }
  }
})

router.afterEach(to => {
  document.title = to.meta.title
})

export default router
