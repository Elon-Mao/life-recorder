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
    redirect: '/home/record',
    component: () => import('@/views/Home.vue'),
    children: [{
      path: 'record',
      name: 'Record',
      component: () => import('@/views/Record.vue'),
      meta: {
        title: 'Record'
      }
    }, {
      path: 'label',
      name: 'Label',
      component: () => import('@/views/Label.vue'),
      meta: {
        title: 'Label'
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

router.beforeEach((to) => {
  if (to.name !== 'Portal') {
    const userStore = useUserStore()
    if (!userStore.user) {
      return {
        name: 'Portal'
      }
    }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title
})

export default router
