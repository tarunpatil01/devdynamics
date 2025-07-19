import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/expenses': 'http://localhost:5000',
      '/balances': 'http://localhost:5000',
      '/settlements': 'http://localhost:5000',
      '/people': 'http://localhost:5000',
    },
  },
});