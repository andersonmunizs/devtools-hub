import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  markdown: { syntaxHighlight: false },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'none'",
        "img-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
});
