import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite + React. Vitest uses the same config (jsdom is not needed for pure logic tests).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
