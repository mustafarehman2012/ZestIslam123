import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_MAIN_KEY': JSON.stringify(env.GEMINI_MAIN_KEY),
        'process.env.GEMINI_KNOWLEDGE_KEY': JSON.stringify(env.GEMINI_KNOWLEDGE_KEY),
        'process.env.GEMINI_ASSISTANT_KEY': JSON.stringify(env.GEMINI_ASSISTANT_KEY),
        'process.env.GEMINI_SPIRITUAL_KEY': JSON.stringify(env.GEMINI_SPIRITUAL_KEY),
        'process.env.GEMINI_TOOLS_KEY': JSON.stringify(env.GEMINI_TOOLS_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
