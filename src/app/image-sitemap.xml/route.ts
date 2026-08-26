import { fetchPublicMediaPosts } from '@/lib/public-media';
import { SITE_URL } from '@/lib/seo-config';

export const dynamic = 'force-dynamic';

function xmlEscape(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] || character);
}

export async function GET() {
  const posts = await fetchPublicMediaPosts(100);
  const entries = posts.map((post) => {
    const image = post.image_url.startsWith('http') ? post.image_url : `${SITE_URL}${post.image_url}`;
    return `<url><loc>${SITE_URL}/discover/${xmlEscape(post.slug)}</loc><image:image><image:loc>${xmlEscape(image)}</image:loc></image:image></url>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } });
}
