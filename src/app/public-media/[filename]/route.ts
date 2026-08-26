import { PDF_BACKEND_URL } from '@/lib/pdf-backend';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ filename: string }> };

export async function GET(_: Request, { params }: Props) {
  const { filename } = await params;
  if (!PDF_BACKEND_URL || !/^[a-z0-9][a-z0-9._-]{1,180}\.webp$/i.test(filename)) {
    return new Response('Image not found', { status: 404 });
  }
  const response = await fetch(`${PDF_BACKEND_URL}/media/${encodeURIComponent(filename)}`, { cache: 'no-store' });
  if (!response.ok || !response.body) return new Response('Image not found', { status: 404 });
  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') || 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
