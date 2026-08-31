'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { toolIdFromPathname } from '@/lib/tool-routes';

const CONSENT_KEY = 'ajn_cookie_consent';

export type AnalyticsEventName =
  | 'page_view'
  | 'tool_open'
  | 'tool_start'
  | 'tool_complete'
  | 'tool_error'
  | 'download'
  | 'web_vital'
  | 'interaction'
  | 'search'
  | 'category_filter'
  | 'consent_update'
  | 'outbound_click'
  | 'tool_reset'
  | 'tool_retry'
  | 'upload_selected'
  | 'media_view'
  | 'media_open';

export type SiteEvent = {
  event_name: AnalyticsEventName;
  path: string;
  tool_id?: string;
  metric_name?: string;
  metric_value?: number;
  metric_rating?: string;
  element_id?: string;
  category?: string;
  query_length_bucket?: string;
  referrer_group?: string;
  device_type?: string;
  viewport_bucket?: string;
  connection_type?: string;
  theme?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
  interface Navigator {
    connection?: { effectiveType?: string };
  }
}

function hasConsent(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(CONSENT_KEY) === 'accepted';
}

function currentToolId(path: string): string | undefined {
  return toolIdFromPathname(path);
}


function categoryFromPath(path: string): string | undefined {
  if (path.startsWith('/conversion-tools')) return 'conversion';
  if (path.startsWith('/image-tools')) return 'image';
  if (path.startsWith('/pdf-utilities') || path.startsWith('/pdf-tools')) return 'pdf';
  return undefined;
}

function deviceType(): string {
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function viewportBucket(): string {
  const width = window.innerWidth;
  if (width < 390) return 'xs';
  if (width < 640) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1440) return 'lg';
  return 'xl';
}

function referrerGroup(): string {
  if (!document.referrer) return 'direct';
  try {
    const url = new URL(document.referrer);
    if (url.hostname === window.location.hostname) return 'internal';
    if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\./i.test(url.hostname)) return 'organic-search';
    if (/facebook\.|instagram\.|linkedin\.|twitter\.|x\.com$|youtube\.|reddit\.|whatsapp\./i.test(url.hostname)) return 'social';
    return 'referral';
  } catch {
    return 'unknown';
  }
}

function environmentFields(): Partial<SiteEvent> {
  if (typeof window === 'undefined') return {};
  return {
    referrer_group: referrerGroup(),
    device_type: deviceType(),
    viewport_bucket: viewportBucket(),
    connection_type: navigator.connection?.effectiveType?.slice(0, 20) || 'unknown',
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  };
}

function sanitizeEvent(event: SiteEvent): SiteEvent {
  const clean = (value: string | undefined, max: number) => value?.replace(/[\r\n]/g, ' ').trim().slice(0, max) || undefined;
  return {
    ...event,
    path: event.path.split('?')[0].split('#')[0].slice(0, 300) || '/',
    tool_id: clean(event.tool_id, 120),
    metric_name: clean(event.metric_name, 40),
    metric_rating: clean(event.metric_rating, 20),
    element_id: clean(event.element_id, 100),
    category: clean(event.category, 40),
    query_length_bucket: clean(event.query_length_bucket, 30),
    referrer_group: clean(event.referrer_group, 30),
    device_type: clean(event.device_type, 20),
    viewport_bucket: clean(event.viewport_bucket, 20),
    connection_type: clean(event.connection_type, 20),
    theme: clean(event.theme, 12),
  };
}

export function sendAjnAnalytics(event: SiteEvent) {
  if (!hasConsent()) return;
  const payload = sanitizeEvent({ ...environmentFields(), ...event });
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();

  if (measurementId && window.gtag) {
    window.gtag('event', payload.event_name, {
      page_path: payload.path,
      tool_id: payload.tool_id,
      metric_name: payload.metric_name,
      metric_value: payload.metric_value,
      metric_rating: payload.metric_rating,
      element_id: payload.element_id,
      category: payload.category,
      query_length_bucket: payload.query_length_bucket,
      referrer_group: payload.referrer_group,
      device_type: payload.device_type,
      viewport_bucket: payload.viewport_bucket,
      connection_type: payload.connection_type,
      theme: payload.theme,
    });
  }

}

function analyticsId(target: HTMLElement): string | undefined {
  const explicit = target.dataset.analyticsId;
  if (explicit) return explicit;
  if (target instanceof HTMLAnchorElement) {
    try {
      const url = new URL(target.href, window.location.origin);
      return url.origin === window.location.origin ? `link:${url.pathname}` : `outbound:${url.hostname}`;
    } catch {
      return 'link';
    }
  }
  if (target instanceof HTMLButtonElement) return target.name ? `button:${target.name}` : 'button';
  return undefined;
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const lastPath = useRef('');

  useEffect(() => {
    const recordPage = () => {
      if (!pathname || !hasConsent() || lastPath.current === pathname) return;
      lastPath.current = pathname;
      const toolId = currentToolId(pathname);
      const category = categoryFromPath(pathname);
      sendAjnAnalytics({ event_name: 'page_view', path: pathname, tool_id: toolId, category });
      if (toolId) sendAjnAnalytics({ event_name: 'tool_open', path: pathname, tool_id: toolId, category });
    };
    recordPage();
    window.addEventListener('ajn-cookie-consent-changed', recordPage);
    return () => window.removeEventListener('ajn-cookie-consent-changed', recordPage);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!hasConsent()) return;
      const raw = event.target;
      if (!(raw instanceof Element)) return;
      const target = raw.closest<HTMLElement>('[data-analytics-id],a,button');
      if (!target) return;
      const id = analyticsId(target);
      if (!id) return;
      const path = window.location.pathname;
      const toolId = currentToolId(path);
      const href = target instanceof HTMLAnchorElement ? target.href : '';
      let outbound = false;
      if (href) {
        try { outbound = new URL(href, window.location.origin).origin !== window.location.origin; } catch { outbound = false; }
      }
      sendAjnAnalytics({
        event_name: outbound ? 'outbound_click' : 'interaction',
        path,
        tool_id: toolId,
        category: target.dataset.analyticsCategory || categoryFromPath(path),
        element_id: id,
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useReportWebVitals((metric) => {
    if (!hasConsent()) return;
    sendAjnAnalytics({
      event_name: 'web_vital',
      path: window.location.pathname,
      tool_id: currentToolId(window.location.pathname),
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
    });
  });

  return null;
}
