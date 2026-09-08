import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/sangaku/',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three'
          if (id.includes('node_modules/xlsx')) return 'xlsx'
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion-scroll'
        },
      },
    },
  },
})
