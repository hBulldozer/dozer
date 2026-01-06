import { z } from 'zod'

import { fetchNodeData } from '../../helpers/fetchFunction'
import { procedure } from '../../trpc'
import { parseNanoContractArgs } from '../../utils/ncArgsParser'
import { parseNCLogs } from '../../utils/ncLogParser'
import { fetchFromPoolManager, fetchTokenInfo } from './helpers'

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

export type TransactionHistory = {
  hash: string
  timestamp: number
  method: string
  context: {
    actions: {
      type: string
      token_uid: string
      amount: number
    }[]
    address: string
    timestamp: number
  }
}

export const transactionProcedures = {
  // Get transaction history for a pool
  transactionHistory: procedure.input(z.object({ poolKey: z.string() })).query(async ({ input }) => {
    try {
      // Get transaction history from the nano contract history endpoint
      const endpoint = 'nano_contract/history'
      const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `count=50`]

      const response = await fetchNodeData(endpoint, queryParams)

      if (!response || !response.success || !response.history) {
        return []
      }

      // Filter transactions related to this specific pool
      const poolTransactions: TransactionHistory[] = response.history
        .filter((tx: any) => {
          // Check if the transaction context mentions this pool key
          return tx.nc_context && JSON.stringify(tx.nc_context).includes(input.poolKey)
        })
        .map((tx: any) => ({
          hash: tx.hash,
          timestamp: tx.timestamp,
          method: tx.nc_method,
          context: tx.nc_context,
        }))

      return poolTransactions
    } catch (error) {
      console.error(`Error fetching transaction history for ${input.poolKey}:`, error)
      return []
    }
  }),

  // Get transaction status
  getTxStatus: procedure
    .input(
      z.object({
        hash: z.string(),
        chainId: z.number(),
      })
    )
    .query(async ({ input }) => {
      if (input.hash === 'Error') {
        return { validation: 'failed', message: 'txHash not defined', hash: input.hash }
      }

      try {
        const endpoint = 'transaction'
        const queryParams = [`id=${input.hash}`, 'include_nc_logs=true']
        const response = await fetchNodeData(endpoint, queryParams)

        if (!response || !response.success) {
          return {
            validation: 'failed',
            message: 'Transaction not found',
            hash: input.hash,
          }
        }

        // Parse NC logs for detailed errors (only if transaction failed)
        let parsedError = null

        // Check transaction status from metadata
        const meta = response.meta
        const isVoided = meta?.voided_by && Array.isArray(meta.voided_by) && meta.voided_by.length > 0
        const isConfirmed = meta?.first_block && meta.first_block !== null

        // Only parse error logs if transaction is voided
        if (isVoided && response.nc_logs) {
          parsedError = parseNCLogs(response.nc_logs)
        }

        const validation = isVoided ? 'failed' : isConfirmed ? 'success' : 'pending'

        // Build response message
        let message = ''
        if (validation === 'success') {
          message = 'Transaction confirmed'
        } else if (validation === 'pending') {
          message = 'Transaction pending confirmation'
        } else {
          // Use parsed error message if available
          message = parsedError ? parsedError.userMessage : 'Transaction failed: Low Slippage.'
        }

        return {
          validation,
          message,
          hash: input.hash,
          error: parsedError || undefined,
        }
      } catch (error) {
        console.error('Error checking transaction status for', input.hash, ':', error)
        return { validation: 'failed', message: 'Error checking transaction status', hash: input.hash }
      }
    }),

  // Get all transaction history for debugging and analysis
  getAllTransactionHistory: procedure
    .input(
      z.object({
        count: z.number().min(1).max(500).optional().default(100),
        after: z.string().optional(),
        before: z.string().optional(),
        methodFilter: z.string().optional(),
        poolFilter: z.string().optional(),
        tokenFilter: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Build query parameters following the nano contract history API
        const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `count=${input.count}`]

        if (input.after) queryParams.push(`after=${input.after}`)
        if (input.before) queryParams.push(`before=${input.before}`)

        const endpoint = 'nano_contract/history'
        const response = await fetchNodeData(endpoint, queryParams)

        if (!response || !response.success || !response.history) {
          return {
            transactions: [],
            hasMore: false,
            pagination: { after: null, before: null },
          }
        }

        // Parse and filter transactions properly
        const filteredTransactions = []
        for (const tx of response.history) {
          // Apply method filter first (simple check)
          if (input.methodFilter && tx.nc_method !== input.methodFilter) {
            continue
          }

          // For pool filtering, we'll defer to the full transaction parsing
          // and apply the same logic that was working on the client side
          // This will be done after tokensInvolved is populated

          // Token filter (check if transaction involves the token)
          if (input.tokenFilter) {
            const involvesToken =
              (tx.tokens && tx.tokens.includes(input.tokenFilter)) ||
              (tx.outputs &&
                tx.outputs.some(
                  (output: any) =>
                    output.token === input.tokenFilter || (output.token_data === 0 && input.tokenFilter === '00')
                )) ||
              (tx.inputs &&
                tx.inputs.some(
                  (input: any) =>
                    input.token === input.tokenFilter || (input.token_data === 0 && input.tokenFilter === '00')
                ))

            if (!involvesToken) {
              continue
            }
          }

          filteredTransactions.push(tx)
        }

        // Parse and enrich transaction data with async processing
        const allTransactions = await Promise.all(
          filteredTransactions.map(async (tx: any) => {
            let args: any = null

            // PREFER nc_args_decoded if available (new Hathor-core API)
            if (tx.nc_args_decoded) {
              args = tx.nc_args_decoded
            }
            // FALLBACK to manual parsing for backwards compatibility
            else if (tx.nc_args && typeof tx.nc_args === 'string' && tx.nc_method) {
              try {
                const parsedArgs = await parseNanoContractArgs(
                  process.env.NEXT_PUBLIC_POOL_MANAGER_BLUEPRINT_ID || '',
                  tx.nc_method,
                  tx.address || '',
                  tx.nc_args
                )
                args = parsedArgs
              } catch (error) {
                console.warn(`Failed to parse NC args for tx ${tx.tx_id}:`, error)
                args = typeof tx.nc_args === 'object' ? tx.nc_args : {}
              }
            }
            // FALLBACK if nc_args is already an object
            else {
              args = typeof tx.nc_args === 'object' ? tx.nc_args : {}
            }

            // Analyze transaction for multi-hop routing
            const isMultiHop = args.path_str && typeof args.path_str === 'string' && args.path_str.includes(',')

            // Extract pool information from transaction args
            let poolsInvolved: string[] = []
            let tokensInvolved: string[] = []

            // Extract tokens from transaction outputs using proper Hathor format
            const tokensFromOutputs = new Set<string>()

            if (tx.outputs && Array.isArray(tx.outputs)) {
              tx.outputs.forEach((output: any) => {
                if (output.token_data !== undefined) {
                  const tokenIndex = output.token_data & 0b01111111 // Lower 7 bits
                  const isAuthority = (output.token_data & 0b10000000) !== 0 // Highest bit

                  // Skip authority outputs for token extraction
                  if (!isAuthority) {
                    if (tokenIndex === 0) {
                      // Index 0 is always HTR
                      tokensFromOutputs.add('00')
                    } else if (tx.tokens && tx.tokens[tokenIndex - 1]) {
                      // Other tokens map to tokens array (index - 1)
                      tokensFromOutputs.add(tx.tokens[tokenIndex - 1])
                    }
                  }
                }
              })
            }

            // For multi-hop swaps, also extract tokens from the routing path in args
            const tokensFromArgs = new Set<string>()
            if (args) {
              // Extract tokens from pool path for multi-hop swaps
              // Format: pool1,pool2,pool3 where each pool is {uuid}/{uuid}/{fee}
              const pathStr = args.path_str || args.path // Support both parsed and legacy formats
              if (pathStr && typeof pathStr === 'string') {
                const pools = pathStr.split(',')

                pools.forEach((poolKey) => {
                  const pathParts = poolKey.split('/')
                  if (pathParts.length >= 3) {
                    const tokenA = pathParts[0]
                    const tokenB = pathParts[1]

                    if (tokenA && tokenA.trim()) {
                      tokensFromArgs.add(tokenA)
                    }
                    if (tokenB && tokenB.trim()) {
                      tokensFromArgs.add(tokenB)
                    }
                  }
                })
              }

              // Also check for direct token arguments
              if (args.token_in) {
                tokensFromArgs.add(args.token_in)
              }
              if (args.token_out) {
                tokensFromArgs.add(args.token_out)
              }
              if (args.token_a) {
                tokensFromArgs.add(args.token_a)
              }
              if (args.token_b) {
                tokensFromArgs.add(args.token_b)
              }
            }

            // Also extract tokens from nc_context.actions for single token operations
            // This ensures we capture the deposited token even if it doesn't appear in outputs
            const tokensFromActions = new Set<string>()
            if (tx.nc_context?.actions && Array.isArray(tx.nc_context.actions)) {
              tx.nc_context.actions.forEach((action: { type: string; token_uid: string; amount: number }) => {
                if (action.token_uid) {
                  tokensFromActions.add(action.token_uid)
                }
              })
            }

            // Combine tokens from outputs, arguments, and actions
            const allTokens = new Set([...tokensFromOutputs, ...tokensFromArgs, ...tokensFromActions])
            tokensInvolved = Array.from(allTokens)

            // Fetch token symbols for display
            const tokenSymbolPromises = tokensInvolved.map(async (tokenUuid) => {
              try {
                const tokenInfo = await fetchTokenInfo(tokenUuid)
                return {
                  uuid: tokenUuid,
                  symbol: tokenInfo.symbol,
                  name: tokenInfo.name,
                }
              } catch {
                // Fallback for failed token info fetch
                return {
                  uuid: tokenUuid,
                  symbol: tokenUuid === '00' ? 'HTR' : tokenUuid.substring(0, 8).toUpperCase(),
                  name: tokenUuid === '00' ? 'Hathor' : `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
                }
              }
            })

            const tokenSymbols = await Promise.all(tokenSymbolPromises)

            // Extract pool information from parsed args
            if (args && Object.keys(args).length > 0) {
              // For swap transactions, check for path (multi-hop)
              const pathStr = args.path_str || args.path // Support both parsed and legacy formats
              if (tx.nc_method && tx.nc_method.includes('swap') && pathStr && typeof pathStr === 'string') {
                // Parse the path format: pool1,pool2,pool3 (comma-separated)
                // Trim each pool key to remove any whitespace
                poolsInvolved = pathStr
                  .split(',')
                  .map((pool) => pool.trim())
                  .filter((pool) => pool)
              }

              // For liquidity transactions, extract single pool
              if (
                tx.nc_method &&
                (tx.nc_method.includes('add_liquidity') || tx.nc_method.includes('remove_liquidity')) &&
                args.pool_key
              ) {
                poolsInvolved = [args.pool_key]
              }

              // For pool creation, extract tokens from arguments
              if (tx.nc_method && tx.nc_method.includes('create_pool') && args.token_a && args.token_b) {
                // Construct pool key for display
                if (args.fee !== undefined) {
                  poolsInvolved = [`${args.token_a}/${args.token_b}/${args.fee}`]
                }
              }
            }

            // For single-pool swaps without path_str, derive pool from nc_context.actions
            // This handles swap_exact_tokens_for_tokens and similar methods that operate on a single pool
            if (
              tx.nc_method &&
              tx.nc_method.includes('swap') &&
              poolsInvolved.length === 0 &&
              tx.nc_context?.actions &&
              Array.isArray(tx.nc_context.actions)
            ) {
              // Extract tokens from actions (deposit = token sold, withdrawal = token bought)
              const actionTokens = new Set<string>()
              tx.nc_context.actions.forEach((action: { type: string; token_uid: string; amount: number }) => {
                if (action.token_uid) {
                  actionTokens.add(action.token_uid)
                }
              })

              // If we have exactly 2 tokens, try to find the matching pool
              if (actionTokens.size === 2) {
                const tokenArray = Array.from(actionTokens)
                // Get fee from args if available (decoded args have fee at index 0 for swap methods)
                const fee = Array.isArray(args) ? args[0] : args.fee || 8 // Default to 8 basis points if not found

                // Try both token orderings to find the correct pool key
                // Pool keys are typically ordered by token UUID
                const [tokenA, tokenB] = tokenArray.sort()
                const potentialPoolKey = `${tokenA}/${tokenB}/${fee}`

                // Add to poolsInvolved
                poolsInvolved = [potentialPoolKey]
              }
            }

            // For add_liquidity and remove_liquidity without pool_key, derive pool from nc_context.actions
            // This handles regular add_liquidity/remove_liquidity methods that only pass a fee parameter
            if (
              tx.nc_method &&
              (tx.nc_method.includes('add_liquidity') || tx.nc_method.includes('remove_liquidity')) &&
              poolsInvolved.length === 0 &&
              tx.nc_context?.actions &&
              Array.isArray(tx.nc_context.actions)
            ) {
              // Extract tokens from actions (for liquidity operations, tokens are deposited/withdrawn)
              const actionTokens = new Set<string>()
              tx.nc_context.actions.forEach((action: { type: string; token_uid: string; amount: number }) => {
                if (action.token_uid) {
                  actionTokens.add(action.token_uid)
                }
              })

              // Special handling for single token operations
              // For single token ops, nc_args_decoded has [other_token_uid, pool_id]
              // and nc_context.actions has only the deposited token
              const isSingleTokenMethod =
                tx.nc_method === 'add_liquidity_single_token' || tx.nc_method === 'remove_liquidity_single_token'

              if (isSingleTokenMethod && actionTokens.size === 1 && Array.isArray(args) && args.length >= 2) {
                // args[0] = the "other" token in the pool (not the deposited one)
                // args[1] = pool ID
                const depositedToken = Array.from(actionTokens)[0]
                const otherToken = typeof args[0] === 'string' ? args[0] : String(args[0])
                const poolId = typeof args[1] === 'number' ? args[1] : 8

                // Both tokens should be added to tokensInvolved (with type guard)
                if (depositedToken && !tokensInvolved.includes(depositedToken)) {
                  tokensInvolved.push(depositedToken)
                }
                if (otherToken && !tokensInvolved.includes(otherToken)) {
                  tokensInvolved.push(otherToken)
                }

                // Construct pool key with both tokens sorted (with type guard)
                if (depositedToken && otherToken) {
                  const [tokenA, tokenB] = [depositedToken, otherToken].sort()
                  const potentialPoolKey = `${tokenA}/${tokenB}/${poolId}`
                  poolsInvolved = [potentialPoolKey]
                }
              }
              // If we have exactly 2 tokens, construct the pool key
              else if (actionTokens.size === 2) {
                const tokenArray = Array.from(actionTokens)
                // Get fee from parsed args (for add_liquidity, this is the main parameter)
                // The nc_args for add_liquidity is typically just the fee value
                let fee = 8 // Default to 8 basis points

                // Try to extract fee from different possible formats
                if (args && typeof args === 'object') {
                  if ('fee' in args && typeof args.fee === 'number') {
                    fee = args.fee
                  } else if (Array.isArray(args) && args.length > 0 && typeof args[0] === 'number') {
                    fee = args[0]
                  }
                } else if (typeof args === 'number') {
                  fee = args
                }

                // Fallback: Try to extract fee from raw nc_args hex string if parsing failed
                // Format: 0108 = [arg_count:01][fee_value:08]
                if (fee === 8 && tx.nc_args && typeof tx.nc_args === 'string' && tx.nc_args.length >= 4) {
                  try {
                    // Skip first byte (arg count), read second byte as fee
                    const feeHex = tx.nc_args.substring(2, 4)
                    const parsedFee = parseInt(feeHex, 16)
                    if (!isNaN(parsedFee) && parsedFee > 0) {
                      fee = parsedFee
                    }
                  } catch (error) {
                    // Keep default fee if parsing fails
                  }
                }

                // Pool keys are ordered by token UUID
                const [tokenA, tokenB] = tokenArray.sort()
                const potentialPoolKey = `${tokenA}/${tokenB}/${fee}`

                // Add to poolsInvolved
                poolsInvolved = [potentialPoolKey]
              }
            }

            return {
              id: tx.tx_id, // Required by GenericTable
              tx_id: tx.tx_id,
              timestamp: tx.timestamp,
              method: tx.nc_method,
              args: args, // Use parsed args instead of raw nc_args
              rawArgs: tx.nc_args, // Keep original for debugging
              poolsInvolved,
              tokensInvolved,
              tokenSymbols, // Include resolved token symbols
              isMultiHop,
              weight: tx.weight,
              success: !tx.is_voided,
              // Include nc_context.actions for accurate amount calculation
              // These are the actual deposit/withdrawal amounts, not the raw UTXO values
              ncActions: tx.nc_context?.actions || [],
              // Include full transaction data for debugging
              debug: {
                fullTx: tx,
                inputs: tx.inputs,
                outputs: tx.outputs,
                parents: tx.parents,
                parsedArgs: args,
                // Add debug info for token extraction only for multi-hop
                ...(isMultiHop && args.path_str
                  ? {
                      tokensFromOutputs: Array.from(tokensFromOutputs),
                      tokensFromArgs: Array.from(tokensFromArgs),
                      pathString: args.path_str,
                      pathPools: args.path_str.split(','),
                    }
                  : {}),
              },
            }
          })
        )

        // Apply pool filtering using the same logic that was working on the client side
        let transactions = allTransactions
        if (input.poolFilter) {
          const poolFilter = input.poolFilter // Store in const to satisfy TypeScript
          transactions = allTransactions.filter((tx) => {
            // First, check if we have explicit pool information from parsed args
            if (tx.poolsInvolved && tx.poolsInvolved.length > 0) {
              // For transactions with explicit pool information, check if our target pool is involved
              const isPoolInvolved = tx.poolsInvolved.includes(poolFilter)

              // When we have explicit pool info, trust it and don't fall back to token-based filtering
              // This prevents transactions from appearing in wrong pools
              return isPoolInvolved
            }

            // Fallback to token-based filtering for transactions without explicit pool info
            // Extract pool tokens from pool key (format: tokenA/tokenB/fee)
            const poolParts = poolFilter.split('/')
            if (poolParts.length >= 2) {
              const poolToken0 = poolParts[0]
              const poolToken1 = poolParts[1]

              const tokensInvolved = tx.tokensInvolved || []
              const hasToken0 = poolToken0 ? tokensInvolved.includes(poolToken0) : false
              const hasToken1 = poolToken1 ? tokensInvolved.includes(poolToken1) : false

              // For regular operations, we need both tokens to be involved
              // For single token operations, we only need one of the pool's tokens
              const isSingleTokenOperation =
                tx.method === 'add_liquidity_single_token' || tx.method === 'remove_liquidity_single_token'

              if (isSingleTokenOperation) {
                // Single token operations only need one of the pool's tokens
                return hasToken0 || hasToken1
              } else {
                // Regular operations need both tokens
                return hasToken0 && hasToken1
              }
            }

            return false
          })
        }

        return {
          transactions,
          hasMore: response.has_more || false,
          pagination: {
            after: response.after || null,
            before: response.before || null,
          },
        }
      } catch (error) {
        console.error('Error fetching all transaction history:', error)
        return {
          transactions: [],
          hasMore: false,
          pagination: { after: null, before: null },
        }
      }
    }),
}
