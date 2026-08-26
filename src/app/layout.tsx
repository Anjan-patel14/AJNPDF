import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import { Toaster } from "../components/ui/toaster";
import { LanguageProvider } from "../lib/i18n/language-context";
import { LiveTranslationBridge } from "../components/i18n/live-translation-bridge";
import { CookieConsent } from "../components/ui/cookie-consent";
import { AdSenseScriptLoader } from "../components/adsense-script-loader";
import { SITE_NAME, SITE_URL } from "../lib/seo-config";
import { ADSENSE_PUBLISHER } from "../lib/ad-slots";
import { GoogleAnalytics } from "../components/analytics/google-analytics";
import { SiteAnalytics } from "../components/analytics/site-analytics";
import { ThemeProvider } from "../components/theme/theme-provider";
import { ProcessingActivityProvider } from "../components/ajnpdf/processing-activity-provider";
import { MobileBottomNav } from "../components/landing/mobile-bottom-nav";
import { AJN_BRAND, AJN_CONFIRMED_SOCIAL_LINKS, AJN_PRODUCT_ALTERNATE_NAMES, AJN_STUDIO_ALTERNATE_NAMES } from "../lib/brand";
import { AuthProvider } from "../lib/auth-context";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-syne", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

const HOME_TITLE = "Free Online PDF Tools - Merge, Compress, Edit & Sign | AJN PDF";
const HOME_DESCRIPTION = "Free online PDF tools to merge, split, compress, organize, edit, sign, protect, unlock and repair PDF files.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: HOME_TITLE, template: "%s | AJN PDF" },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/", types: { "application/rss+xml": `${SITE_URL}/feed.xml` } },
  authors: [{ name: AJN_BRAND.developerName, url: `${SITE_URL}/developer` }],
  creator: AJN_BRAND.developerName,
  publisher: AJN_BRAND.studioName,
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/favicon.ico", rel: "shortcut icon" }], apple: [{ url: "/favicon.ico" }] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "AJN PDF free online PDF tools" }],
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION, images: ["/og-image.jpg"] },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
  other: { "google-adsense-account": ADSENSE_PUBLISHER, "ajn-release": "3.2.0-r21" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE_URL}/ajn-studio#organization`, name: AJN_BRAND.studioName, alternateName: AJN_STUDIO_ALTERNATE_NAMES, url: `${SITE_URL}/ajn-studio`, logo: `${SITE_URL}/brand/ajn-logo-transparent.png`, founder: { "@id": `${SITE_URL}/developer#anjan` } },
      { "@type": "Person", "@id": `${SITE_URL}/developer#anjan`, name: AJN_BRAND.developerName, alternateName: AJN_BRAND.developerDisplayName, url: `${SITE_URL}/developer`, image: `${SITE_URL}${AJN_BRAND.developerImageJpeg}`, jobTitle: AJN_BRAND.developerRole, worksFor: { "@id": `${SITE_URL}/ajn-studio#organization` }, sameAs: AJN_CONFIRMED_SOCIAL_LINKS },
      { "@type": "Brand", "@id": `${SITE_URL}/#brand`, name: AJN_BRAND.productName, alternateName: AJN_PRODUCT_ALTERNATE_NAMES, url: SITE_URL, logo: `${SITE_URL}/brand/ajn-logo-transparent.png` },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: AJN_BRAND.productName, alternateName: AJN_PRODUCT_ALTERNATE_NAMES, publisher: { "@id": `${SITE_URL}/ajn-studio#organization` } },
      { "@type": "SoftwareApplication", "@id": `${SITE_URL}/#application`, name: AJN_BRAND.productName, alternateName: AJN_PRODUCT_ALTERNATE_NAMES, url: SITE_URL, applicationCategory: "UtilitiesApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Free online tools for merging, splitting, compressing, organizing, editing, signing, protecting, unlocking and repairing PDF files.", featureList: ["Merge PDF","Split PDF","Compress PDF","Organize PDF","Edit PDF","Sign PDF","Protect PDF","Unlock PDF","Repair PDF"], author: { "@id": `${SITE_URL}/developer#anjan` }, publisher: { "@id": `${SITE_URL}/ajn-studio#organization` }, brand: { "@id": `${SITE_URL}/#brand` } },
    ],
  };

  const themeBoot = `
    try {
      var saved = localStorage.getItem('ajn_theme');
      var theme = saved === 'dark' || saved === 'light'
        ? saved
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  `;

  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="font-sans antialiased">
        <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} strategy="afterInteractive" />
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ProcessingActivityProvider />
              <LiveTranslationBridge />
              {children}
              <GoogleAnalytics />
              <SiteAnalytics />
              <AdSenseScriptLoader />
              <CookieConsent />
              <Toaster />
              <MobileBottomNav />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
