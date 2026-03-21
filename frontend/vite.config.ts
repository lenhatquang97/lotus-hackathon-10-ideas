import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@met4citizen/talkinghead',
      '@met4citizen/talkinghead/modules/lipsync-en.mjs',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      // llm-room conversational AI service (world WebSocket + TTS)
      '/ws/room': { target: 'ws://localhost:8001', ws: true },
      '/api/tts': { target: 'http://localhost:8001' },
      '/api/stt': { target: 'http://localhost:8001' },
      // Main backend API
      '/api': {
        target: 'http://localhost:8000',
        ws: true,
      },
      '/ws': { target: 'ws://localhost:8000', ws: true },
    }
  }
})
