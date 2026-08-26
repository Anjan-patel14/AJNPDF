'use client';

import { RuntimeImage } from '@/components/ui/runtime-image';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PDF_BACKEND_URL } from '@/lib/pdf-backend';
import { formatAdminApiError } from '@/lib/admin-diagnostics';
import { absoluteMediaUrl, type PublicMediaPost } from '@/lib/public-media';

type PublishStatus = 'published' | 'draft' | 'scheduled';

type EditState = {
  id: number | string;
  title: string;
  caption: string;
  altText: string;
  tags: string;
  status: PublishStatus;
  scheduledAt: string;
};

function postStatus(post: PublicMediaPost): PublishStatus {
  if (!post.published) return 'draft';
  if (post.scheduled_at && new Date(post.scheduled_at).getTime() > Date.now()) return 'scheduled';
  return 'published';
}

function toLocalDateTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function applyStatus(form: FormData, status: PublishStatus, localSchedule: string): void {
  form.delete('status');
  form.delete('scheduled_at');
  form.set('published', status === 'draft' ? 'false' : 'true');
  if (status === 'scheduled') {
    if (!localSchedule) throw new Error('Choose a future publication date and time.');
    const schedule = new Date(localSchedule);
    if (Number.isNaN(schedule.getTime()) || schedule.getTime() <= Date.now()) {
      throw new Error('The scheduled publication time must be in the future.');
    }
    form.set('scheduled_at', schedule.toISOString());
  } else {
    form.set('scheduled_at', '');
  }
}

