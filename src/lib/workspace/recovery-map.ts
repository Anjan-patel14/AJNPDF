export type RecoveryType =
  | "damaged"
  | "encrypted"
  | "wrong-type"
  | "too-large"
  | "service"
  | "network"
  | "unknown";

export type RecoveryDefinition = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
};

export const RECOVERY_MAP: Record<RecoveryType, RecoveryDefinition> = {
  damaged: { title: "We couldn't read this PDF.", actionLabel: "Try Repair PDF", actionHref: "/repair-pdf" },
  encrypted: { title: "This PDF is password-protected.", actionLabel: "Use Unlock PDF", actionHref: "/unlock-pdf" },
  "wrong-type": { title: "That's not a supported PDF.", actionLabel: "Select a PDF again" },
  "too-large": { title: "This file exceeds the current limit.", actionLabel: "Try Compress PDF", actionHref: "/compress-pdf" },
  service: { title: "The processing service is temporarily unavailable." },
  network: { title: "The network connection was interrupted." },
  unknown: { title: "AJN PDF couldn't finish this request." },
};

export function inferRecoveryType(message: string): RecoveryType {
  const value = message.toLowerCase();
  if (/damag|corrupt|xref|broken structure|invalid pdf/.test(value)) return "damaged";
  if (/password|encrypted|protected/.test(value)) return "encrypted";
  if (/file type|not a pdf|unsupported.*pdf/.test(value)) return "wrong-type";
  if (/too large|exceeds.*limit|file size/.test(value)) return "too-large";
  if (/503|unavailable|backend|service/.test(value)) return "service";
  if (/network|fetch|offline|connection/.test(value)) return "network";
  return "unknown";
}
