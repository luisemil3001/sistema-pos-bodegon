import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Cambiar por la IP del servidor si se usa en red
});

// Interceptor para incluir el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
