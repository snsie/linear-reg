import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works when served from https://<user>.github.io/linear-reg/
export default defineConfig({
  base: './',
  plugins: [react()],
})
