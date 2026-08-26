'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Eye,
  EyeOff,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { PDF_BACKEND_URL } from '@/lib/pdf-backend';
import { formatAdminApiError } from '@/lib/admin-diagnostics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Row { [key: string]: string | number | null | undefined }
interface AnalyticsData {
  generated_at: string;
  window_days: number;
  retention_days: number;
  privacy: Record<string, boolean>;
  summary: Row;
  site_summary: Row;
  media_summary: Row;
  funnel: Row;
  tools: Row[];
  daily: Row[];
  site_daily: Row[];
  pages: Row[];
  events: Row[];
  vitals: Row[];
  categories: Row[];
  devices: Row[];
  referrers: Row[];
  themes: Row[];
  connections: Row[];
  interactions: Row[];
  search_buckets: Row[];
  realtime: Row[];
}

function bytes(value: unknown) {
  const n = Number(value || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function number(value: unknown) {
  return Number(value || 0).toLocaleString();
}

function percentage(value: unknown) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function downloadJson(data: AnalyticsData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `ajn-pdf-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MetricCard({ label, value, icon: Icon = Activity, tone = 'blue' }: { label: string; value: string; icon?: typeof Activity; tone?: 'blue' | 'green' | 'red' | 'amber' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="ajn-theme-surface rounded-2xl p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      <p className="mt-4 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function Breakdown({ title, rows, labelKey, valueKey = 'total' }: { title: string; rows: Row[]; labelKey: string; valueKey?: string }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  return (
    <section className="ajn-theme-surface rounded-3xl p-5">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-500">No events in this period.</p>}
        {rows.slice(0, 8).map((row, index) => {
          const value = Number(row[valueKey] || 0);
          return (
            <div key={`${String(row[labelKey])}-${index}`}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-slate-700">{String(row[labelKey] || 'Unknown')}</span>
                <span className="font-black text-slate-950">{number(value)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowDays, setWindowDays] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setToken(window.sessionStorage.getItem('ajn_analytics_admin_token') || '');
  }, []);

  const load = useCallback(async (silent = false) => {
    setError('');
    if (!silent) setLoading(true);
    try {
      if (!PDF_BACKEND_URL) throw new Error('AJN PDF connection is not configured.');
      const response = await fetch(`${PDF_BACKEND_URL}/api/admin/analytics?window_days=${windowDays}`, {
        headers: { 'X-AJN-Admin-Token': token },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(formatAdminApiError('analytics', response.status, String(payload.error || payload.detail || '')));
      setData(payload as AnalyticsData);
      window.sessionStorage.setItem('ajn_analytics_admin_token', token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Analytics could not be loaded.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, windowDays]);

  useEffect(() => {
    if (!autoRefresh || !data || !token) return;
    const timer = window.setInterval(() => void load(true), 15000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, data, load, token]);

  const site = data?.site_summary || {};
  const summary = data?.summary || {};
  const media = data?.media_summary || {};
  const funnel = data?.funnel || {};
  const updated = useMemo(() => data?.generated_at ? new Date(data.generated_at).toLocaleString() : 'Not loaded', [data?.generated_at]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="ajn-theme-surface ajn-rgb-line rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-[11px] font-black uppercase tracking-[.12em] text-blue-700"><ShieldCheck className="h-4 w-4" />Private admin page</span>
                {data && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"><span className="ajn-live-dot" />Live · 15-second refresh</span>}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-.035em] text-slate-950 md:text-5xl">SEO, CRO and conversion analytics</h1>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">Anonymous page activity, interactions, Core Web Vitals and conversion aggregates. Document contents, filenames, account details and raw IP addresses are not persisted in the analytics database.</p>
            </div>

            <div className="w-full max-w-xl">
              <div className="flex flex-wrap items-center justify-end gap-2 pb-3"><Link href="/admin/media" className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-xs font-black text-foreground hover:bg-muted">Media admin</Link><Button type="button" variant="outline" size="sm" onClick={() => data && downloadJson(data)} disabled={!data} data-analytics-id="admin-export-json"><Upload className="h-4 w-4" />Export JSON</Button></div>
              <label htmlFor="admin-token" className="text-xs font-black text-slate-700">Admin token</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Input id="admin-token" type={showToken ? 'text' : 'password'} value={token} onChange={(event) => setToken(event.target.value)} placeholder="Analytics admin token" className="pr-11" />
                  <button type="button" onClick={() => setShowToken((value) => !value)} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showToken ? 'Hide token' : 'Show token'}>{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                <select value={windowDays} onChange={(event) => setWindowDays(Number(event.target.value))} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-bold text-foreground" aria-label="Analytics date range">
                  <option value={1}>24 hours</option><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>1 year</option>
                </select>
                <Button onClick={() => void load(false)} disabled={!token || loading} data-analytics-id="admin-load-analytics">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{loading ? 'Loading' : 'Load'}</Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />Auto-refresh</label>
                <span>Updated: {updated}</span>
              </div>
              {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-800">{error}</p>}
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] font-semibold leading-5 text-slate-600">
                <p><span className="font-black text-slate-800">Connected endpoint:</span> {PDF_BACKEND_URL || 'Not configured'}</p>
                <p className="mt-1">Production requires <code className="font-black">AJN_ANALYTICS_ENABLED=true</code> and a private <code className="font-black">AJN_ANALYTICS_ADMIN_TOKEN</code> configured for that same deployment. Tokens are stored only in this tab&apos;s session storage.</p>
              </div>
            </div>
          </div>
        </div>

        {data && (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <MetricCard label="Page views" value={number(site.page_views)} />
              <MetricCard label="Tool opens" value={number(site.tool_opens)} />
              <MetricCard label="Tool starts" value={number(site.tool_starts)} tone="amber" />
              <MetricCard label="Tool completions" value={number(site.tool_completes)} tone="green" />
              <MetricCard label="Downloads" value={number(site.downloads)} tone="green" />
              <MetricCard label="Discover visits" value={number(site.media_views)} tone="blue" />
              <MetricCard label="Image opens" value={number(site.media_opens)} tone="green" />
              <MetricCard label="Published images" value={number(media.published_posts)} tone="amber" />
            </section>

            <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Start → complete" value={percentage(funnel.start_to_complete_rate)} tone="green" />
              <MetricCard label="Complete → download" value={percentage(funnel.complete_to_download_rate)} tone="blue" />
              <MetricCard label="Tool error rate" value={percentage(funnel.tool_error_rate)} tone={Number(funnel.tool_error_rate || 0) > 10 ? 'red' : 'amber'} />
              <MetricCard label="Search interactions" value={number(site.searches)} />
            </section>

            <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Online conversions" value={number(summary.total)} />
              <MetricCard label="Conversion failures" value={number(summary.failed)} tone={Number(summary.failed || 0) ? 'red' : 'green'} />
              <MetricCard label="Average processing" value={`${Math.round(Number(summary.avg_duration_ms || 0))} ms`} />
              <MetricCard label="Processed input" value={bytes(summary.input_bytes)} />
            </section>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Breakdown title="Traffic sources" rows={data.referrers} labelKey="referrer_group" />
              <Breakdown title="Devices" rows={data.devices} labelKey="device_type" />
              <Breakdown title="Themes" rows={data.themes} labelKey="theme" />
              <Breakdown title="Categories" rows={data.categories} labelKey="category" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section className="ajn-theme-surface overflow-hidden rounded-3xl">
                <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-black">Top landing pages</h2><p className="mt-1 text-xs text-slate-500">Use Search Console for search queries and impressions; this table shows consented on-site page activity.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-500"><tr><th className="px-5 py-3">Path</th><th className="px-5 py-3">Views</th></tr></thead><tbody>{data.pages.map((row) => <tr key={String(row.path)} className="border-t border-slate-100"><td className="px-5 py-4 font-black">{String(row.path)}</td><td className="px-5 py-4">{number(row.views)}</td></tr>)}</tbody></table></div>
              </section>

              <section className="ajn-theme-surface overflow-hidden rounded-3xl">
                <div className="border-b border-slate-200 p-5"><h2 className="flex items-center gap-2 text-lg font-black"><Gauge className="h-5 w-5 text-blue-600" />Core Web Vitals</h2><p className="mt-1 text-xs text-slate-500">Field samples are collected only after optional consent.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-500"><tr><th className="px-5 py-3">Metric</th><th className="px-5 py-3">Samples</th><th className="px-5 py-3">Average</th><th className="px-5 py-3">Good</th><th className="px-5 py-3">Poor</th></tr></thead><tbody>{data.vitals.map((row) => <tr key={String(row.metric_name)} className="border-t border-slate-100"><td className="px-5 py-4 font-black">{String(row.metric_name)}</td><td className="px-5 py-4">{number(row.samples)}</td><td className="px-5 py-4">{Number(row.average || 0).toFixed(1)}</td><td className="px-5 py-4 text-emerald-600">{number(row.good)}</td><td className="px-5 py-4 text-red-600">{number(row.poor)}</td></tr>)}</tbody></table></div>
              </section>
            </div>

            <section className="ajn-theme-surface mt-6 overflow-hidden rounded-3xl">
              <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-black">Tool usage and output reliability</h2><p className="mt-1 text-xs text-slate-500">Conversion runs aggregated by tool. No filenames or document contents are included.</p></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-500"><tr><th className="px-5 py-3">Tool</th><th className="px-5 py-3">Runs</th><th className="px-5 py-3">Success</th><th className="px-5 py-3">Failed</th><th className="px-5 py-3">Average time</th><th className="px-5 py-3">Output</th></tr></thead><tbody>{data.tools.map((row) => <tr key={String(row.tool_id)} className="border-t border-slate-100"><td className="px-5 py-4 font-black">{String(row.tool_id)}</td><td className="px-5 py-4">{number(row.runs)}</td><td className="px-5 py-4 text-emerald-600">{number(row.success)}</td><td className="px-5 py-4 text-red-600">{number(row.failed)}</td><td className="px-5 py-4">{Math.round(Number(row.avg_duration_ms || 0))} ms</td><td className="px-5 py-4">{bytes(row.output_bytes)}</td></tr>)}</tbody></table></div>
            </section>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Breakdown title="Most-used controls" rows={data.interactions} labelKey="element_id" />
              <Breakdown title="Event mix" rows={data.events} labelKey="event_name" />
              <Breakdown title="Search length" rows={data.search_buckets} labelKey="query_length_bucket" />
              <Breakdown title="Connection types" rows={data.connections} labelKey="connection_type" />
            </div>

            <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-black">Privacy design</h2><p className="mt-1 leading-6">Retention: {data.retention_days} days. This dashboard stores aggregate events and performance measurements only. Rate limiting may use an address temporarily in memory, but IP addresses are not written to the analytics database.</p></div></div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
