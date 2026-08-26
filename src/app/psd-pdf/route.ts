export const dynamic = 'force-static';

export function GET() {
  return new Response('PSD to PDF is not part of the current validated AJN PDF production tool catalogue.', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
