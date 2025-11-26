import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  root: '.',
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        main: 'index.html',
        preview: 'preview.html'
      }
    }
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components"
    }
  },
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`, _examples, _deps, and src-tauri/target
      ignored: ["**/src-tauri/**", "**/_examples/**", "**/_deps/**", "**/target/**"],
    },
    fs: {
      // Only allow serving files from these directories
      allow: ['src', 'public', 'node_modules', '.']
    }
  },
  optimizeDeps: {
    entries: ['index.html', 'preview.html'],
    exclude: [],
  },
}));
