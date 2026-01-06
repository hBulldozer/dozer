// NC Execution Log Entry
export interface NCLogEntry {
  type?: string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
  message?: string
  timestamp?: number
  context?: Record<string, any>
  key_values?: Record<string, any>
}

// Parsed Error from NC Logs
export interface ParsedNCError {
  type: 'slippage' | 'liquidity' | 'deadline' | 'unauthorized' | 'invalid_pool' | 'invalid_action' | 'invalid_tokens' | 'generic'
  userMessage: string      // User-friendly message (from contract)
  technicalMessage: string // Original error from logs
  details?: Record<string, any> // Additional context (timestamps, etc.)
}

// Enhanced Transaction Status Response
export interface TxStatusResponse {
  validation: 'success' | 'pending' | 'failed'
  message: string
  hash: string
  error?: ParsedNCError  // New field for detailed errors
}
