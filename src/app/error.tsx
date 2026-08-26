'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, TriangleAlert, Wrench } from 'lucide-react';
import { sendAjnAnalytics } from '@/components/analytics/site-analytics';

const CHUNK_RELOAD_KEY = 'ajn_chunk_reload_attempted';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isChunkError = useMemo(() => /chunk|loading css|dynamically imported module/i.test(error?.message || ''), [error?.message]);

  useEffect(() => {
    sendAjnAnalytics({ event_name: 'interaction', path: window.location.pathname, element_id: isChunkError ? 'error:stale-deployment-chunk' : 'error:application-boundary' });
    if (!isChunkError || window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
  }, [isChunkError]);

  const retry = () => {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    reset();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-20 text-foreground">
      <section className="ajn-theme-surface w-full max-w-xl rounded-[2rem] p-8 text-center md:p-12" role="alert">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600"><TriangleAlert className="h-8 w-8" /></span>
        <h1 className="mt-6 text-3xl font-black tracking-[-.035em] text-foreground md:text-4xl">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-7 text-muted-foreground">The page could not finish loading. Retry the action, open the tools directory, or return to the homepage.</p>
        {isChunkError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">A newer deployment may be available. AJN PDF attempted one safe refresh.</p>}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={retry} className="ajn-primary-button"><RefreshCcw className="h-4 w-4" />Retry</button>
          <Link href="/pdf-tools" className="ajn-secondary-button"><Wrench className="h-4 w-4" />All tools</Link>
          <Link href="/" className="ajn-secondary-button"><Home className="h-4 w-4" />Home</Link>
        </div>
      </section>
    </main>
  );
}
