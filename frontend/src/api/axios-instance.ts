import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: '',  // relative URLs — Vite proxy handles routing in dev, nginx in prod
})

// orval mutator signature: (config) => Promise<data>
export const customAxiosInstance = <T>(config: Parameters<typeof axiosInstance>[0]): Promise<T> => {
  return axiosInstance(config).then((res) => res.data)
}
