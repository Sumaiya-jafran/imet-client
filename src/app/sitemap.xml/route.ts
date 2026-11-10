import { sitemapFeed } from '@/lib/sitemap-feed';
import { siteUrl, xmlEscape } from '@/lib/site-url';
export const dynamic = 'force-dynamic';
export async function GET() {
  const feed = await sitemapFeed(1);
  const urls = [
    siteUrl('/pages-sitemap.xml'),
    ...Array.from({ length: feed.totalPages }, (_, i) =>
      siteUrl(`/machinery-sitemap/${i + 1}.xml`),
    ),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<sitemap><loc>${xmlEscape(url)}</loc></sitemap>`).join('')}</sitemapindex>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-store',
      },
    },
  );
}
