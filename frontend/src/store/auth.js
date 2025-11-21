// src/store/auth.js

export const authStore = {
  getToken: () => localStorage.getItem('jwt_token'),

  setToken: (token) => {
    localStorage.setItem('jwt_token', token)
  },

  clearToken: () => {
    localStorage.removeItem('jwt_token')
  },

  isAuthenticated: () => !!localStorage.getItem('jwt_token'),
}
