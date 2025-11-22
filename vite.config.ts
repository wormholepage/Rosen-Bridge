import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 这里很重要：必须是 /仓库名/
  base: '/Rosen-Bridge/',
});
