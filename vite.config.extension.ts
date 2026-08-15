import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The backend origin the extension talks to. Injected at build time.
// build-extension-zip.mjs sets MAILREPLY_API_BASE to the production URL;
// a plain build falls back to localhost for dev.
const API_BASE = process.env.MAILREPLY_API_BASE || 'http://localhost:3000';

// Content scripts, MV3 (classic) service workers, and the popup <script> are all
// CLASSIC scripts — they cannot use ESM `import`. So each entry is built on its
// own as a self-contained IIFE (inlineDynamicImports) with NO shared chunks.
// EXT_ENTRY selects which entry to build; build-extension-zip.mjs builds all three.
const ENTRIES: Record<string, string> = {
  background: resolve(__dirname, 'extension/src/background.ts'),
  content: resolve(__dirname, 'extension/src/content.ts'),
  popup: resolve(__dirname, 'extension/src/popup.ts'),
};

const ENTRY = process.env.EXT_ENTRY && ENTRIES[process.env.EXT_ENTRY] ? process.env.EXT_ENTRY : 'content';

export default defineConfig({
  define: {
    __MAILREPLY_API_BASE__: JSON.stringify(API_BASE),
  },
  // Do not copy the web app's public/ assets into the extension bundle.
  publicDir: false,
  build: {
    outDir: 'extension/dist',
    // We invoke Vite once per entry, so entries must not wipe each other.
    emptyOutDir: false,
    rollupOptions: {
      input: { [ENTRY]: ENTRIES[ENTRY] },
      output: {
        format: 'iife',
        entryFileNames: '[name].js',
        inlineDynamicImports: true,
      },
    },
  },
});
