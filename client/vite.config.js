import { defineConfig, loadEnv } from 'vite';
// Some build environments may not automatically define process (ESM strict). Guard via globalThis.
const cwd = (globalThis.process && typeof globalThis.process.cwd === 'function')
  ? globalThis.process.cwd()
  : new URL('.', import.meta.url).pathname;
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load .env files (e.g., .env, .env.production, etc.)
  const env = loadEnv(mode, cwd, '');

  // Safe resolution with explicit priority
  const explicit = (env.VITE_API_URL || '').trim();
  const local = 'http://localhost:5000';
  const remote = 'https://devdynamics-yw9g.onrender.com';
  const target = explicit || local || remote;

  const proxyConfig = ['/auth','/expenses','/balances','/settlements','/people','/groups']
    .reduce((acc, path) => {
      acc[path] = {
        target,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn(`[Vite Proxy] Error for ${path}:`, err.message);
          });
        }
      };
      return acc;
    }, {});

  return {
    base: '/', // Ensure correct asset paths for Vercel
    plugins: [tailwindcss()],
    server: {
      proxy: proxyConfig,
    },
    define: {
      // Expose resolved target for debugging if needed (non-sensitive)
      __API_PROXY_TARGET__: JSON.stringify(target),
    }
  };
});