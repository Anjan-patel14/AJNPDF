import { PDF_BACKEND_URL } from './pdf-backend';
import { AJN_BRAND } from './brand';

export type PublicMediaPost = {
  id: number | string;
  slug: string;
  title: string;
  caption: string;
  alt_text: string;
  tags: string[];
  image_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  published: boolean;
  scheduled_at?: string | null;
  updated_at?: string;
  published_at: string;
  source: 'static' | 'admin';
};

export const FEATURED_MEDIA_POST: PublicMediaPost = {
  id: 'anjan-developer',
  slug: 'anjan-developer-of-ajn-pdf',
  title: 'Anjan — Developer of AJN PDF',
  caption:
    'Meet Anjan, the developer building AJN PDF and AJN Studio with a focus on practical PDF, image and document tools.',
  alt_text: 'Portrait of Anjan, developer of AJN PDF, wearing a black hoodie against a light background',
  tags: ['AJN', 'AJN PDF', 'AJN Studio', 'developer', 'India'],
  image_url: AJN_BRAND.developerImage,
  thumbnail_url: AJN_BRAND.developerImageThumb,
  width: 1200,
  height: 1200,
  published: true,
  published_at: '2026-08-06T00:00:00Z',
  source: 'static',
};

export function absoluteMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/media/')) return `/public-media/${url.split('/').pop()}`;
  return url;
}

export async function fetchPublicMediaPosts(limit = 24): Promise<PublicMediaPost[]> {
  if (!PDF_BACKEND_URL) return [FEATURED_MEDIA_POST];
  try {
    const response = await fetch(`${PDF_BACKEND_URL}/api/public/posts?limit=${Math.min(Math.max(limit, 1), 100)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return [FEATURED_MEDIA_POST];
    const payload = await response.json();
    const posts = Array.isArray(payload?.posts) ? payload.posts : [];
    const normalized = posts.map((post: PublicMediaPost) => ({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : [],
      image_url: absoluteMediaUrl(post.image_url),
      thumbnail_url: post.thumbnail_url ? absoluteMediaUrl(post.thumbnail_url) : undefined,
      source: 'admin' as const,
    }));
    return [FEATURED_MEDIA_POST, ...normalized.filter((post: PublicMediaPost) => post.slug !== FEATURED_MEDIA_POST.slug)];
  } catch {
    return [FEATURED_MEDIA_POST];
  }
}

export async function fetchPublicMediaPost(slug: string): Promise<PublicMediaPost | null> {
  if (slug === FEATURED_MEDIA_POST.slug) return FEATURED_MEDIA_POST;
  if (!PDF_BACKEND_URL) return null;
  try {
    const response = await fetch(`${PDF_BACKEND_URL}/api/public/posts/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const post = await response.json();
    return {
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : [],
      image_url: absoluteMediaUrl(post.image_url),
      thumbnail_url: post.thumbnail_url ? absoluteMediaUrl(post.thumbnail_url) : undefined,
      source: 'admin',
    };
  } catch {
    return null;
  }
}
