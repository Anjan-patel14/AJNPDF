export type PlanId = "free" | "premium" | "business";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  summary: string;
  features: string[];
  highlighted?: boolean;
};

export const AJN_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    summary: "Core PDF tools for everyday work.",
    features: [
      "20 public PDF tools",
      "No account required for core tools",
      "Standard tool limits",
      "Ads may appear",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    summary: "Prepaid access for regular AJN PDF users.",
    highlighted: true,
    features: [
      "Ad-free experience while signed in",
      "30-day or 365-day prepaid access",
      "Plan status and expiry in your account",
      "No automatic renewal in this release",
    ],
  },
];

// Compatibility exports retained for internal/source migration.
export const AJN_BILLING_URL = process.env.NEXT_PUBLIC_AJN_BILLING_URL?.trim() || "";
export const AJN_BUZZ_URL = process.env.NEXT_PUBLIC_AJN_BUZZ_URL?.trim() || "https://ajn.buzz";
export const AJN_DESKTOP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_AJN_DESKTOP_DOWNLOAD_URL?.trim() || "";
export const AJN_ANDROID_URL = process.env.NEXT_PUBLIC_AJN_ANDROID_URL?.trim() || "";
export const AJN_IOS_URL = process.env.NEXT_PUBLIC_AJN_IOS_URL?.trim() || "";
