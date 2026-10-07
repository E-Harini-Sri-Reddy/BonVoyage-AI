import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Avoid opaque 502s when nodemon is mid-restart
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  message:
                    'Backend unavailable (port 5000). Wait for nodemon restart or run npm run dev from the project root.',
                })
              );
            }
            console.warn('[vite proxy]', err.message);
          });
        },
      },
    },
  },
});
