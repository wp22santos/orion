import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
        dashboard: './dashboard.html',
        abordagem: './abordagem.html',
        busca: './busca.html'
      }
    }
  },
  server: {
    port: 3000
  }
}); 