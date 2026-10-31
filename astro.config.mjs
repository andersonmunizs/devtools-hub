import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://andersonmunizs.github.io',
  base: '/devtools-hub',
  trailingSlash: 'always',
  output: 'static',
  markdown: { syntaxHighlight: false },
  integrations: [react()],
  vite: { plugins: [tailwindcss()], worker: { format: 'es' } },
  devToolbar: { enabled: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'none'",
        "worker-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
});
