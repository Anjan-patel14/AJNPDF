'use client';

/**
 * AJN Feature Management System
 * Allows real-time control of platform modules (Kill Switches & Segmented Rollouts).
 * In production, this can be linked to LaunchDarkly or Flagsmith.
 */

export type FeatureKey = 
  | 'sharing' 
  | 'ai_assistant' 
  | 'batch_processing' 
  | 'advanced_retouching';

class FeatureFlagSystem {
  private flags: Record<FeatureKey, boolean> = {
    'sharing': true,
    'ai_assistant': true,
    'batch_processing': true,
    'advanced_retouching': true
  };

  /**
   * Checks whether a specific feature is enabled in the current application state.
   */
  isEnabled(key: FeatureKey): boolean {
    // Note: In production, this would fetch from a remote config provider.
    return this.flags[key];
  }

  /**
   * Administrative override for testing or emergency kill-switch activation.
   */
  setFlag(key: FeatureKey, value: boolean) {
    this.flags[key] = value;
  }
}

export const featureFlags = new FeatureFlagSystem();
