import axios from 'axios'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import i18n from '@/i18n'  


const axiosUser = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// ✅ 요청 인터셉터
axiosUser.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ✅ 응답 인터셉터
axiosUser.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // 🔹 SweetAlert2로 대체
      const t = i18n.global.t  

      await Swal.fire({
        title: t('alert.sessionExpiredTitle'),
        text: t('alert.sessionExpiredText'),
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0052cc',
        background: '#f9fbff',
        color: '#222',
        iconColor: '#0052cc',
        customClass: {
          popup: 'rounded-3xl shadow-lg',
          title: 'font-semibold text-lg',
          confirmButton: 'px-6 py-2 rounded-lg'
        }
      })

      localStorage.removeItem('user_token')
      localStorage.removeItem('role')
      window.location.href = '/login'
    }

    return Promise.reject(err)
  }
)

export default axiosUser
