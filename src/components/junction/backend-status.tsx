'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { checkPdfBackendHealth, type PdfBackendHealth } from '@/lib/pdf-backend';
import { useLanguage } from '@/lib/i18n/language-context';

const INITIAL_HEALTH: PdfBackendHealth = {
  status: 'offline',
  message: 'Checking online tools...',
  messageKey: 'backend.checking',
};

export type BackendDisplayState = 'checking' | 'operational' | 'degraded' | 'unavailable';

export function usePdfBackendStatus(autoRefreshMs = 0, enabled = true) {
  const [health, setHealth] = useState<PdfBackendHealth>(INITIAL_HEALTH);
  const [checking, setChecking] = useState(enabled);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const requestSerial = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const serial = ++requestSerial.current;
    setChecking(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const next = await checkPdfBackendHealth(controller.signal);
      if (requestSerial.current !== serial) return;
      setHealth(next);
      setLastCheckedAt(new Date());
    } finally {
      window.clearTimeout(timeout);
      if (requestSerial.current === serial) setChecking(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setChecking(false);
      return;
    }
    void refresh();
    if (autoRefreshMs <= 0) return;
    const interval = window.setInterval(() => { void refresh(); }, autoRefreshMs);
    return () => window.clearInterval(interval);
  }, [autoRefreshMs, enabled, refresh]);

  const online = health.status === 'online';
  const degraded = Boolean(
    online &&
    typeof health.availableConversionTools === 'number' &&
    typeof health.conversionTools === 'number' &&
    health.availableConversionTools < health.conversionTools,
  );
  const displayState: BackendDisplayState = checking ? 'checking' : online ? (degraded ? 'degraded' : 'operational') : 'unavailable';

  return { health, checking, refresh, online, degraded, displayState, lastCheckedAt };
}

export function BackendStatus({ compact = false, autoRefreshMs = 0, showLastChecked = true }: { compact?: boolean; autoRefreshMs?: number; showLastChecked?: boolean }) {
  const { t } = useLanguage();
  const { health, checking, refresh, online, degraded, displayState, lastCheckedAt } = usePdfBackendStatus(autoRefreshMs);
  const toneClass = displayState === 'operational' ? 'ajn-status-success' : displayState === 'unavailable' ? 'ajn-status-error' : 'ajn-status-warning';
  const stateLabel = displayState === 'checking'
    ? t('status.checking')
    : displayState === 'operational'
      ? t('status.operational')
      : displayState === 'degraded'
        ? t('status.degraded')
        : t('status.unavailable');
  const StateIcon = displayState === 'checking' ? Loader2 : displayState === 'operational' ? CheckCircle2 : displayState === 'degraded' ? AlertTriangle : WifiOff;

  return (
    <div role="status" aria-live="polite" aria-busy={checking || undefined} className={`ajn-backend-status ${toneClass}`} style={{ padding: compact ? 10 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <span className={`ajn-status-dot ajn-status-dot-${displayState}`} data-state={displayState} aria-hidden="true" />
        <StateIcon size={17} className={checking ? 'animate-spin' : ''} aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900 }}>{t('backend.service')}: {stateLabel}</div>
          {!compact && <div style={{ marginTop: 3, fontSize: 10, fontWeight: 700, opacity: .84 }}>{t(health.messageKey)}</div>}
          {!compact && online && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-extrabold text-slate-700">

              {typeof health.availableConversionTools === 'number' && typeof health.conversionTools === 'number' && <span>{health.availableConversionTools}/{health.conversionTools} online workflows available{degraded ? ' · some optional formats unavailable' : ''}</span>}
            </div>
          )}
          {!compact && showLastChecked && lastCheckedAt && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
              <Clock3 className="h-3 w-3" aria-hidden="true" /> {t('status.lastChecked')} {lastCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>
      </div>
      <button type="button" onClick={() => void refresh()} disabled={checking} aria-label={t('backend.checkAgain')} className="ajn-status-refresh" style={{ cursor: checking ? 'wait' : 'pointer' }}>
        <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
