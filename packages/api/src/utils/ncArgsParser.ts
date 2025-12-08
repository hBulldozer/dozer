/**
 * Nano Contract Arguments Parser
 *
 * @deprecated This parser is being phased out in favor of nc_args_decoded from Hathor-core API.
 *
 * The Hathor node now provides pre-parsed arguments via the nc_args_decoded field in transaction responses.
 * This parser is kept for backwards compatibility during the transition period.
 *
 * New code should use nc_args_decoded directly from the API response instead of calling this function.
 * This file will be removed once all nodes are updated to the new API version (PR #1486).
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
 * Read a LEB128 encoded unsigned integer from a buffer
 * @param buffer The buffer to read from
 * @param offset The offset to start reading from
 * @returns A tuple of [value, newOffset]
 */
function readLEB128(buffer: Buffer, offset: number): [number, number] {
  let result = 0
  let shift = 0
  let position = offset

  while (position < buffer.length) {
    const byte = buffer[position]
    if (byte === undefined) {
      break
    }

    result |= (byte & 0x7f) << shift
    position++

    if ((byte & 0x80) === 0) {
      break
    }
    shift += 7
  }

  return [result, position]
}

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
    // Special case: create_liquidity_pool is in DozerTools blueprint, not pool manager
    let actualBlueprintId = blueprintId
    if (method === 'create_liquidity_pool') {
      const dozerToolsBlueprintId = process.env.NEXT_PUBLIC_DOZER_TOOLS_BLUEPRINT_ID
      if (dozerToolsBlueprintId) {
        actualBlueprintId = dozerToolsBlueprintId
      }
    }

    // Set up network configuration (same as Hathor Explorer)
    const serverUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL || ''
    if (!serverUrl) {
      console.warn('NEXT_PUBLIC_LOCAL_NODE_URL not set, wallet-lib parsing may fail')
      return null
    }

    hathorLib.config.setServerUrl(serverUrl)

    // Fetch network info from the node to set correct network (same as Hathor Explorer does)
    // This ensures wallet-lib connects to the correct network and can fetch blueprint info
    let networkName = 'testnet' // Default fallback
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/version`)
      const data = await response.json()
      if (data.network) {
        // Wallet-lib only supports: testnet, mainnet, privatenet
        // Map custom network names to these base networks
        if (data.network.includes('testnet')) {
          networkName = 'testnet'
        } else if (data.network.includes('mainnet')) {
          networkName = 'mainnet'
        } else if (data.network.includes('privatenet')) {
          networkName = 'privatenet'
        } else {
          networkName = data.network // Try exact match as fallback
        }
      }
    } catch (error) {
      console.warn('Failed to fetch network info from node, using testnet as default:', error)
    }

    const actualNetwork = hathorLib.config.setNetwork(networkName)

    // Create parser instance (same as Hathor Explorer)
    const ncParser = new hathorLib.NanoContractTransactionParser(
      actualBlueprintId, // Blueprint ID to get structure (may be DozerTools for create_liquidity_pool)
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error parsing NC args with wallet-lib for method "${method}":`, errorMessage)
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
      // Format: [arg_count:LEB128][string_length:LEB128][pool_key_string:N][percentage:2]
      // Example: 024530302f303030...c801
      // - LEB128 arg count (usually 02 = 2 arguments)
      // - LEB128 string length (e.g., 45 = 69 bytes)
      // - 30302f30...: pool key UTF-8 string
      // - c801: percentage in little-endian uint16

      try {
        const buffer = Buffer.from(ncArgs, 'hex')

        if (buffer.length < 3) {
          return null
        }

        // Read arg count (LEB128)
        const [, afterArgCount] = readLEB128(buffer, 0)

        // Read string length (LEB128)
        const [stringLength, afterLength] = readLEB128(buffer, afterArgCount)

        // Extract pool key string
        if (buffer.length < afterLength + stringLength) {
          return null
        }

        const poolKey = buffer.slice(afterLength, afterLength + stringLength).toString('utf-8')

        // Extract percentage if available
        let percentage = null
        if (buffer.length >= afterLength + stringLength + 2) {
          percentage = buffer.readUInt16LE(afterLength + stringLength)
        }

        return {
          pool_key: poolKey,
          percentage: percentage,
          method: method
        }
      } catch (error) {
        console.error('Error parsing remove_liquidity_single_token args:', error)
        // Failed to parse hex, continue with other parsing attempts
      }
    }

    // Special handling for add_liquidity_single_token
    if (method === 'add_liquidity_single_token') {
      // Similar format to remove_liquidity_single_token
      // This method might also pass pool_key as first argument
      try {
        const buffer = Buffer.from(ncArgs, 'hex')

        if (buffer.length < 3) {
          return null
        }

        // Read arg count (LEB128)
        const [, afterArgCount] = readLEB128(buffer, 0)

        // Read string length (LEB128)
        const [stringLength, afterLength] = readLEB128(buffer, afterArgCount)

        // Extract pool key string if it exists
        if (buffer.length < afterLength + stringLength) {
          return null
        }

        const firstArg = buffer.slice(afterLength, afterLength + stringLength).toString('utf-8')

        // Check if it looks like a pool key (contains slashes)
        if (firstArg.includes('/')) {
          return {
            pool_key: firstArg,
            method: method
          }
        }
      } catch (error) {
        console.error('Error parsing add_liquidity_single_token args:', error)
        // Failed to parse hex, continue with other parsing attempts
      }
    }

    // Special handling for create_liquidity_pool from DozerTools
    // This method exists in DozerTools blueprint and creates initial liquidity
    if (method === 'create_liquidity_pool') {
      // The pool key can't be extracted since the pool doesn't exist yet
      // Wallet-lib should handle parsing this method with the correct blueprint
      return {
        method: 'create_pool', // Display as create_pool for consistency
      }
    }

    // Special handling for swap through path methods
    if (method === 'swap_exact_tokens_for_tokens_through_path' ||
        method === 'swap_tokens_for_exact_tokens_through_path') {
      try {
        const buffer = Buffer.from(ncArgs, 'hex')

        if (buffer.length < 3) {
          return null
        }

        // Read arg count (LEB128)
        const [argCount, afterArgCount] = readLEB128(buffer, 0)

        if (argCount < 1) {
          return null
        }

        // Read string length (LEB128)
        const [stringLength, afterLength] = readLEB128(buffer, afterArgCount)

        if (buffer.length < afterLength + stringLength) {
          return null
        }

        // Extract path string
        let pathStr = buffer.slice(afterLength, afterLength + stringLength).toString('utf-8')

        // Clean up any control characters that might have been included
        // eslint-disable-next-line no-control-regex
        pathStr = pathStr.replace(/[\x00-\x1F]/g, '')

        // The path format is: pool1,pool2,pool3
        // where each pool is token0/token1/fee
        return {
          path_str: pathStr,
          method: method
        }
      } catch (error) {
        console.error(`Error parsing ${method} args:`, error)
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
