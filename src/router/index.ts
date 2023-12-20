import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
    path: '/',
    redirect: '/home',
  }, {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: 'Life Recorder'
    }
  }
    // {
    //   path: '/',
    //   component: Example,
    //   children: [
    //     {
    //       path: '',
    //       redirect: '/home',
    //     },
    //     {
    //       path: 'home',
    //       component: () => import('@/views/Test.vue'),
    //     },
    //     {
    //       path: 'radio',
    //       component: () => import('@/views/Test.vue'),
    //     },
    //     {
    //       path: 'library',
    //       component: () => import('@/views/Test.vue'),
    //     },
    //     {
    //       path: 'search',
    //       component: () => import('@/views/Test.vue'),
    //     },
    //   ],
    // }
  ]
})

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}

router.afterEach(to => {
  document.title = to.meta.title
})

export default router
