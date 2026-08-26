import type { Metadata } from 'next';
import type { ServiceTool } from './tools-data';
import { isToolPublic } from './tool-policy';
import { getToolSeoProfile } from './seo-strategy';
import { toolPath } from './tool-routes';

export const SITE_URL = 'https://www.ajnpdf.com';
export const SITE_NAME = 'AJN PDF';
export const ADSENSE_CLIENT = 'ca-pub-4495802176396975';

export const SEO_EXCLUDED_TOOL_IDS = new Set([
  'pdf-ppt',
  'pdf-a',
  'pdf-ua',
  'smart-read',
  'psd-pdf',
  'upscale-image',
  'remove-bg',
  'blur-face']);

export const TOOL_CANONICAL_OVERRIDES: Record<string, string> = {
  'smart-read': '/pdf-text',
};

export function buildToolMetadata(tool: ServiceTool): Metadata {
  const pathname = toolPath(tool.id);
  const canonicalPath = TOOL_CANONICAL_OVERRIDES[tool.id] || pathname;
  const seo = getToolSeoProfile(tool);
  const description = seo.description;
  const shouldIndex = isToolPublic(tool.id) && !SEO_EXCLUDED_TOOL_IDS.has(tool.id);

  return {
    title: { absolute: seo.title },
    description,
    alternates: { canonical: canonicalPath },
    keywords: [seo.primaryKeyword, ...seo.secondaryKeywords, ...seo.questionKeywords, 'AJN PDF'],
    category: seo.categoryLabel,
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: canonicalPath,
      siteName: SITE_NAME,
      title: seo.title,
      description,
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${tool.name} online tool by AJN PDF` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description,
      images: ['/og-image.jpg'],
    },
  };
}
