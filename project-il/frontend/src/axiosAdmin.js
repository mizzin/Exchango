// src/axios/axiosUser.js
import axiosBase from './axiosBase'

axiosBase.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

export default axiosBase
