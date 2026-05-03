import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  base: '/Team-Task-Manager/',
  server: {
    proxy: {
      '/api': {
        target : 'http://localhost:5000',
        changeOrigin : true
      }
    }
  }
})
