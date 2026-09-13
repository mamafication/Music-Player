import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The v0 preview proxy does not reliably support Vite's HMR websocket.
      // Keep it disabled by default to prevent repeated "WebSocket closed without opened" errors.
      hmr: process.env.ENABLE_HMR === 'true',
      // File watching is only needed when HMR is explicitly enabled.
      watch: process.env.ENABLE_HMR === 'true' ? {} : null,
    },
  };
});
