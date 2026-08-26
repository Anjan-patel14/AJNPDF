import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { ToolWorkspaceClient } from '@/components/junction/tool-workspace-client';
import { ALL_TOOLS, getPublicToolCategory } from '@/lib/tools-data';
import { isToolPublic } from '@/lib/tool-policy';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { buildToolMetadata, SITE_NAME, SITE_URL } from '@/lib/seo-config';
import { AJN_BRAND } from '@/lib/brand';
import { ToolEditorialContent } from '@/components/junction/tool-editorial-content';
import { AdSenseUnit } from '@/components/adsense-unit';
import { ADSENSE_SLOTS } from '@/lib/ad-slots';
import { MainFooter } from '@/components/landing/main-footer';
import { getToolSeoProfile } from '@/lib/seo-strategy';
import { Navbar } from '@/components/landing/navbar';
import { toolPath } from '@/lib/tool-routes';

export const dynamicParams = false;

type ToolPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return BUILD_PUBLIC_TOOLS.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { id } = await params;
  const tool = ALL_TOOLS.find((item) => item.id === id);
  if (!tool || !isToolPublic(id)) return { title: 'Tool Not Found', robots: { index: false, follow: false } };
  return buildToolMetadata(tool);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { id } = await params;
  const tool = BUILD_PUBLIC_TOOLS.find((item) => item.id === id);
  if (!tool) notFound();

  const category = getPublicToolCategory(tool);
  const categoryPath = category === 'image' ? '/image-tools' : '/pdf-utilities';
  const categoryLabel = category === 'image' ? 'Image Tools' : 'PDF Tools';
  const seo = getToolSeoProfile(tool);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.name,
        description: seo.description,
        url: `${SITE_URL}${toolPath(tool.id)}`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [...tool.benefits, ...tool.useCases],
        author: { '@id': `${SITE_URL}/developer#anjan` },
        publisher: { '@id': `${SITE_URL}/ajn-studio#organization` },
        brand: { '@type': 'Brand', name: AJN_BRAND.productName, url: SITE_URL },
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: categoryLabel, item: `${SITE_URL}${categoryPath}` },
          { '@type': 'ListItem', position: 3, name: tool.name, item: `${SITE_URL}${toolPath(tool.id)}` },
        ],
      },
    ],
  };

  return (
    <>
      <Navbar />
      <Script
        id={`tool-schema-${tool.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolWorkspaceClient id={id} />
      <ToolEditorialContent tool={tool} />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-12">
        <div className="border-t border-black/5 pt-10">
          <AdSenseUnit slot={ADSENSE_SLOTS.toolContent} width={200} height={300} className="min-h-[300px]" />
        </div>
      </div>
      <MainFooter />
    </>
  );
}
