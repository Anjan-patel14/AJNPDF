'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { sendAjnAnalytics } from '@/components/analytics/site-analytics';

export function ShareMediaButton({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
      sendAjnAnalytics({ event_name: 'interaction', path: window.location.pathname, category: 'discover', element_id: `share-media:${slug}` });
    } catch {
      // The user can cancel the native share dialog; no error message is needed.
    }
  };
  return <button type="button" onClick={() => void share()} className="ajn-secondary-button" aria-label={`Share ${title}`}>{copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}{copied ? 'Link copied' : 'Share image'}</button>;
}
