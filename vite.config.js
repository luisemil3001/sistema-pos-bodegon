import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // Cargamos las variables de entorno (.env)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // CLAVE: Si estamos en modo 'build' (producción), usamos './' para que 
    // Electron encuentre los archivos. Si es 'dev', mantenemos '/'
    base: command === 'build' ? './' : '/',

    plugins: [react()],
    server: {
      host: true, // Permite que el sistema sea visto en la red local del cliente
      port: 5773, // Puerto de desarrollo
      proxy: {
        // Redirige automáticamente todas las llamadas de /api al Backend
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist', // Carpeta que Docker usará para producción
      // Asegura que los assets se generen con rutas relativas
      assetsDir: 'assets',
    }
  }
})