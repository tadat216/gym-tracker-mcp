import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
})

// Attach JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_tracker_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to /login on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gym_tracker_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const customAxiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source()
  const promise = axiosInstance({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-expect-error orval cancel token pattern
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

export default axiosInstance