export default function AdminMediaPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [posts, setPosts] = useState<PublicMediaPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createStatus, setCreateStatus] = useState<PublishStatus>('published');
  const [createSchedule, setCreateSchedule] = useState('');

  useEffect(() => {
    const stored = window.sessionStorage.getItem('ajn_media_admin_token');
    if (stored) setToken(stored);
  }, []);

  const counts = useMemo(() => ({
    published: posts.filter((post) => postStatus(post) === 'published').length,
    scheduled: posts.filter((post) => postStatus(post) === 'scheduled').length,
    draft: posts.filter((post) => postStatus(post) === 'draft').length,
  }), [posts]);

  const normalizePosts = (items: PublicMediaPost[]) => items.map((post) => ({
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
    image_url: absoluteMediaUrl(post.image_url),
    thumbnail_url: post.thumbnail_url ? absoluteMediaUrl(post.thumbnail_url) : undefined,
  }));

  const loadPosts = useCallback(async () => {
    if (!PDF_BACKEND_URL) {
      setError('AJN PDF connection is not configured.');
      return;
    }
    if (!token.trim()) {
      setError('Enter the media admin token.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${PDF_BACKEND_URL}/api/admin/posts`, {
        headers: { 'X-AJN-Admin-Token': token.trim() },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(formatAdminApiError('media', response.status, String(payload.detail || payload.error || '')));
      setPosts(normalizePosts(Array.isArray(payload.posts) ? payload.posts : []));
      window.sessionStorage.setItem('ajn_media_admin_token', token.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The public-image list could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!PDF_BACKEND_URL) {
      setError('AJN PDF connection is not configured.');
      return;
    }
    if (!token.trim()) {
      setError('Enter the media admin token before saving a post.');
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError('');
    setMessage('');
    try {
      applyStatus(form, createStatus, createSchedule);
      const response = await fetch(`${PDF_BACKEND_URL}/api/admin/posts`, {
        method: 'POST',
        headers: { 'X-AJN-Admin-Token': token.trim() },
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(formatAdminApiError('media', response.status, String(payload.detail || payload.error || '')));
      window.sessionStorage.setItem('ajn_media_admin_token', token.trim());
      setMessage(createStatus === 'draft' ? 'Draft saved.' : createStatus === 'scheduled' ? 'Image post scheduled.' : 'Public image published.');
      formElement.reset();
      setCreateStatus('published');
      setCreateSchedule('');
      await loadPosts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The image post could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (post: PublicMediaPost) => {
    setEditing({
      id: post.id,
      title: post.title,
      caption: post.caption,
      altText: post.alt_text,
      tags: post.tags.join(', '),
      status: postStatus(post),
      scheduledAt: toLocalDateTime(post.scheduled_at),
    });
    setError('');
    setMessage('');
  };

  const updatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!PDF_BACKEND_URL || !editing) return;
    const form = new FormData();
    form.set('title', editing.title);
    form.set('caption', editing.caption);
    form.set('alt_text', editing.altText);
    form.set('tags', editing.tags);
    setSaving(true);
    setError('');
    setMessage('');
    try {
      applyStatus(form, editing.status, editing.scheduledAt);
      const response = await fetch(`${PDF_BACKEND_URL}/api/admin/posts/${editing.id}`, {
        method: 'PATCH',
        headers: { 'X-AJN-Admin-Token': token.trim() },
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(formatAdminApiError('media', response.status, String(payload.detail || payload.error || '')));
      setMessage('Image post updated.');
      setEditing(null);
      await loadPosts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The post could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const removePost = async (post: PublicMediaPost) => {
    if (!PDF_BACKEND_URL) return;
    const confirmed = window.prompt(`Type the post title to delete it permanently:\n\n${post.title}`);
    if (confirmed !== post.title) {
      if (confirmed !== null) setError('The title did not match. The post was not deleted.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${PDF_BACKEND_URL}/api/admin/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'X-AJN-Admin-Token': token.trim(), 'X-AJN-Confirm-Title': confirmed },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(formatAdminApiError('media', response.status, String(payload.detail || payload.error || '')));
      setMessage('Public image and generated media files deleted.');
      if (editing?.id === post.id) setEditing(null);
      await loadPosts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The post could not be deleted.');
    }
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <section className="ajn-theme-surface rounded-[2rem] p-6 md:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="ajn-section-kicker">Private media admin</span>
              <h1 className="mt-5 text-4xl font-black tracking-[-.04em] text-foreground md:text-6xl">AJN public-image publishing</h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-muted-foreground">Create, schedule, edit and remove original AJN PDF or AJN Studio posts. The media token stays in session storage and is never added to a public URL.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/analytics" className="ajn-secondary-button">Analytics</Link>

              <Link href="/discover" target="_blank" rel="noreferrer" className="ajn-secondary-button">Open public feed <ExternalLink className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Input type={showToken ? 'text' : 'password'} value={token} onChange={(event) => setToken(event.target.value)} placeholder="Media admin token" className="pr-12" aria-label="Media admin token" autoComplete="off" />
              <button type="button" className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setShowToken((value) => !value)} aria-label={showToken ? 'Hide media token' : 'Show media token'}>{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
            <Button onClick={() => void loadPosts()} disabled={!token.trim() || loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Load posts</Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-muted-foreground">Published</p><p className="mt-1 text-2xl font-black text-foreground">{counts.published}</p></div>
            <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-muted-foreground">Scheduled</p><p className="mt-1 text-2xl font-black text-foreground">{counts.scheduled}</p></div>
            <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-muted-foreground">Drafts</p><p className="mt-1 text-2xl font-black text-foreground">{counts.draft}</p></div>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-600">
            <p><span className="font-black text-slate-800">Connected endpoint:</span> {PDF_BACKEND_URL || 'Not configured'}</p>
            <p className="mt-1">Use the private <code className="font-black">AJN_MEDIA_ADMIN_TOKEN</code> configured for that same deployment. A token from a different local or production environment will be rejected. The token is stored only in this tab&apos;s session storage.</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
          <form onSubmit={submit} className="ajn-theme-surface rounded-[2rem] p-6 md:p-8">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white"><ImagePlus className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-foreground">Create an image post</h2><p className="text-xs font-medium text-muted-foreground">JPEG, PNG or WebP · maximum 12 MB</p></div></div>
            <div className="mt-7 space-y-5">
              <label className="block text-sm font-black text-foreground">Image<Input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-xs file:font-black file:text-white" /></label>
              <label className="block text-sm font-black text-foreground">Title<Input name="title" minLength={5} maxLength={120} required className="mt-2" placeholder="Example: AJN PDF  workflow update" /></label>
              <label className="block text-sm font-black text-foreground">Caption<Textarea name="caption" minLength={60} maxLength={1200} required className="mt-2 min-h-32" placeholder="Explain what the image shows, why it is useful and how it relates to AJN PDF or AJN Studio." /></label>
              <label className="block text-sm font-black text-foreground">Alt text<Input name="alt_text" minLength={10} maxLength={220} required className="mt-2" placeholder="Describe the visible image for accessibility." /></label>
              <label className="block text-sm font-black text-foreground">Tags<Input name="tags" maxLength={240} className="mt-2" placeholder="AJN PDF, document tools" /></label>
              <label className="block text-sm font-black text-foreground">Publication status<select value={createStatus} onChange={(event) => setCreateStatus(event.target.value as PublishStatus)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="published">Publish now</option><option value="scheduled">Schedule</option><option value="draft">Save draft</option></select></label>
              {createStatus === 'scheduled' && <label className="block text-sm font-black text-foreground">Publication date and time<Input type="datetime-local" value={createSchedule} onChange={(event) => setCreateSchedule(event.target.value)} required className="mt-2" /></label>}
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/35 p-4 text-sm font-bold text-foreground"><input name="rights_confirmed" type="checkbox" value="true" required className="mt-0.5 h-4 w-4 rounded border-border" /><span>I confirm that AJN owns this image or has permission to publish it publicly.</span></label>
              <Button type="submit" disabled={!token.trim() || saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : createStatus === 'scheduled' ? <CalendarClock className="h-4 w-4" /> : <Upload className="h-4 w-4" />}{saving ? 'Saving' : createStatus === 'draft' ? 'Save draft' : createStatus === 'scheduled' ? 'Schedule post' : 'Publish image'}</Button>
            </div>
          </form>

          <section className="ajn-theme-surface rounded-[2rem] p-6 md:p-8">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-foreground">Admin image posts</h2><p className="mt-2 text-xs font-medium text-muted-foreground">Published, scheduled and draft posts are visible here.</p></div><FileImage className="h-6 w-6 text-blue-600" /></div>
            <div className="mt-6 space-y-4">
              {!posts.length && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm font-medium text-muted-foreground">Enter the media token and load posts.</div>}
              {posts.map((post) => {
                const status = postStatus(post);
                return (
                  <article key={post.id} className="grid gap-4 rounded-2xl border border-border bg-muted/35 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                    <RuntimeImage src={post.thumbnail_url || post.image_url} alt={post.alt_text} width={96} height={96} className="h-24 w-24 rounded-xl bg-card object-cover" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-foreground">{post.title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${status === 'published' ? 'bg-emerald-100 text-emerald-800' : status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{status}</span></div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{post.caption}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-black"><button type="button" onClick={() => startEdit(post)} className="inline-flex items-center gap-1 text-blue-600"><Edit3 className="h-3.5 w-3.5" />Edit</button>{status === 'published' && <Link href={`/discover/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700"><ExternalLink className="h-3.5 w-3.5" />Public page</Link>}</div>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={() => void removePost(post)} aria-label={`Delete ${post.title}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        {editing && (
          <section className="ajn-theme-surface mt-6 rounded-[2rem] p-6 md:p-8">
            <form onSubmit={updatePost}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><span className="ajn-section-kicker">Edit post</span><h2 className="mt-3 text-2xl font-black text-foreground">{editing.title}</h2></div><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="block text-sm font-black text-foreground">Title<Input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} minLength={5} maxLength={120} required className="mt-2" /></label>
                <label className="block text-sm font-black text-foreground">Alt text<Input value={editing.altText} onChange={(event) => setEditing({ ...editing, altText: event.target.value })} minLength={10} maxLength={220} required className="mt-2" /></label>
                <label className="block text-sm font-black text-foreground lg:col-span-2">Caption<Textarea value={editing.caption} onChange={(event) => setEditing({ ...editing, caption: event.target.value })} minLength={60} maxLength={1200} required className="mt-2 min-h-32" /></label>
                <label className="block text-sm font-black text-foreground">Tags<Input value={editing.tags} onChange={(event) => setEditing({ ...editing, tags: event.target.value })} maxLength={240} className="mt-2" /></label>
                <label className="block text-sm font-black text-foreground">Publication status<select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as PublishStatus })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="draft">Draft</option></select></label>
                {editing.status === 'scheduled' && <label className="block text-sm font-black text-foreground">Publication date and time<Input type="datetime-local" value={editing.scheduledAt} onChange={(event) => setEditing({ ...editing, scheduledAt: event.target.value })} required className="mt-2" /></label>}
              </div>
              <Button type="submit" disabled={saving} className="mt-6">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving changes' : 'Save changes'}</Button>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-950">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p className="font-semibold leading-6">Published images are converted to optimized WebP files, thumbnails are generated, EXIF metadata is removed by re-encoding, and titles, captions, alt text and tags remain editable.</p></div>
        </section>
      </main>
    </div>
  );
}
