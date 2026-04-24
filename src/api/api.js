import axios from 'axios';

const api = axios.create({
  // Priorizamos la URL inyectada por Electron para permitir terminales en red
  baseURL: window.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor para incluir el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globales (ej: sesiones expiradas)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el servidor responde con 401 (No autorizado) o 403 (Token inválido/expirado)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Sesión expirada o no autorizada. Redirigiendo al login...');
      localStorage.removeItem('token');
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
