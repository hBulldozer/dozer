import type { NCLogEntry, ParsedNCError } from '../types/hathor'

// Error patterns based on actual DozerPoolManager contract errors
// Reference: /Users/moura/repo/dozer-blueprints/hathor/nanocontracts/blueprints/dozer_pool_manager.py
const ERROR_PATTERNS = {
  slippage: [
    /Amount out is too high/i,  // min_accepted_amount > amount_out
  ],
  liquidity: [
    /Insufficient liquidity/i,
  ],
  deadline: [
    /Transaction expired.*timestamp.*>.*deadline/i,
  ],
  unauthorized: [
    /Contract is paused/i,
  ],
  invalid_pool: [
    /Pool does not exist/i,
    /Pool.*not found/i,
    /PoolNotFound/i,
  ],
  invalid_action: [
    /Invalid.*action/i,
    /No liquidity to remove/i,
    /Invalid percentage/i,
  ],
  invalid_tokens: [
    /Invalid.*tokens/i,
    /Token.*not.*pool/i,
    /Only token_a and token_b are allowed/i,
    /Input and output tokens cannot be the same/i,
  ],
}

export function parseNCLogs(logsData: any): ParsedNCError | null {
  if (!logsData) return null

  // nc_logs is an object with block hashes as keys
  // Extract all log entries from all blocks
  let allLogs: NCLogEntry[] = []

  if (typeof logsData === 'object' && !Array.isArray(logsData)) {
    // logsData is an object like: { "block_hash": [{ logs: [...] }] }
    for (const blockHash in logsData) {
      const blockLogs = logsData[blockHash]
      if (Array.isArray(blockLogs)) {
        for (const logGroup of blockLogs) {
          if (logGroup.logs && Array.isArray(logGroup.logs)) {
            allLogs = allLogs.concat(logGroup.logs)
          }
        }
      }
    }
  } else if (Array.isArray(logsData)) {
    // Fallback: if it's already an array
    allLogs = logsData
  }

  if (allLogs.length === 0) return null

  // Find first ERROR level log (or assertion failure message)
  const errorLog = allLogs.find((log: NCLogEntry) =>
    log.level === 'ERROR' ||
    (log.message && log.message.includes('NCFail')) ||
    (log.message && log.message.includes('AssertionError'))
  )
  if (!errorLog || !errorLog.message) return null

  const message = errorLog.message

  // Determine error type from patterns
  let errorType: ParsedNCError['type'] = 'generic'
  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        errorType = type as ParsedNCError['type']
        break
      }
    }
    if (errorType !== 'generic') break
  }

  // Use the original message from the contract as it's already user-friendly
  return {
    type: errorType,
    userMessage: message,  // DozerPoolManager messages are already clear
    technicalMessage: message,
    details: extractErrorDetails(message, errorType),
  }
}

function extractErrorDetails(message: string, errorType: string): Record<string, any> | undefined {
  const details: Record<string, any> = {}

  // Extract deadline timestamp for expired transactions
  if (errorType === 'deadline') {
    const timestampMatch = message.match(/timestamp (\d+).*deadline (\d+)/i)
    if (timestampMatch && timestampMatch[1] && timestampMatch[2]) {
      details.blockTimestamp = parseInt(timestampMatch[1], 10)
      details.deadline = parseInt(timestampMatch[2], 10)
    }
  }

  return Object.keys(details).length > 0 ? details : undefined
}
