/**
 * Utility functions for parsing and formatting error messages from wallet/RPC operations
 */

/**
 * Extract a user-friendly error message from various error types
 * Handles Error objects, WalletConnect errors, RPC errors, and string errors
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle string errors
  if (typeof error === 'string') {
    if (isUserRejection(error)) {
      return 'Transaction cancelled by user'
    }
    return error
  }

  // Handle Error objects
  if (error instanceof Error) {
    if (isUserRejection(error.message)) {
      return 'Transaction cancelled by user'
    }
    return error.message
  }

  // Handle WalletConnect/RPC error objects
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>

    // Check for message property
    if (typeof err.message === 'string') {
      if (isUserRejection(err.message)) {
        return 'Transaction cancelled by user'
      }
      return err.message
    }

    // Check for error property (nested error)
    if (err.error && typeof err.error === 'object') {
      const nestedErr = err.error as Record<string, unknown>
      if (typeof nestedErr.message === 'string') {
        if (isUserRejection(nestedErr.message)) {
          return 'Transaction cancelled by user'
        }
        return nestedErr.message
      }
    }

    // Check for reason property (some RPC errors)
    if (typeof err.reason === 'string') {
      if (isUserRejection(err.reason)) {
        return 'Transaction cancelled by user'
      }
      return err.reason
    }

    // Check for code property (WalletConnect specific)
    if (typeof err.code === 'number') {
      // User rejection codes
      if (err.code === 4001 || err.code === 5000) {
        return 'Transaction cancelled by user'
      }
    }
  }

  return 'Transaction failed'
}

/**
 * Check if an error message indicates user rejection
 */
const isUserRejection = (message: string): boolean => {
  const lowerMessage = message.toLowerCase()
  return (
    lowerMessage.includes('rejected') ||
    lowerMessage.includes('denied') ||
    lowerMessage.includes('cancelled') ||
    lowerMessage.includes('canceled') ||
    lowerMessage.includes('user refused') ||
    lowerMessage.includes('user declined')
  )
}

/**
 * Get a transaction-specific error message
 * @param error - The error object
 * @param transactionType - Type of transaction (e.g., 'swap', 'add liquidity', 'remove liquidity')
 */
export const getTransactionErrorMessage = (error: unknown, transactionType: string): string => {
  const baseMessage = getErrorMessage(error)

  // If it's a user cancellation, return as-is
  if (baseMessage === 'Transaction cancelled by user') {
    return baseMessage
  }

  // If it's the generic failure, make it specific
  if (baseMessage === 'Transaction failed') {
    return `${capitalizeFirst(transactionType)} failed`
  }

  return baseMessage
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
