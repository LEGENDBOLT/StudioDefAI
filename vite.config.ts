import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Modifica questa riga con il nome della tua repository!
  base: '/StudioDefAI/', 
})