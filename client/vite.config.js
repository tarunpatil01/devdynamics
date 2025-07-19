import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  base: '/', // Ensure correct asset paths for Vercel
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/auth': 'https://devdynamics-yw9g.onrender.com',
      '/expenses': 'https://devdynamics-yw9g.onrender.com',
      '/balances': 'https://devdynamics-yw9g.onrender.com',
      '/settlements': 'https://devdynamics-yw9g.onrender.com',
      '/people': 'https://devdynamics-yw9g.onrender.com',
      '/groups': 'https://devdynamics-yw9g.onrender.com',
    },
  },
});