'use client';

import { useEffect } from 'react';
import { sendAjnAnalytics } from '@/components/analytics/site-analytics';

export function MediaAnalytics({ eventName, slug }: { eventName: 'media_view' | 'media_open'; slug?: string }) {
  useEffect(() => {
    sendAjnAnalytics({
      event_name: eventName,
      path: window.location.pathname,
      category: 'discover',
      element_id: slug ? `media:${slug}` : 'ajn-discover',
    });
  }, [eventName, slug]);
  return null;
}
