import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://podorukunsi.my.id',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove cookies to prevent "Origin request cookie tidak diizinkan" error from backend
            proxyReq.removeHeader('cookie');
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.setHeader('Origin', 'https://fe-podorukun-si.vercel.app');
            proxyReq.setHeader('Referer', 'https://fe-podorukun-si.vercel.app/');
          });
          proxy.on('proxyRes', (proxyRes) => {
            // Remove 'Secure' from cookies on localhost HTTP so browser does not discard them
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = (Array.isArray(setCookie) ? setCookie : [setCookie]).map((cookie) =>
                cookie
                  .replace(/;\s*secure/gi, '')
                  .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
              );
            }
          });
        },
      },
    },
  },
})
