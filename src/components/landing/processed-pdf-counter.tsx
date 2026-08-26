"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function parseTarget() {
  const raw = process.env.NEXT_PUBLIC_AJN_DEMO_PROCESSED_COUNT;
  const parsed = raw ? Number(raw) : 200000;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 200000;
}

function compact(value: number) {
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value / 1_000_000)}M+`;
  }
  if (value >= 1_000) {
    return `${new Intl.NumberFormat("en", { maximumFractionDigits: value >= 100_000 ? 0 : 1 }).format(value / 1_000)}K+`;
  }
  return `${new Intl.NumberFormat("en").format(value)}+`;
}

export function ProcessedPdfCounter({ compactMode = true }: { compactMode?: boolean }) {
  const target = useMemo(parseTarget, []);
  const start = Math.max(0, target - Math.min(1300, Math.round(target * 0.02)));
  const [value, setValue] = useState(start);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const started = performance.now();
        const duration = 900;

        const tick = (now: number) => {
          const progress = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(start + (target - start) * eased));

          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [start, target]);

  const label = compactMode ? compact(value) : `${new Intl.NumberFormat("en").format(value)}+`;

  return <span ref={ref}>{label}</span>;
}
