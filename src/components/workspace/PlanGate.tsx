"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export function PlanGate({
  children,
  premium,
  fallback,
}: {
  children: ReactNode;
  premium: boolean;
  fallback: ReactNode;
}) {
  const auth = useAuth();
  if (!premium) return <>{children}</>;
  return auth.plan !== "free" ? <>{children}</> : <>{fallback}</>;
}
