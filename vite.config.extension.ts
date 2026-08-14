import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  publicDir: false,
  define: {
    'process.env.MAILREPLY_API_BASE': JSON.stringify(process.env.MAILREPLY_API_BASE || 'http://localhost:3000')
  },
  build: {
    outDir: 'extension/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'extension/src/background.ts'),
        content: resolve(__dirname, 'extension/src/content.ts'),
        popup: resolve(__dirname, 'extension/src/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
