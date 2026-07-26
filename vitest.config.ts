import { defineConfig } from 'vitest/config';

// Config próprio para o Vitest não herdar o vite.config.ts do build
// (os testes unitários não precisam do plugin React)
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
