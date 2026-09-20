import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/tomeggs-v2/', // <--- Altere de 'tomeggs-app' para 'tomeggs-v2'
  plugins: [react()],
})