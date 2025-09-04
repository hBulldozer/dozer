import { SimpleTransaction } from '../components/SimplePoolTransactionHistory'

// Helper function to format time
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp

  if (diff < 60) return `${Math.floor(diff)} seconds`
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours`
  return `${Math.floor(diff / 86400)} days`
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

// Transform complex transaction to simple format
export function transformToSimpleTransaction(
  complexTx: ComplexTransaction,
  pricesUSD?: Record<string, number>
): SimpleTransaction {
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

  // Determine transaction type
  let type: 'Swap' | 'Add' | 'Remove' | 'Create' = 'Swap'
  if (complexTx.method.includes('add_liquidity')) type = 'Add'
  else if (complexTx.method.includes('remove_liquidity')) type = 'Remove'
  else if (complexTx.method.includes('create_pool')) type = 'Create'
  else if (complexTx.method.includes('swap')) type = 'Swap'

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
      const token0Info = tokenSymbols.find(t => t.uuid === poolToken0)
      const token1Info = tokenSymbols.find(t => t.uuid === poolToken1)
      
      if (token0Info && token1Info) {
        token0Symbol = token0Info.symbol
        token1Symbol = token1Info.symbol
        tokenPair = `${token0Symbol}/${token1Symbol}`
      } else {
        // Fallback to original logic if pool info not available
        token0Symbol = tokenSymbols[0].symbol
        token1Symbol = tokenSymbols[1].symbol
        tokenPair = `${token0Symbol}/${token1Symbol}`
      }
    } else {
      // Fallback to original logic if no pool information
      token0Symbol = tokenSymbols[0].symbol
      token1Symbol = tokenSymbols[1].symbol
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
        if (spentSymbol === token0Symbol) {
          token0Amount = spentAmount
          token1Amount = receivedAmount
        } else {
          token0Amount = receivedAmount
          token1Amount = spentAmount
        }
        // Simplified HTR-based Buy/Sell logic
        const HTR_UUID = '00'
        const bridgedTokenUuids = process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',') || []
        
        // Check if this pool involves a bridged token
        const hasBridgedToken = bridgedTokenUuids.some(bridgedUuid => 
          spentToken === bridgedUuid || receivedToken === bridgedUuid
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

      if (outputAddress === senderAddress) {
        // This is change back to the sender
        changeOutputsByToken[token] = (changeOutputsByToken[token] || 0) + output.value
      } else {
        // This is actual output (not change)
        outputsByToken[token] = (outputsByToken[token] || 0) + output.value
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

        // Token 0
        const token0Uuid = tokenSymbols[0]?.uuid || ''
        if (token0Uuid) {
          const inputAmount = inputsByToken[token0Uuid] || 0
          const changeAmount = changeOutputsByToken[token0Uuid] || 0
          a0 = (inputAmount - changeAmount) / 100
        }

        // Token 1
        const token1Uuid = tokenSymbols[1]?.uuid || ''
        if (token1Uuid) {
          const inputAmount = inputsByToken[token1Uuid] || 0
          const changeAmount = changeOutputsByToken[token1Uuid] || 0
          a1 = (inputAmount - changeAmount) / 100
        }

        token0Amount = a0 > 0 ? a0 : null
        token1Amount = a1 > 0 ? a1 : null
      }
      side = 'Add'
      totalValueUSD = totalUSD
    } else if (type === 'Remove') {
      // For remove liquidity, show net amounts (outputs - change)
      const amounts_list: string[] = []
      let totalUSD = 0

      // Calculate net amounts for each token
      const allTokens = new Set([...Object.keys(outputsByToken), ...Object.keys(changeOutputsByToken)])
      allTokens.forEach((token) => {
        const outputAmount = outputsByToken[token] || 0
        const changeAmount = changeOutputsByToken[token] || 0
        const netAmount = (outputAmount - changeAmount) / 100

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

        // Token 0
        const token0Uuid = tokenSymbols[0]?.uuid || ''
        if (token0Uuid) {
          const outputAmount = outputsByToken[token0Uuid] || 0
          const changeAmount = changeOutputsByToken[token0Uuid] || 0
          a0 = (outputAmount - changeAmount) / 100
        }

        // Token 1
        const token1Uuid = tokenSymbols[1]?.uuid || ''
        if (token1Uuid) {
          const outputAmount = outputsByToken[token1Uuid] || 0
          const changeAmount = changeOutputsByToken[token1Uuid] || 0
          a1 = (outputAmount - changeAmount) / 100
        }

        token0Amount = a0 > 0 ? a0 : null
        token1Amount = a1 > 0 ? a1 : null
      }
      side = 'Remove'
      totalValueUSD = totalUSD
    }
  }

  // For create pool transactions, show pool creation info
  if (type === 'Create') {
    if (tokenSymbols.length >= 2) {
      amounts = `Pool: ${tokenSymbols[0].symbol}/${tokenSymbols[1].symbol}`
      token0Symbol = tokenSymbols[0].symbol
      token1Symbol = tokenSymbols[1].symbol
      side = 'Create'
    } else {
      amounts = 'Pool created'
    }
  }

  return {
    id: complexTx.id,
    hash: complexTx.tx_id,
    timestamp: complexTx.timestamp,
    timeAgo: formatTimeAgo(complexTx.timestamp),
    type,
    tokenPair,
    amounts,
    token0Symbol,
    token1Symbol,
    token0Amount,
    token1Amount,
    side,
    totalValue: totalValueUSD > 0 ? `$${totalValueUSD.toFixed(2)}` : undefined,
    account: senderAddress,
    success: complexTx.success,
    explorerUrl: `https://explorer.hathor.network/transaction/${complexTx.tx_id}`,
  }
}

// Transform array of complex transactions
export function transformTransactions(
  complexTransactions: ComplexTransaction[],
  pricesUSD?: Record<string, number>
): SimpleTransaction[] {
  return complexTransactions.map((tx) => transformToSimpleTransaction(tx, pricesUSD))
}
