/**
 * Feature Flags Configuration
 *
 * This file contains feature flags that can be easily toggled to show/hide features
 * without having to modify multiple files throughout the codebase.
 *
 * To restore a hidden feature, simply change the flag from false to true.
 */

export const FEATURE_FLAGS = {
  /**
   * Oasis Feature
   *
   * Controls the visibility of the Oasis feature throughout the application.
   * When false, Oasis-related UI elements will be hidden.
   *
   * To restore the Oasis feature:
   * 1. Change this flag to true
   * 2. The feature will automatically become visible again
   */
  OASIS_ENABLED: false,
} as const

/**
 * Type for feature flag key
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[flag]
}
