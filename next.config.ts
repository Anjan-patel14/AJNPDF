import type { NextConfig } from 'next';
import { configuredPdfBackendCandidates } from './src/lib/backend-service-url';

const isProduction = process.env.NODE_ENV === 'production';
const enableHsts = isProduction && process.env.AJN_ENABLE_HSTS !== 'false';
const enableHstsPreload = enableHsts && process.env.AJN_HSTS_PRELOAD === 'true';
const backendOrigins = [...new Set(configuredPdfBackendCandidates(isProduction).map((value) => new URL(value).origin))];

const connectSources = [
  "'self'",
  ...backendOrigins,
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
  'https://www.googleapis.com',
  'https://apis.google.com',
  'https://accounts.google.com',
  'https://*.firebaseapp.com',
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com',
  'https://*.google-analytics.com',
  'https://pagead2.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://*.doubleclick.net',
];

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${isProduction ? '' : "'unsafe-eval' "}https://www.gstatic.com https://apis.google.com https://accounts.google.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSources.join(' ')}`,
  "frame-src 'self' blob: https://*.firebaseapp.com https://accounts.google.com https://*.googlesyndication.com https://*.doubleclick.net",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  isProduction ? 'upgrade-insecure-requests' : '',
].filter(Boolean).join('; ');

const imageToolIds = [
  'image-reducer', 'image-resizer', 'crop-image', 'rotate-image', 'watermark-image',
  'flip-image', 'convert-image', 'meme-generator', 'photo-editor', 'upscale-image',
  'remove-bg', 'blur-face',
];

const imageToolRedirects = imageToolIds.flatMap((id) => [
  { source: `/${id}`, destination: '/img', permanent: true },
  { source: `/tools/${id}`, destination: '/img', permanent: true },
]);

// Canonical browser-native conversion routes are intentionally NOT present here.
const retiredToolAliases = [
  'azw3-to-pdf', 'bmp-to-pdf', 'csv-to-pdf', 'doc-to-pdf', 'docx-to-pdf',
  'eml-to-pdf', 'epub-to-pdf', 'excel-pdf', 'excel-to-pdf', 'gif-to-pdf',
  'jpg-pdf', 'mobi-to-pdf', 'msg-to-pdf', 'ocr-advanced', 'ocr-scanner',
  'odp-to-pdf', 'ods-to-pdf', 'odt-to-pdf', 'pdf-a', 'pdf-excel',
  'pdf-ocr', 'pdf-pages-to-zip', 'pdf-ppt', 'pdf-to-avif', 'pdf-to-azw3',
  'pdf-to-bmp', 'pdf-to-csv', 'pdf-to-docx', 'pdf-to-epub', 'pdf-to-excel',
  'pdf-to-gif', 'pdf-to-heic', 'pdf-to-html', 'pdf-to-image', 'pdf-to-jpeg',
  'pdf-to-json', 'pdf-to-markdown', 'pdf-to-mobi', 'pdf-to-odt',
  'pdf-to-powerpoint', 'pdf-to-pptx', 'pdf-to-rtf', 'pdf-to-svg', 'pdf-to-tiff',
  'pdf-to-txt', 'pdf-to-webp', 'pdf-to-word', 'pdf-to-xlsx', 'pdf-to-xml',
  'pdf-ua', 'pdf-word', 'powerpoint-to-pdf', 'ppt-pdf', 'ppt-to-pdf',
  'pptx-to-pdf', 'psd-pdf', 'rtf-to-pdf', 'scan-text', 'smart-read',
  'svg-to-pdf', 'tiff-to-pdf', 'url-to-pdf', 'word-pdf', 'word-to-pdf',
  'xls-to-pdf', 'xlsx-to-pdf', 'xps-to-pdf',
];

const retiredToolRedirects = retiredToolAliases.flatMap((source) => [
  { source: `/${source}`, destination: source === 'psd-pdf' ? '/img' : '/pdf-tools', permanent: true },
  { source: `/tools/${source}`, destination: source === 'psd-pdf' ? '/img' : '/pdf-tools', permanent: true },
]);

const canonicalAliasRedirects = [
  { source: '/heic-pdf', destination: '/heic-to-pdf', permanent: true },
  { source: '/html-pdf', destination: '/html-to-pdf', permanent: true },
  { source: '/json-pdf', destination: '/json-to-pdf', permanent: true },
  { source: '/txt-pdf', destination: '/txt-to-pdf', permanent: true },
  { source: '/xml-pdf', destination: '/xml-to-pdf', permanent: true },
  { source: '/pdf-jpg', destination: '/pdf-to-jpg', permanent: true },
  { source: '/tools/heic-pdf', destination: '/heic-to-pdf', permanent: true },
  { source: '/tools/html-pdf', destination: '/html-to-pdf', permanent: true },
  { source: '/tools/json-pdf', destination: '/json-to-pdf', permanent: true },
  { source: '/tools/txt-pdf', destination: '/txt-to-pdf', permanent: true },
  { source: '/tools/xml-pdf', destination: '/xml-to-pdf', permanent: true },
  { source: '/tools/pdf-jpg', destination: '/pdf-to-jpg', permanent: true },
  { source: '/scan-to-pdf', destination: '/scanner', permanent: true },
  { source: '/tools/scan-to-pdf', destination: '/scanner', permanent: true },
];

