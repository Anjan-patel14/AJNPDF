"use client";

import { AdSenseUnit } from "../adsense-unit";

interface AdUnitProps {
  className?: string;
  slot?: string;
  format?: string;
}

export function AdUnit({ className, slot, format = "auto" }: AdUnitProps) {
  const responsive =
    format === "auto" || format === "fluid" || format === "responsive";

  return (
    <AdSenseUnit
      className={className}
      slot={slot}
      responsive={responsive}
    />
  );
}
