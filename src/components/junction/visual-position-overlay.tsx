"use client";

import React, { useRef } from "react";
import { Move, Maximize2 } from "lucide-react";

type Rect = { x: number; y: number; width?: number; height?: number };

type Props = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  pageWidth: number;
  pageHeight: number;
  onChange: (next: Rect) => void;
  children: React.ReactNode;
  resizable?: boolean;
  className?: string;
  ariaLabel?: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function VisualPositionOverlay({
  x,
  y,
  width,
  height,
  pageWidth,
  pageHeight,
  onChange,
  children,
  resizable = false,
  className = "",
  ariaLabel = "Move item on page",
}: Props) {
  const dragRef = useRef<null | {
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    mode: "move" | "resize";
    host: HTMLElement;
  }>(null);

  const left = pageWidth > 0 ? (x / pageWidth) * 100 : 0;
  const bottom = pageHeight > 0 ? (y / pageHeight) * 100 : 0;
  const widthPct = width && pageWidth > 0 ? (width / pageWidth) * 100 : undefined;
  const heightPct = height && pageHeight > 0 ? (height / pageHeight) * 100 : undefined;

  const begin = (event: React.PointerEvent<HTMLElement>, mode: "move" | "resize") => {
    event.preventDefault();
    event.stopPropagation();
    const host = (mode === "resize"
      ? event.currentTarget.parentElement?.parentElement
      : event.currentTarget.parentElement) as HTMLElement | null;
    if (!host) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x,
      y,
      width,
      height,
      mode,
      host,
    };
  };

  const move = (event: React.PointerEvent<HTMLElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const rect = state.host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = ((event.clientX - state.startX) / rect.width) * pageWidth;
    const dy = ((event.clientY - state.startY) / rect.height) * pageHeight;

    if (state.mode === "move") {
      const itemWidth = state.width ?? 0;
      const itemHeight = state.height ?? 0;
      onChange({
        x: Math.round(clamp(state.x + dx, 0, Math.max(0, pageWidth - itemWidth))),
        y: Math.round(clamp(state.y - dy, 0, Math.max(0, pageHeight - itemHeight))),
        width: state.width,
        height: state.height,
      });
      return;
    }

    const nextWidth = Math.round(clamp((state.width ?? 40) + dx, 20, pageWidth - state.x));
    // Handle is at the visual top-right, so moving upward increases height.
    const nextHeight = Math.round(clamp((state.height ?? 20) - dy, 20, pageHeight - state.y));
    onChange({ x: state.x, y: state.y, width: nextWidth, height: nextHeight });
  };

  const end = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const style: React.CSSProperties = {
    left: `${clamp(left, 0, 100)}%`,
    bottom: `${clamp(bottom, 0, 100)}%`,
    width: widthPct ? `${Math.max(2, widthPct)}%` : undefined,
    height: heightPct ? `${Math.max(2, heightPct)}%` : undefined,
    touchAction: "none",
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`absolute z-10 cursor-move select-none rounded-md border-2 border-blue-500 bg-blue-500/10 shadow-lg ${className}`}
      style={style}
      onPointerDown={(event) => begin(event, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span className="pointer-events-none absolute -left-3 -top-3 grid h-6 w-6 place-items-center rounded-lg bg-blue-600 text-white shadow-md" aria-hidden="true">
        <Move className="h-3.5 w-3.5" />
      </span>
      {children}
      {resizable && (
        <button
          type="button"
          aria-label="Resize item"
          title="Resize"
          className="absolute -right-3 -top-3 grid h-7 w-7 cursor-nwse-resize place-items-center rounded-lg border border-white/80 bg-blue-600 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          onPointerDown={(event) => begin(event, "resize")}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
