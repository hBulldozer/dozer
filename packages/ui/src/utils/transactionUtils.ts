import { SimpleTransaction } from '../components/SimplePoolTransactionHistory'

// Helper function to format time with proper singular/plural forms
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp

  if (diff < 60) {
    const seconds = Math.floor(diff)
    return seconds === 1 ? '1 second' : `${seconds} seconds`
  }

  if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  const days = Math.floor(diff / 86400)
  return days === 1 ? '1 day' : `${days} days`
}

// Helper function to truncate address
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (address.length <= startLength + endLength + 3) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

// Original complex transaction structure from API
interface ComplexTransaction {
  id: string
  tx_id: string
  timestamp: number
  method: string
  poolsInvolved?: string[]
  tokensInvolved?: string[]
  tokenSymbols?: Array<{ uuid: string; symbol: string; name: string }>
  success: boolean
  weight: number
  debug?: {
    fullTx?: {
      inputs?: Array<{
        value: number
        token_data?: number
        decoded?: {
          address?: string
        }
        token?: string
      }>
      outputs?: Array<{
        value: number
        token_data?: number
        decoded?: {
          address?: string
        }
        token?: string
      }>
      tokens?: string[]
    }
  }
}

// Helper function to format USD amounts with proper formatting for large numbers
const formatUSD = (amount: number): string => {
  if (amount >= 1000000) {
    // For millions and above, show in millions with 2 decimal places
    return `$${(amount / 1000000).toFixed(2)}M`
  } else if (amount >= 1000) {
    // For thousands and above, show with commas
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else {
    // For smaller amounts, show with 2 decimal places
    return `$${amount.toFixed(2)}`
  }
}

// Transform complex transaction to simple format
export function transformToSimpleTransaction(
  complexTx: ComplexTransaction,
  pricesUSD?: Record<string, number>,
  currentPoolKey?: string
): SimpleTransaction | null {

  // Filter out administrative methods that shouldn't appear in transaction history
  const excludedMethods = ['sign_pool', 'set_htr_usd_pool']
  if (excludedMethods.includes(complexTx.method)) {
    return null
  }
  // Extract wallet address - different logic for different transaction types
  let senderAddress = 'Unknown'

  if (complexTx.method.includes('remove_liquidity')) {
    // For remove liquidity, the address is where the output tokens are being sent
    const firstOutput = complexTx.debug?.fullTx?.outputs?.[0]?.decoded?.address
    if (firstOutput) {
      senderAddress = firstOutput
    }
  } else {
    // For other transactions (swap, add_liquidity), use the input address
    senderAddress = complexTx.debug?.fullTx?.inputs?.[0]?.decoded?.address || 'Unknown'
  }

  // Determine transaction type with specific support for single token methods
  let type: 'Swap' | 'Add' | 'Remove' | 'Create' = 'Swap'
  if (complexTx.method === 'add_liquidity_single_token') type = 'Add'
  else if (complexTx.method === 'remove_liquidity_single_token') type = 'Remove'
  else if (complexTx.method.includes('add_liquidity')) type = 'Add'
  else if (complexTx.method.includes('remove_liquidity')) type = 'Remove'
  else if (complexTx.method.includes('create_pool')) type = 'Create'
  else if (complexTx.method.includes('swap_exact_tokens_for_tokens_through_path')) {
    // Multi-hop swaps are now supported - display as Swap type
    type = 'Swap'
  } else if (complexTx.method.includes('swap_tokens_for_exact_tokens_through_path')) {
    // Multi-hop swaps are now supported - display as Swap type
    type = 'Swap'
  } else if (complexTx.method.includes('swap')) type = 'Swap'


  // Extract token information
  const tokenSymbols = complexTx.tokenSymbols || []
  const inputs = complexTx.debug?.fullTx?.inputs || []
  const outputs = complexTx.debug?.fullTx?.outputs || []

  // Build token pair and amounts
  let tokenPair = 'Unknown'
  let amounts = 'Unknown'
  let totalValueUSD = 0
  let token0Symbol: string | undefined
  let token1Symbol: string | undefined
  let token0Amount: number | null | undefined = null
  let token1Amount: number | null | undefined = null
  let side: 'Buy' | 'Sell' | 'Add' | 'Remove' | 'Create' | 'Unknown' = 'Unknown'


  if (tokenSymbols.length >= 2) {
    // Determine correct token0/token1 order based on pool structure
    // Pool keys in Dozer follow the format: token0_uuid/token1_uuid/fee
    // We need to respect this order for correct Buy/Sell classification

    // Try to find pool information from transaction to get correct token order
    let poolKey = ''
    if (complexTx.poolsInvolved && complexTx.poolsInvolved.length > 0) {
      poolKey = complexTx.poolsInvolved[0]
    }

    if (poolKey) {
      // Extract token UUIDs from pool key: token0/token1/fee
      const [poolToken0, poolToken1] = poolKey.split('/')

      // Find token symbols based on correct pool order
      const token0Info = tokenSymbols.find((t) => t.uuid === poolToken0)
      const token1Info = tokenSymbols.find((t) => t.uuid === poolToken1)

      if (token0Info && token1Info) {
        token0Symbol = token0Info.symbol
        token1Symbol = token1Info.symbol
        tokenPair = `${token0Symbol}/${token1Symbol}`
      } else {
        // For single token operations, we might not have both tokens in tokenSymbols
        // Use pool token UUIDs to determine symbols, with fallback for missing tokens
        token0Symbol = token0Info?.symbol || (poolToken0 === '00' ? 'HTR' : poolToken0.substring(0, 8).toUpperCase())
        token1Symbol = token1Info?.symbol || (poolToken1 === '00' ? 'HTR' : poolToken1.substring(0, 8).toUpperCase())
        tokenPair = `${token0Symbol}/${token1Symbol}`
      }
    } else {
      // Fallback to original logic if no pool information
      token0Symbol = tokenSymbols[0].symbol
      token1Symbol = tokenSymbols[1].symbol
      tokenPair = `${token0Symbol}/${token1Symbol}`
    }
  } else {
    // Handle single token operations or transactions with insufficient token info

    if (complexTx.poolsInvolved && complexTx.poolsInvolved.length > 0) {
      const poolKey = complexTx.poolsInvolved[0]
      const [poolToken0, poolToken1] = poolKey.split('/')


      // For single token operations, determine symbols based on pool tokens
      // even if we don't have all tokenSymbols
      const token0Info = tokenSymbols.find((t) => t.uuid === poolToken0)
      const token1Info = tokenSymbols.find((t) => t.uuid === poolToken1)

      token0Symbol = token0Info?.symbol || (poolToken0 === '00' ? 'HTR' : 'HUSDC')
      token1Symbol = token1Info?.symbol || (poolToken1 === '00' ? 'HTR' : 'HUSDC')
      tokenPair = `${token0Symbol}/${token1Symbol}`

    } else if (tokenSymbols.length >= 1) {
      // Fallback for other cases with at least one token
      token0Symbol = tokenSymbols[0]?.symbol
      token1Symbol = tokenSymbols[1]?.symbol || 'Unknown'
      tokenPair = `${token0Symbol}/${token1Symbol}`
    }
  }

  // For swaps, calculate net change (what was actually traded, accounting for change)
  if (type === 'Swap' && inputs.length > 0 && outputs.length > 0) {
    // Group inputs and outputs by token, accounting for change
    const inputsByToken: Record<string, number> = {}
    const outputsByToken: Record<string, number> = {}
    const changeOutputsByToken: Record<string, number> = {}

    // Process inputs
    inputs.forEach((input) => {
      const token = input.token || '00'
      inputsByToken[token] = (inputsByToken[token] || 0) + input.value
    })

    // Process outputs and identify change vs received tokens
    outputs.forEach((output) => {
      const token = output.token || '00'
      const outputAddress = output.decoded?.address

      if (outputAddress === senderAddress) {
        // Check if this is change (same token as input) or received token (different token)
        const hasInputForThisToken = inputsByToken[token] > 0

        if (hasInputForThisToken) {
          // This is change back to the sender (same token as input)
          changeOutputsByToken[token] = (changeOutputsByToken[token] || 0) + output.value
        } else {
          // This is a received token (different token than inputs)
          outputsByToken[token] = (outputsByToken[token] || 0) + output.value
        }
      } else {
        // This is actual output (not change)
        outputsByToken[token] = (outputsByToken[token] || 0) + output.value
      }
    })

    // Find what was spent and what was received (accounting for change)
    const allTokens = new Set([
      ...Object.keys(inputsByToken),
      ...Object.keys(outputsByToken),
      ...Object.keys(changeOutputsByToken),
    ])
    let spentToken = '',
      spentAmount = 0,
      receivedToken = '',
      receivedAmount = 0

    allTokens.forEach((token) => {
      const inputAmount = inputsByToken[token] || 0
      const outputAmount = outputsByToken[token] || 0
      const changeAmount = changeOutputsByToken[token] || 0

      // Net spent = input - change (what actually went out of user's wallet)
      const netSpent = inputAmount - changeAmount
      // Net received = output (what actually came into user's wallet)
      const netReceived = outputAmount

      if (netSpent > 0) {
        // Spent
        spentToken = token
        spentAmount = netSpent / 100 // Convert from cents
      }
      if (netReceived > 0) {
        // Received
        receivedToken = token
        receivedAmount = netReceived / 100 // Convert from cents
      }
    })

    // Get token symbols
    const spentSymbol =
      tokenSymbols.find((t) => t.uuid === spentToken)?.symbol ||
      (spentToken === '00' ? 'HTR' : spentToken.substring(0, 8).toUpperCase())
    const receivedSymbol =
      tokenSymbols.find((t) => t.uuid === receivedToken)?.symbol ||
      (receivedToken === '00' ? 'HTR' : receivedToken.substring(0, 8).toUpperCase())

    if (spentAmount > 0 && receivedAmount > 0) {
      amounts = `${spentAmount.toFixed(2)} ${spentSymbol} → ${receivedAmount.toFixed(2)} ${receivedSymbol}`
      // map amounts to token0/token1 for table
      if (token0Symbol && token1Symbol) {
        // For multi-hop swaps, only show amounts for tokens that are in THIS pool
        const isMultiHop =
          complexTx.method?.includes('through_path') || (complexTx.poolsInvolved && complexTx.poolsInvolved.length > 1)

        if (isMultiHop) {
          // For multi-hop swaps, only show amounts if one of the pool's tokens
          // is either the input or output of the overall transaction
          // Extract token UUIDs from the CURRENT pool (if provided), not just the first pool
          let poolToken0Uuid = '00'
          let poolToken1Uuid = '00'

          // Find which pool from poolsInvolved matches the current pool key
          let relevantPoolKey = complexTx.poolsInvolved?.[0] // Default to first pool
          if (currentPoolKey && complexTx.poolsInvolved) {
            const matchingPool = complexTx.poolsInvolved.find((poolKey) => poolKey === currentPoolKey)
            if (matchingPool) {
              relevantPoolKey = matchingPool
            }
          }

          if (relevantPoolKey) {
            const [uuid0, uuid1] = relevantPoolKey.split('/')
            poolToken0Uuid = uuid0 || '00'
            poolToken1Uuid = uuid1 || '00'
          }

          // Check if the spent token is in this pool
          if (spentToken === poolToken0Uuid) {
            token0Amount = spentAmount
            token1Amount = null
          } else if (spentToken === poolToken1Uuid) {
            token1Amount = spentAmount
            token0Amount = null
          }

          // Check if the received token is in this pool
          if (receivedToken === poolToken0Uuid) {
            token0Amount = receivedAmount
            token1Amount = token1Amount // Keep existing value if any
          } else if (receivedToken === poolToken1Uuid) {
            token1Amount = receivedAmount
            token0Amount = token0Amount // Keep existing value if any
          }
        } else {
          // For direct swaps, show both amounts normally
          if (spentSymbol === token0Symbol) {
            token0Amount = spentAmount
            token1Amount = receivedAmount
          } else {
            token0Amount = receivedAmount
            token1Amount = spentAmount
          }
        }
        // Simplified HTR-based Buy/Sell logic
        const HTR_UUID = '00'
        const bridgedTokenUuids = process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',') || []

        // Check if this pool involves a bridged token
        const hasBridgedToken = bridgedTokenUuids.some(
          (bridgedUuid) => spentToken === bridgedUuid || receivedToken === bridgedUuid
        )

        if (hasBridgedToken) {
          // For bridged tokens (hUSDC, etc.): HTR is the asset being bought/sold
          // Sending HTR = Sell HTR, Receiving HTR = Buy HTR
          if (spentToken === HTR_UUID) {
            side = 'Sell' // Selling HTR for bridged token
          } else if (receivedToken === HTR_UUID) {
            side = 'Buy' // Buying HTR with bridged token
          } else {
            side = 'Unknown'
          }
        } else {
          // For regular tokens (DZR, CTHOR, etc.): HTR is the reference currency
          // Sending HTR = Buy (buying other token with HTR)
          // Receiving HTR = Sell (selling other token for HTR)
          if (spentToken === HTR_UUID) {
            side = 'Buy' // Buying other token with HTR
          } else if (receivedToken === HTR_UUID) {
            side = 'Sell' // Selling other token for HTR
          } else {
            side = 'Unknown'
          }
        }
      }

      // Calculate USD value based on what was spent
      if (pricesUSD && pricesUSD[spentToken]) {
        totalValueUSD = spentAmount * pricesUSD[spentToken]
      }
    }
  }

  // For liquidity operations, calculate net amounts (accounting for change)
  if ((type === 'Add' || type === 'Remove') && tokenSymbols.length >= 1) {
    // Group inputs and outputs by token and address
    const inputsByToken: Record<string, number> = {}
    const outputsByToken: Record<string, number> = {}
    const changeOutputsByToken: Record<string, number> = {}

    // Process inputs
    inputs.forEach((input) => {
      const token = input.token || '00'
      inputsByToken[token] = (inputsByToken[token] || 0) + input.value
    })

    // Process outputs and identify change (outputs back to sender)
    outputs.forEach((output) => {
      const token = output.token || '00'
      const outputAddress = output.decoded?.address

      if (type === 'Remove') {
        // For Remove transactions, outputs to sender are the actual liquidity removal outputs
        if (outputAddress === senderAddress) {
          outputsByToken[token] = (outputsByToken[token] || 0) + output.value
        } else {
          // Any outputs to other addresses are considered change/fees
          changeOutputsByToken[token] = (changeOutputsByToken[token] || 0) + output.value
        }
      } else {
        // For Add transactions, outputs to sender are change
        if (outputAddress === senderAddress) {
          changeOutputsByToken[token] = (changeOutputsByToken[token] || 0) + output.value
        } else {
          outputsByToken[token] = (outputsByToken[token] || 0) + output.value
        }
      }
    })

    if (type === 'Add') {
      // For add liquidity, show net amounts (inputs - change)
      const amounts_list: string[] = []
      let totalUSD = 0

      // Calculate net amounts for each token
      const allTokens = new Set([...Object.keys(inputsByToken), ...Object.keys(changeOutputsByToken)])
      allTokens.forEach((token) => {
        const inputAmount = inputsByToken[token] || 0
        const changeAmount = changeOutputsByToken[token] || 0
        const netAmount = (inputAmount - changeAmount) / 100

        if (netAmount > 0) {
          const symbol =
            tokenSymbols.find((t) => t.uuid === token)?.symbol ||
            (token === '00' ? 'HTR' : token.substring(0, 8).toUpperCase())
          amounts_list.push(`${netAmount.toFixed(2)} ${symbol}`)

          if (pricesUSD && pricesUSD[token]) {
            totalUSD += netAmount * pricesUSD[token]
          }
        }
      })

      amounts = amounts_list.join(' + ')

      // For display, calculate net amounts for token0/token1
      if (token0Symbol && token1Symbol) {
        let a0 = 0,
          a1 = 0

        // Use pool information if available for better matching
        if (complexTx.poolsInvolved && complexTx.poolsInvolved.length > 0) {
          const currentPoolKey = complexTx.poolsInvolved[0]
          const [poolToken0, poolToken1] = currentPoolKey.split('/')

          // Token 0
          if (poolToken0) {
            const inputAmount = inputsByToken[poolToken0] || 0
            const changeAmount = changeOutputsByToken[poolToken0] || 0
            a0 = (inputAmount - changeAmount) / 100
          }

          // Token 1
          if (poolToken1) {
            const inputAmount = inputsByToken[poolToken1] || 0
            const changeAmount = changeOutputsByToken[poolToken1] || 0
            a1 = (inputAmount - changeAmount) / 100
          }
        } else {
          // Fallback: use tokenSymbols array
          const token0Uuid = tokenSymbols[0]?.uuid || ''
          if (token0Uuid) {
            const inputAmount = inputsByToken[token0Uuid] || 0
            const changeAmount = changeOutputsByToken[token0Uuid] || 0
            a0 = (inputAmount - changeAmount) / 100
          }

          const token1Uuid = tokenSymbols[1]?.uuid || ''
          if (token1Uuid) {
            const inputAmount = inputsByToken[token1Uuid] || 0
            const changeAmount = changeOutputsByToken[token1Uuid] || 0
            a1 = (inputAmount - changeAmount) / 100
          }
        }

        token0Amount = a0 > 0 ? a0 : null
        token1Amount = a1 > 0 ? a1 : null
      }
      side = 'Add'
      totalValueUSD = totalUSD
    } else if (type === 'Remove') {
      // For remove liquidity, show the actual outputs received
      const amounts_list: string[] = []
      let totalUSD = 0

      // Show actual outputs for each token
      Object.keys(outputsByToken).forEach((token) => {
        const outputAmount = outputsByToken[token] / 100

        if (outputAmount > 0) {
          const symbol =
            tokenSymbols.find((t) => t.uuid === token)?.symbol ||
            (token === '00' ? 'HTR' : token.substring(0, 8).toUpperCase())
          amounts_list.push(`${outputAmount.toFixed(2)} ${symbol}`)

          if (pricesUSD && pricesUSD[token]) {
            totalUSD += outputAmount * pricesUSD[token]
          }
        }
      })

      amounts = amounts_list.join(' + ')

      // For display, set token0/token1 amounts from actual outputs

      if (token0Symbol && token1Symbol) {

        // Use pool information if available for better matching
        if (complexTx.poolsInvolved && complexTx.poolsInvolved.length > 0) {
          const currentPoolKey = complexTx.poolsInvolved[0]
          const [poolToken0, poolToken1] = currentPoolKey.split('/')


          // Match outputs to pool tokens by UUID
          Object.keys(outputsByToken).forEach((tokenUuid) => {
            const outputAmount = outputsByToken[tokenUuid] / 100

            if (tokenUuid === poolToken0) {
              token0Amount = outputAmount
            } else if (tokenUuid === poolToken1) {
              token1Amount = outputAmount
            }
          })
        } else {
          // Fallback: use tokenSymbols array
          Object.keys(outputsByToken).forEach((tokenUuid) => {
            const outputAmount = outputsByToken[tokenUuid] / 100

            const tokenInfo = tokenSymbols.find((t) => t.uuid === tokenUuid)
            if (tokenInfo) {
              if (tokenInfo.symbol === token0Symbol) {
                token0Amount = outputAmount
              } else if (tokenInfo.symbol === token1Symbol) {
                token1Amount = outputAmount
              }
            }
          })
        }
      }
      side = 'Remove'
      totalValueUSD = totalUSD

    }
  }

  // For create pool transactions, show the tokens that were added during pool creation
  if (type === 'Create') {
    if (tokenSymbols.length >= 2) {
      token0Symbol = tokenSymbols[0].symbol
      token1Symbol = tokenSymbols[1].symbol

      // Calculate amounts from inputs (tokens added during pool creation)
      const amounts_list: string[] = []
      let totalUSD = 0

      // Process inputs to get the tokens added during pool creation
      inputs.forEach((input) => {
        const token = input.token || '00'
        const amount = input.value / 100

        if (amount > 0) {
          const symbol =
            tokenSymbols.find((t) => t.uuid === token)?.symbol ||
            (token === '00' ? 'HTR' : token.substring(0, 8).toUpperCase())
          amounts_list.push(`${amount.toFixed(2)} ${symbol}`)

          if (pricesUSD && pricesUSD[token]) {
            totalUSD += amount * pricesUSD[token]
          }
        }
      })

      amounts = amounts_list.length > 0 ? amounts_list.join(' + ') : `Pool: ${token0Symbol}/${token1Symbol}`

      // Set token amounts for table display
      const token0Uuid = tokenSymbols[0]?.uuid || ''
      const token1Uuid = tokenSymbols[1]?.uuid || ''

      if (token0Uuid) {
        const token0Input = inputs.find((input) => (input.token || '00') === token0Uuid)
        if (token0Input) {
          token0Amount = token0Input.value / 100
        }
      }

      if (token1Uuid) {
        const token1Input = inputs.find((input) => (input.token || '00') === token1Uuid)
        if (token1Input) {
          token1Amount = token1Input.value / 100
        }
      }

      side = 'Create'
      totalValueUSD = totalUSD
    } else {
      amounts = 'Pool created'
    }
  }

  // Check if this is a multi-hop swap
  const isMultiHop =
    complexTx.method?.includes('through_path') ||
    (complexTx.poolsInvolved && complexTx.poolsInvolved.length > 1)

  return {
    id: complexTx.id,
    hash: complexTx.tx_id,
    timestamp: complexTx.timestamp,
    timeAgo: formatTimeAgo(complexTx.timestamp),
    type,
    method: complexTx.method, // Pass through the original method name
    tokenPair,
    amounts,
    token0Symbol,
    token1Symbol,
    token0Amount,
    token1Amount,
    side,
    totalValue: totalValueUSD > 0 ? formatUSD(totalValueUSD) : undefined,
    account: senderAddress,
    success: complexTx.success,
    explorerUrl: `https://explorer.hathor.network/transaction/${complexTx.tx_id}`,
    isMultiHop,
  }
}

// Transform array of complex transactions
export function transformTransactions(
  complexTransactions: ComplexTransaction[],
  pricesUSD?: Record<string, number>,
  currentPoolKey?: string
): SimpleTransaction[] {
  return complexTransactions
    .map((tx) => transformToSimpleTransaction(tx, pricesUSD, currentPoolKey))
    .filter((tx): tx is SimpleTransaction => tx !== null)
}
