// src/axiosBase.js
import axios from 'axios'

const base = axios.create({
   baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

export default base