const publicToolIds = [
  'edit-pdf',
  'add-image-to-pdf', 'add-text', 'compare-pdf', 'compress-pdf', 'crop-pdf',
  'delete-pdf-pages', 'extract-images', 'flatten-pdf', 'image-to-pdf', 'jpeg-to-pdf',
  'jpg-to-pdf', 'merge-pdf', 'organize-pdf', 'page-number', 'pdf-metadata',
  'pdf-zip-extract', 'png-to-pdf', 'protect-pdf', 'repair-pdf', 'rotate-pdf',
  'sign-pdf', 'split-pdf', 'unlock-pdf', 'watermark-pdf', 'webp-to-pdf',
  'heic-to-pdf', 'pdf-to-jpg', 'pdf-to-png', 'txt-to-pdf', 'html-to-pdf',
  'markdown-to-pdf', 'json-to-pdf', 'xml-to-pdf',
];

const publicToolLegacyRedirects = publicToolIds.map((id) => ({
  source: `/tools/${id}`,
  destination: `/${id}`,
  permanent: true,
}));

// Consolidate near-duplicate SEO guides into one useful canonical resource per intent.
const duplicateGuideRedirects = [
  { source: '/blog/merge-pdf-on-android', destination: '/blog/how-to-merge-pdfs-online-safely', permanent: true },
  { source: '/blog/merge-pdf-on-iphone', destination: '/blog/how-to-merge-pdfs-online-safely', permanent: true },
  { source: '/blog/merge-pdf-on-chromebook', destination: '/blog/how-to-merge-pdfs-online-safely', permanent: true },
  { source: '/blog/merge-pdf-without-installing-software', destination: '/blog/how-to-merge-pdfs-online-safely', permanent: true },
  { source: '/blog/combine-pdf-pages-in-correct-order', destination: '/blog/how-to-merge-pdfs-online-safely', permanent: true },

  { source: '/blog/compress-pdf-for-email', destination: '/blog/reduce-pdf-size-keep-quality', permanent: true },
  { source: '/blog/compress-pdf-on-android', destination: '/blog/reduce-pdf-size-keep-quality', permanent: true },
  { source: '/blog/reduce-pdf-size-on-iphone', destination: '/blog/reduce-pdf-size-keep-quality', permanent: true },
  { source: '/blog/reduce-pdf-size-without-installing-software', destination: '/blog/reduce-pdf-size-keep-quality', permanent: true },
  { source: '/blog/compress-pdf-for-job-application', destination: '/blog/reduce-pdf-size-keep-quality', permanent: true },

  { source: '/blog/edit-pdf-without-installing-software', destination: '/blog/best-free-pdf-editor', permanent: true },
  { source: '/blog/edit-pdf-on-android', destination: '/blog/best-free-pdf-editor', permanent: true },
  { source: '/blog/edit-pdf-on-chromebook', destination: '/blog/best-free-pdf-editor', permanent: true },
  { source: '/blog/change-date-in-pdf-online', destination: '/blog/best-free-pdf-editor', permanent: true },
  { source: '/blog/change-name-or-number-in-pdf', destination: '/blog/best-free-pdf-editor', permanent: true },

  { source: '/blog/split-pdf-on-android', destination: '/blog/extract-pages-from-pdf', permanent: true },
  { source: '/blog/split-pdf-for-email', destination: '/blog/extract-pages-from-pdf', permanent: true },
  { source: '/blog/separate-pdf-pages-without-software', destination: '/blog/extract-pages-from-pdf', permanent: true },
  { source: '/blog/split-large-pdf-into-smaller-files', destination: '/blog/extract-pages-from-pdf', permanent: true },
];

const nextConfig: NextConfig = {
  distDir: process.env.AJN_NEXT_DIST_DIR || (isProduction ? '.next' : '.next-dev'),
  poweredByHeader: false,
  compress: true,
  outputFileTracingRoot: process.cwd(),
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  turbopack: { resolveAlias: { canvas: './src/lib/mocks/empty.js' } },

  async redirects() {
    return [
      ...duplicateGuideRedirects,
      ...imageToolRedirects,
      ...canonicalAliasRedirects,
      ...retiredToolRedirects,
      ...publicToolLegacyRedirects,
      { source: '/login', destination: '/pdf-tools', permanent: true },
      { source: '/signup', destination: '/pdf-tools', permanent: true },
      { source: '/forgot-password', destination: '/pdf-tools', permanent: true },
      { source: '/account/:path*', destination: '/pdf-tools', permanent: true },
      { source: '/pricing', destination: '/pdf-tools', permanent: true },
      { source: '/workspace/:path*', destination: '/pdf-tools', permanent: true },
      { source: '/ajn-studio/:path*', destination: '/pdf-tools', permanent: true },
      { source: '/image-tools', destination: '/img', permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'ajnpdf.com' }], destination: 'https://www.ajnpdf.com/:path*', permanent: true },
      { source: '/guides', destination: '/blog', permanent: true },
      { source: '/ajn', destination: '/pdf-tools', permanent: true },
      { source: '/story', destination: '/about', permanent: true },
      { source: '/services', destination: '/pdf-tools', permanent: true },
      { source: '/compare', destination: '/compare-pdf', permanent: true },
      { source: '/dashboard', destination: '/pdf-tools', permanent: true },
      { source: '/promo', destination: '/', permanent: true },
      { source: '/whatsapp', destination: '/contact', permanent: true },
      { source: '/help/terms', destination: '/terms', permanent: true },
      { source: '/junction', destination: '/pdf-tools', permanent: true },
      { source: '/junction/:path*', destination: '/pdf-tools', permanent: true },
      { source: '/view/:path*', destination: '/pdf-tools', permanent: true },
      { source: '/tools', destination: '/pdf-tools', permanent: true },
      { source: '/tools/:id', destination: '/pdf-tools', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/status',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      },
      {
        source: '/changelog',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      },
      {
        source: '/discover/guides',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      },
      {
        source: '/scanner',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          ...(enableHsts ? [{ key: 'Strict-Transport-Security', value: `max-age=63072000; includeSubDomains${enableHstsPreload ? '; preload' : ''}` }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
