import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('@/views/MainLayout.vue'),
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', name: 'home', component: () => import('@/views/Home.vue') },
        { path: 'rank', name: 'rank', component: () => import('@/views/Rank.vue') },
        { path: 'search', name: 'search', component: () => import('@/views/Search.vue') },
        { path: 'detail/:type/:id', name: 'detail', component: () => import('@/views/Detail.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/Settings.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
});

router.beforeEach((to) => {
  const store = useUserStore();
  if (!to.meta.public && !store.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
