import { siteUrl, xmlEscape } from '@/lib/site-url';
export function GET() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/machinery', '/suppliers', '/plans'].map((path) => `<url><loc>${xmlEscape(siteUrl(path))}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
