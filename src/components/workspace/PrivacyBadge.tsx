"use client";

import { Cloud, LockKeyhole } from "lucide-react";
import { getWorkspaceProcessingPolicy } from "@/lib/workspace/processing-policy";

export function PrivacyBadge({ toolId, className = "" }: { toolId: string; className?: string }) {
  const policy = getWorkspaceProcessingPolicy(toolId);
  const Icon = policy.mode === "browser" ? LockKeyhole : Cloud;

  return (
    <span className={`ajn-privacy-badge ${className}`.trim()} title={policy.description}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {policy.label}
    </span>
  );
}
