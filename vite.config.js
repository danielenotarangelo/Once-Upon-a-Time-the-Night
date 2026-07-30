import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  base: "/Once-Upon-a-Time-the-Night/",
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
});
