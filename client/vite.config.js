import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Prefer local backend if running, otherwise proxy to deployed server.
const local = 'http://localhost:5000';
const fallbackRemote = 'https://devdynamics-yw9g.onrender.com';
// Use env if provided, else local, else remote
const target = (import.meta.env.VITE_API_URL || local || fallbackRemote);

const proxyConfig = ['/auth','/expenses','/balances','/settlements','/people','/groups']
  .reduce((acc, path) => {
    acc[path] = {
      target: target,
      changeOrigin: true,
      secure: false,
      // Fallback: if local not available user can set VITE_API_URL to remote
      configure: (proxy) => {
        proxy.on('error', (err) => {
          console.warn(`[Vite Proxy] Error for ${path}:`, err.message);
        });
      }
    };
    return acc;
  }, {});

export default defineConfig({
  base: '/', // Ensure correct asset paths for Vercel
  plugins: [tailwindcss()],
  server: {
    proxy: proxyConfig,
  },
});