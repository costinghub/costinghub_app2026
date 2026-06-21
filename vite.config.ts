
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // specific mapping to ensure Google GenAI SDK works 
  // regardless of whether the user set them as VITE_XXX or just XXX in Cloudflare.
  const apiKey = env.GEMINI_API_KEY || env.API_KEY || env.VITE_GEMINI_API_KEY || env.VITE_API_KEY;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    define: {
      // Explicitly define which env vars are available on the client.
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});
