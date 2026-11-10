import { apiClient } from '@/lib/api/client';
export async function sitemapFeed(page: number) {
  const r = await apiClient.get<{
    machines: { slug: string; updatedAt: string }[];
    totalPages: number;
  }>(`/catalogue/sitemap?page=${page}`, { signal: AbortSignal.timeout(10000) });
  if (!r.data) throw new Error('Sitemap unavailable');
  return r.data;
}
