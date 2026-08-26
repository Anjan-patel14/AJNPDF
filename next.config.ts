import type { NextConfig } from 'next';
import { configuredPdfBackendCandidates } from './src/lib/backend-service-url';

const isProduction = process.env.NODE_ENV === 'production';
const enableHsts = isProduction && process.env.AJN_ENABLE_HSTS !== 'false';
const enableHstsPreload = enableHsts && process.env.AJN_HSTS_PRELOAD === 'true';
const backendOrigins = [...new Set(configuredPdfBackendCandidates(isProduction).map((value) => new URL(value).origin))];

const connectSources = [
  "'self'", ...backendOrigins,
  'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', 'https://www.googleapis.com', 'https://apis.google.com', 'https://accounts.google.com', 'https://*.firebaseapp.com',
  'https://api.razorpay.com', 'https://*.razorpay.com',
  'https://www.google-analytics.com', 'https://region1.google-analytics.com', 'https://*.google-analytics.com',
  'https://pagead2.googlesyndication.com', 'https://*.googlesyndication.com', 'https://*.doubleclick.net'];
const contentSecurityPolicy = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'self'", "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://accounts.google.com https://checkout.razorpay.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com",
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:", "font-src 'self' data:",
  `connect-src ${connectSources.join(' ')}`, "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://api.razorpay.com https://*.razorpay.com https://*.googlesyndication.com https://*.doubleclick.net",
  "worker-src 'self' blob:", "media-src 'self' blob:", isProduction ? 'upgrade-insecure-requests' : ''].filter(Boolean).join('; ');

const imageToolIds = ['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image'];
const imageToolRedirects = imageToolIds.flatMap((id) => [
  { source: `/${id}`, destination: '/img', permanent: true },
  { source: `/tools/${id}`, destination: '/img', permanent: true },
]);

const retiredToolAliases = [
  'word-pdf','pdf-word','excel-pdf','pdf-excel','ppt-pdf','jpg-pdf','pdf-jpg','heic-pdf','html-pdf','xml-pdf','json-pdf','txt-pdf',
  'smart-read','pdf-ppt','psd-pdf',
];
const retiredToolRedirects = retiredToolAliases.flatMap((source) => [
  { source: `/${source}`, destination: source === 'psd-pdf' ? '/img' : '/pdf-tools', permanent: true },
  { source: `/tools/${source}`, destination: source === 'psd-pdf' ? '/img' : '/pdf-tools', permanent: true },
]);

const nextConfig: NextConfig = {
  poweredByHeader: false, compress: true, outputFileTracingRoot: process.cwd(), output: 'standalone',
  webpack: (config) => { config.resolve.alias.canvas = false; return config; },
  turbopack: { resolveAlias: { canvas: './src/lib/mocks/empty.js' } },
  async redirects() {
    return [
      ...imageToolRedirects,
      ...retiredToolRedirects,
      { source: '/image-tools', destination: '/img', permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'ajnpdf.com' }], destination: 'https://www.ajnpdf.com/:path*', permanent: true },
      { source: '/guides', destination: '/blog', permanent: true }, { source: '/ajn', destination: '/ajn-studio', permanent: true },
      { source: '/story', destination: '/about', permanent: true }, { source: '/services', destination: '/pdf-tools', permanent: true },
      { source: '/compare', destination: '/compare-pdf', permanent: true }, { source: '/dashboard', destination: '/account', permanent: true },
      { source: '/promo', destination: '/', permanent: true }, { source: '/whatsapp', destination: '/contact', permanent: true },
      { source: '/help/terms', destination: '/terms', permanent: true },
      { source: '/junction', destination: '/pdf-tools', permanent: true }, { source: '/junction/:path*', destination: '/pdf-tools', permanent: true },
      { source: '/view/:path*', destination: '/pdf-tools', permanent: true }, { source: '/tools', destination: '/pdf-tools', permanent: true },
      { source: '/tools/:id', destination: '/:id', permanent: true }];
  },
  async headers() {
    return [
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/account/:path*', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/login', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] },
      { source: '/signup', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] },
      { source: '/forgot-password', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] },
      { source: '/(.*)', headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy }, { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(self), usb=()' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }, { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ...(enableHsts ? [{ key: 'Strict-Transport-Security', value: `max-age=63072000; includeSubDomains${enableHstsPreload ? '; preload' : ''}` }] : [])] }];
  },
};
export default nextConfig;
