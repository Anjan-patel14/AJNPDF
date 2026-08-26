import { fetchPublicMediaPosts } from '@/lib/public-media';
import { SITE_URL } from '@/lib/seo-config';

export const dynamic = 'force-dynamic';

function xmlEscape(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] || character);
}

export async function GET() {
  const posts = await fetchPublicMediaPosts(50);
  const items = posts.map((post) => `<item><title>${xmlEscape(post.title)}</title><link>${SITE_URL}/discover/${xmlEscape(post.slug)}</link><guid isPermaLink="true">${SITE_URL}/discover/${xmlEscape(post.slug)}</guid><description>${xmlEscape(post.caption)}</description><pubDate>${new Date(post.published_at).toUTCString()}</pubDate></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>AJN Discover</title><link>${SITE_URL}/discover</link><description>Original AJN PDF and AJN Studio images and product updates.</description><language>en-IN</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } });
}
