import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/To-do-List-WAOK/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
