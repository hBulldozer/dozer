/**
 * Nano Contract Arguments Parser
 *
 * This utility parses nano contract arguments from hex strings to JavaScript objects,
 * following the approach used by Hathor Explorer.
 *
 * Reference: /Users/moura/repo/hathor-explorer/src/components/tx/TxData.js
 */

// Import wallet-lib for parsing (if available)
let hathorLib: typeof import('@hathor/wallet-lib') | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  hathorLib = require('@hathor/wallet-lib') as typeof import('@hathor/wallet-lib')
} catch {
  // Hathor wallet-lib not available, falling back to manual parsing
}

export interface ParsedNCArgs {
  [key: string]: unknown
}

export interface ContractMethodSignature {
  name: string
  parameters: Array<{
    name: string
    type: string
  }>
}

// Note: Method signatures would be defined here if needed for fallback parsing
// Currently using wallet-lib for parsing which handles this automatically

/**
 * Parse nano contract arguments using Hathor wallet-lib
 * This follows the same approach as the Hathor Explorer
 */
export async function parseNCArgsWithWalletLib(
  blueprintId: string,
  method: string,
  address: string,
  ncArgs: string,
  _network: unknown = null
): Promise<ParsedNCArgs | null> {
  if (!hathorLib || !hathorLib.NanoContractTransactionParser) {
    return null
  }

  try {
    // Set up network if not provided (similar to Hathor Explorer)
    hathorLib.config.setServerUrl(process.env.NEXT_PUBLIC_LOCAL_NODE_URL || '')
    const actualNetwork = hathorLib.config.setNetwork('testnet')

    // Create parser instance (same as Hathor Explorer)
    const ncParser = new hathorLib.NanoContractTransactionParser(
      blueprintId, // Blueprint ID to get structure
      method, // Method being called
      address, // Address used to sign
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actualNetwork as any, // Network configuration - using any to avoid complex typing
      ncArgs // Raw hex string from node
    )

    // Parse arguments (same as Hathor Explorer)
    await ncParser.parseArguments()

    // Convert parsed arguments to a simple object
    const parsedArgs: ParsedNCArgs = {}

    if (ncParser.parsedArgs && Array.isArray(ncParser.parsedArgs)) {
      ncParser.parsedArgs.forEach((arg: unknown) => {
        if (arg && typeof arg === 'object' && arg !== null && 'name' in arg && 'type' in arg && 'value' in arg) {
          const typedArg = arg as { name: string; type: string; value: unknown }
          // Handle different types like the Explorer does
          if (typedArg.type === 'Timestamp') {
            parsedArgs[typedArg.name] = parseInt(String(typedArg.value))
          } else if (typedArg.type === 'Amount') {
            parsedArgs[typedArg.name] = parseInt(String(typedArg.value))
          } else if (typedArg.type.startsWith('SignedData')) {
            parsedArgs[typedArg.name] = typedArg.value
          } else {
            parsedArgs[typedArg.name] = typedArg.value
          }
        }
      })
    }

    return parsedArgs
  } catch (error) {
    console.error('Error parsing NC args with wallet-lib:', error)
    return null
  }
}

/**
 * Fallback parser for when wallet-lib is not available
 * Uses known method signatures to parse common arguments
 */
export function parseNCArgsFallback(method: string, ncArgs: string): ParsedNCArgs | null {
  if (!method || !ncArgs) {
    return null
  }

  try {

    // Special handling for remove_liquidity_single_token
    if (method === 'remove_liquidity_single_token') {
      // Try to extract pool key from hex string
      // Based on the data we saw: "024530302f30303030...5c413"
      // This appears to contain: pool_key + percentage

      try {
        // Convert hex to buffer and try to extract text parts
        const buffer = Buffer.from(ncArgs, 'hex')
        const text = buffer.toString('utf8', 0, buffer.length)

        // Look for pool key pattern (token/token/fee format)
        const poolKeyMatch = text.match(/([0-9a-f]{2,64}\/[0-9a-f]{2,64}\/\d+)/i)
        if (poolKeyMatch) {
          const poolKey = poolKeyMatch[1]
          return {
            pool_key: poolKey,
            method: method
          }
        }
      } catch {
        // Failed to parse hex, continue with other parsing attempts
      }
    }

    return null
  } catch (error) {
    console.error('Error in fallback NC args parsing:', error)
    return null
  }
}

/**
 * Main function to parse nano contract arguments
 * Tries wallet-lib first, falls back to manual parsing
 */
export async function parseNanoContractArgs(
  blueprintId: string,
  method: string,
  address: string,
  ncArgs: string,
  network?: unknown
): Promise<ParsedNCArgs | null> {
  // First try with wallet-lib (like Hathor Explorer)
  const walletLibResult = await parseNCArgsWithWalletLib(blueprintId, method, address, ncArgs, network)

  if (walletLibResult) {
    return walletLibResult
  }

  // Fallback to manual parsing if wallet-lib fails
  return parseNCArgsFallback(method, ncArgs)
}

/**
 * Extract pool key from parsed arguments based on method type
 */
export function extractPoolKeyFromArgs(method: string, parsedArgs: ParsedNCArgs): string | null {
  if (!parsedArgs) {
    return null
  }


  // For remove_liquidity_single_token, pool_key is directly provided
  if (method === 'remove_liquidity_single_token' && parsedArgs.pool_key) {
    const poolKey = typeof parsedArgs.pool_key === 'string' ? parsedArgs.pool_key : null
    return poolKey
  }

  // For add_liquidity_single_token, we need to construct pool key from tokens and fee
  if (method === 'add_liquidity_single_token' && parsedArgs.token_out && parsedArgs.fee) {
    // We can't construct the full pool key without knowing the input token
    // This will be handled by the fallback logic in the caller
    return null
  }

  // For swap methods with path, extract pool keys from path string
  if (method.includes('through_path') && parsedArgs.path_str) {
    const pathStr = typeof parsedArgs.path_str === 'string' ? parsedArgs.path_str : null
    return pathStr
  }

  // For other methods, pool key needs to be constructed from tokens and fee
  // This would require additional transaction context
  return null
}

/**
 * Check if a transaction involves a specific pool
 */
export function transactionInvolvesPools(method: string, parsedArgs: ParsedNCArgs, targetPoolKeys: string[]): boolean {
  if (!parsedArgs || !targetPoolKeys.length) {
    return false
  }


  // Check direct pool key
  const poolKey = extractPoolKeyFromArgs(method, parsedArgs)
  if (poolKey) {
    if (method.includes('through_path')) {
      // For path-based swaps, check if any pool in the path matches
      const pathPools = poolKey.split(',')
      const involved = pathPools.some((pool) => targetPoolKeys.includes(pool))
      return involved
    } else {
      // For single pool operations
      const involved = targetPoolKeys.includes(poolKey)
      return involved
    }
  }

  // Special handling for add_liquidity_single_token when we can't extract pool key directly
  if (method === 'add_liquidity_single_token') {
    // For single token add liquidity, we need to check if any of the target pools
    // contain the token_out specified in the arguments
    if (parsedArgs.token_out) {
      const tokenOut = String(parsedArgs.token_out)
      const involved = targetPoolKeys.some(poolKey => {
        const [tokenA, tokenB] = poolKey.split('/')
        return tokenA === tokenOut || tokenB === tokenOut
      })
      return involved
    }
  }

  return false
}
