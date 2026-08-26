import { RuntimeImage } from '@/components/ui/runtime-image';
import Link from 'next/link';
import { CalendarDays, ImageIcon } from 'lucide-react';
import type { PublicMediaPost } from '@/lib/public-media';

export function PublicMediaGrid({ posts }: { posts: PublicMediaPost[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <article key={post.slug} className="ajn-media-card group">
          <Link href={`/discover/${post.slug}`} className="block" data-analytics-id={`media-card-${post.slug}`}>
            <div className="relative aspect-square overflow-hidden bg-muted">
              {/* Dynamic media uses regular images so a separate Next image host configuration is unnecessary. */}
              <RuntimeImage
                src={post.thumbnail_url || post.image_url}
                alt={post.alt_text}
                width={post.width || 1200}
                height={post.height || 1200}
                loading={post.source === 'static' ? 'eager' : 'lazy'}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-white backdrop-blur"><ImageIcon className="h-3.5 w-3.5" />AJN original</span>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-black leading-6 text-foreground">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-muted-foreground">{post.caption}</p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
