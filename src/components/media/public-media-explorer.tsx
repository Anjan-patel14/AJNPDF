'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { PublicMediaPost } from '@/lib/public-media';
import { PublicMediaGrid } from './public-media-grid';
import { sendAjnAnalytics } from '@/components/analytics/site-analytics';

function queryBucket(value: string) {
  const length = value.trim().length;
  if (!length) return 'empty';
  if (length <= 3) return '1-3';
  if (length <= 8) return '4-8';
  if (length <= 20) return '9-20';
  return '21-plus';
}

export function PublicMediaExplorer({ posts }: { posts: PublicMediaPost[] }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase('en');
  const filtered = useMemo(() => {
    if (!normalized) return posts;
    return posts.filter((post) => [post.title, post.caption, post.alt_text, ...post.tags].join(' ').toLocaleLowerCase('en').includes(normalized));
  }, [normalized, posts]);

  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim().length === 1 || value.trim().length === 4 || value.trim().length === 9 || value.trim().length === 21) {
      sendAjnAnalytics({ event_name: 'search', path: '/discover', category: 'discover', query_length_bucket: queryBucket(value), element_id: 'discover-search' });
    }
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xl">
          <span className="sr-only">Search AJN public images</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search AJN images, updates or topics"
            className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-11 text-sm font-semibold text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear image search" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>}
        </label>
        <p className="px-2 text-xs font-black text-muted-foreground" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'image' : 'images'}</p>
      </div>
      {filtered.length ? <PublicMediaGrid posts={filtered} /> : <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 text-xl font-black text-foreground">No matching AJN images</h2><p className="mt-2 text-sm text-muted-foreground">Try a broader topic or clear the search.</p></div>}
    </div>
  );
}
