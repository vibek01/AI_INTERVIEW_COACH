import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Listen on all interfaces
    port: 5173,
    strictPort: true,
  },
  base: './',  // Relative base path for assets
});
