import axios from 'axios'

/** 共用 axios 实例，开发环境经 Vite 代理访问后端 */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})
