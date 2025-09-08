import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vite uses import.meta.env, but some libraries might expect process.env.
    // This makes it available, but variables MUST be prefixed with VITE_
    'process.env': {}
  }
})
