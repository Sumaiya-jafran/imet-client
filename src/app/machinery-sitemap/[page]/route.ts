import { sitemapFeed } from '@/lib/sitemap-feed';
import { siteUrl, xmlEscape } from '@/lib/site-url';
export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  const { page } = await params;
  if (!/^[1-9]\d{0,4}\.xml$/.test(page))
    return new Response('Not found', { status: 404 });
  const number = Number(page.slice(0, -4)),
    feed = await sitemapFeed(number);
  if (number > feed.totalPages)
    return new Response('Not found', { status: 404 });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${feed.machines.map((m) => `<url><loc>${xmlEscape(siteUrl(`/machinery/${m.slug}`))}</loc><lastmod>${new Date(m.updatedAt).toISOString()}</lastmod></url>`).join('')}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-store',
      },
    },
  );
}
