import { defineStore } from 'pinia';

const TOKEN_KEY = 'tmdb_movie_token';
const USER_KEY = 'tmdb_movie_user';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    username: localStorage.getItem(USER_KEY) || '',
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    setLogin(token: string, username: string) {
      this.token = token;
      this.username = username;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, username);
    },
    logout() {
      this.token = '';
      this.username = '';
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});
