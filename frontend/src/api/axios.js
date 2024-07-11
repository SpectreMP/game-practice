import axios from 'axios';
import { getAccessToken } from '../utils/auth';
import useRefreshToken from '../hooks/useRefreshToken';
import config from './config';

const axiosInstance = axios.create({
  baseURL: `${config.apiUrl}/api`,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useRefreshToken();
      const newAccessToken = await refreshToken();
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;