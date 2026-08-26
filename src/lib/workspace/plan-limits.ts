export const PLAN_CAPABILITIES = {
  free: {
    adFree: false,
  },
  premium: {
    adFree: true,
  },
} as const;

/**
 * File-size limits stay owned by the actual tool policy/processor.
 * Do not duplicate invented Free/Premium byte limits in UI marketing.
 */
export type PlanCapability = keyof typeof PLAN_CAPABILITIES.premium;
