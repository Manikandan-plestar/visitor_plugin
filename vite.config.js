import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
  ],
  resolve: {
    alias: [
      { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, 'wp-element-shim.js') },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, 'wp-element-shim.js') },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(__dirname, 'wp-element-shim.js') },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(__dirname, 'wp-element-shim.js') },
      { find: /^react$/, replacement: path.resolve(__dirname, 'wp-element-shim.js') },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        bundle: 'client-merchant/index.jsx',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'index.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
