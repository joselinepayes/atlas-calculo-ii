/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base relativa: el sitio funciona en https://USUARIO.github.io/atlas-calculo-ii/ y en cualquier subruta.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 4500, target: 'es2022' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
