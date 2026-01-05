import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Auto-detect base path for GitHub Pages
  // Priority: VITE_BASE_URL > GITHUB_REPOSITORY > default '/'
  let base = env.VITE_BASE_URL;

  if (!base && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    // If repo is username.github.io, use root. Otherwise use /repo-name/
    if (repoName && !repoName.includes('.github.io')) {
      base = `/${repoName}/`;
    } else {
      base = '/';
    }
  }

  // Default to root if nothing set
  if (!base) base = '/';
  if (!base.endsWith('/')) base += '/';

  if (process.env.NODE_ENV !== 'test') {
    console.log('🔧 Vite config:');
    console.log('   Base path:', base);
    console.log('   Mode:', mode);
    console.log('   Repository:', process.env.GITHUB_REPOSITORY || 'not set');
  }

  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      modulePreload: {
        polyfill: true,
      },
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          manualChunks: undefined,
          entryFileNames: 'assets/index.[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          format: 'es',
        },
      },
      assetsInlineLimit: 0,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
