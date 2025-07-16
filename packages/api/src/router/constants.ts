/**
 * API Router Constants
 * 
 * Centralized constants used across router files for consistency and maintainability
 */

// Price precision constants - must match contract storage format
export const PRICE_PRECISION = 10 ** 8; // 8 decimal places (100,000,000)

// Token amount precision constants
export const TOKEN_PRECISION = 100; // 2 decimal places for token amounts (cents format)

// Contract precision constants
export const CONTRACT_PRECISION = 10 ** 20; // Used in contract calculations

// Common precision values for easy reference
export const PRECISION_MULTIPLIERS = {
  PRICE: PRICE_PRECISION,        // 100,000,000 (8 decimal places)
  TOKEN: TOKEN_PRECISION,        // 100 (2 decimal places)
  CONTRACT: CONTRACT_PRECISION,  // 10^20 (contract internal precision)
} as const;

// Helper functions for precision conversion
export const formatPrice = (rawPrice: number): number => rawPrice / PRICE_PRECISION;
export const formatTokenAmount = (rawAmount: number): number => rawAmount / TOKEN_PRECISION;

// Type definitions for better type safety
export type PrecisionType = keyof typeof PRECISION_MULTIPLIERS;