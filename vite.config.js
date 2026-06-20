import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/kategoribilder-galleri/',
  // Fast port (Hermodex portregister: Cykelhuset/cykelvardag.se = 8002).
  // strictPort → faila hellre än att glida till en annan port och krocka.
  server: { port: 8002, strictPort: true },
  preview: { port: 8002, strictPort: true },
})
