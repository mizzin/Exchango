// project-il/frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';

export default defineConfig(({ mode }) => {
  // 1) mode 에 맞는 .env 파일 로드
  const env = loadEnv(mode, process.cwd());

  return {
    base: '/',            // 라우터 베이스
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      // 2) 빌드 타임에 환경변수 치환
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    // 3) 개발 서버 전용 프록시
    ...(mode === 'development' && {
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
      },
    }),
    css: {
      preprocessorOptions: {
        css: { charset: false },
      },
    },
    assetsInclude: ['**/*.css', '**/*.woff2', '**/*.woff'],
  };
});
