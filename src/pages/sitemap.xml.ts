import type { APIRoute } from 'astro';
import { publishedTools } from '../data/tools';

export const GET: APIRoute = ({ site }) => {
  const paths = [
    '',
    'privacidade/',
    ...publishedTools.map((tool) => `ferramentas/${tool.slug}/`),
  ];
  const urls = paths
    .map(
      (path) =>
        `<url><loc>${new URL(`/devtools-hub/${path}`, site).href}</loc></url>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
