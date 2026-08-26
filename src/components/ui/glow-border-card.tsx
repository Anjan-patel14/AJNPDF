"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface GlowBorderCardProps {
  children: React.ReactNode;
  className?: string;
  width?: string;
  aspectRatio?: string;
  colorPreset?: "aurora" | "primary" | "emerald";
  animationDuration?: number;
}

/**
 * AJN Glow Border Card
 * High-fidelity interaction container with infinite color-shift glow.
 */
export function GlowBorderCard({
  children,
  className,
  width = "100%",
  aspectRatio = "1",
  colorPreset = "aurora",
  animationDuration = 6,
}: GlowBorderCardProps) {
  const presets = {
    aurora: "from-indigo-500 via-purple-500 to-pink-500",
    primary: "from-blue-600 via-indigo-600 to-blue-400",
    emerald: "from-emerald-500 via-teal-500 to-emerald-400",
  };

  return (
    <div
      className={cn("relative group", className)}
      style={{ width, aspectRatio }}
    >
      {/* Animated Glow Layer */}
      <div
        className={cn(
          "absolute -inset-1 rounded-3xl blur-xl opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse bg-gradient-to-r",
          presets[colorPreset]
        )}
        style={{ animationDuration: `${animationDuration}s` }}
      />
      
      {/* Background Layer */}
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-white/20 to-white/10 opacity-10 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content Layer */}
      <div className="relative w-full h-full bg-slate-950/90 rounded-3xl overflow-hidden backdrop-blur-2xl border border-white/10 shadow-2xl">
        {children}
      </div>
    </div>
  );
}