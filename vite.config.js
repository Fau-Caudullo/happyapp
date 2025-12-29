import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Alza il limite dell'avviso a 1000kb
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Separa le librerie esterne (come Supabase o React) in file diversi
        // per velocizzare il caricamento iniziale
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
})
