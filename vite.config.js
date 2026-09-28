import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'iceberg-js': path.resolve(__dirname, './node_modules/iceberg-js/dist/index.cjs'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'face-api': ['@vladmandic/face-api'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
