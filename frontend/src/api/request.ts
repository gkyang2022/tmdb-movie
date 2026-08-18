import axios, { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const store = useUserStore();
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string; code?: string }>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      const store = useUserStore();
      store.logout();
      if (router.currentRoute.value.path !== '/login') {
        ElMessage.warning('登录已过期，请重新登录');
        router.push('/login');
      }
    } else if (data?.code === 'TMDB_NOT_CONFIGURED') {
      ElMessage.error('未配置 TMDB API Key，请先到「设置」页填写');
      router.push('/settings');
    } else if (data?.code === 'TMDB_KEY_INVALID') {
      ElMessage.error('TMDB API Key 无效，请到「设置」页更新');
      router.push('/settings');
    } else if (data?.code === 'TMDB_RATE_LIMITED') {
      ElMessage.warning('TMDB API 限流中，请稍后重试');
    } else if (data?.error) {
      ElMessage.error(data.error);
    } else {
      ElMessage.error(`请求失败（${status || '网络错误'}）`);
    }
    return Promise.reject(error);
  }
);

export default request;
