import { z } from 'zod'

import { procedure } from '../../trpc'
import {
  parseSwapPathInfo,
  parseSwapPathExactOutputInfo,
  parseUserProfitInfo,
  parseQuoteSingleTokenResult,
  parseQuoteRemoveSingleTokenResult,
} from '../../utils/namedTupleParsers'
import { fetchFromPoolManager, getTokenSymbol } from './helpers'

export const quoteProcedures = {
  // Get swap quote
  quote: procedure
    .input(
      z.object({
        amountIn: z.number(),
        tokenIn: z.string(),
        tokenOut: z.string(),
        maxHops: z.number().optional().default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        const amount = Math.round(input.amountIn * 100) // Convert to cents
        const response = await fetchFromPoolManager([
          `find_best_swap_path(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`,
        ])
        const pathInfoArray =
          response.calls[`find_best_swap_path(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`].value

        if (!pathInfoArray) {
          console.log(`❌ [QUOTE] No swap path found for ${input.tokenIn} → ${input.tokenOut}`)
          throw new Error('No swap path found')
        }

        // Parse the NamedTuple array to an object with proper property names
        const pathInfo = parseSwapPathInfo(pathInfoArray)

        // Extract pool path (comma-separated pool keys) and derive token path
        const poolPath = pathInfo.path || ''
        const poolKeys = poolPath ? poolPath.split(',') : []

        // Extract unique tokens from pool keys to build token path
        const tokenPath = []
        if (poolKeys.length > 0) {
          // Start with input token
          tokenPath.push(input.tokenIn)

          // Follow the path through each pool to build token sequence
          let currentToken = input.tokenIn
          for (const poolKey of poolKeys) {
            const [tokenA, tokenB] = poolKey.split('/')
            let nextToken = null

            if (tokenA && tokenA === currentToken && tokenB) {
              nextToken = tokenB
            } else if (tokenB && tokenB === currentToken && tokenA) {
              nextToken = tokenA
            }

            // Only add the next token if we found a valid transition
            if (nextToken && nextToken !== currentToken) {
              tokenPath.push(nextToken)
              currentToken = nextToken
            }
          }
        }

        return {
          path: tokenPath,
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountOut: (pathInfo.amount_out || 0) / 100,
          priceImpact: (pathInfo.price_impact || 0) / 100, // Convert from integer format (341 = 3.41%) to percentage
          route: tokenPath, // Keep for backward compatibility
          poolPath: poolPath, // Add the pool path for contract execution
        }
      } catch (error) {
        console.error('❌ [QUOTE] Error getting swap quote:', error)
        throw new Error('Failed to get swap quote')
      }
    }),

  // Exact output quote endpoint
  quoteExactOutput: procedure
    .input(
      z.object({
        amountOut: z.number(),
        tokenIn: z.string(),
        tokenOut: z.string(),
        maxHops: z.number().optional().default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        const amount = Math.round(input.amountOut * 100) // Convert to cents
        const response = await fetchFromPoolManager([
          `find_best_swap_path_exact_output(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`,
        ])

        const pathInfoArray =
          response.calls[
            `find_best_swap_path_exact_output(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`
          ].value

        if (!pathInfoArray) {
          console.log(`❌ [QUOTE EXACT OUTPUT] No swap path found for ${input.tokenIn} → ${input.tokenOut}`)
          throw new Error('No swap path found')
        }

        // Parse the NamedTuple array to an object with proper property names
        const pathInfo = parseSwapPathExactOutputInfo(pathInfoArray)

        // Extract pool path (comma-separated pool keys) and derive token path
        const poolPath = pathInfo.path || ''
        const poolKeys = poolPath ? poolPath.split(',') : []

        // Extract unique tokens from pool keys to build token path
        // For exact output, the pool path is returned in REVERSE order from contract
        const tokenPath = []
        if (poolKeys.length > 0) {
          // For exact output, reverse the pool keys to get forward path
          const reversedPoolKeys = [...poolKeys].reverse()

          // Start with input token
          tokenPath.push(input.tokenIn)

          // Follow the path through each pool to build token sequence
          let currentToken = input.tokenIn
          for (const poolKey of reversedPoolKeys) {
            const [tokenA, tokenB] = poolKey.split('/')
            let nextToken = null

            if (tokenA && tokenA === currentToken && tokenB) {
              nextToken = tokenB
            } else if (tokenB && tokenB === currentToken && tokenA) {
              nextToken = tokenA
            }

            // Only add the next token if we found a valid transition
            if (nextToken && nextToken !== currentToken) {
              tokenPath.push(nextToken)
              currentToken = nextToken
            }
          }
        }

        // For exact output, we need to reverse the poolPath for contract execution
        // The contract returns paths in reverse order, but expects them in forward order for execution
        const executionPoolPath = poolKeys.length > 0 ? [...poolKeys].reverse().join(',') : poolPath

        return {
          path: tokenPath,
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountIn: (pathInfo.amount_in || 0) / 100,
          priceImpact: (pathInfo.price_impact || 0) / 100, // Convert from integer format (341 = 3.41%) to percentage
          route: tokenPath, // Keep for backward compatibility
          poolPath: executionPoolPath, // Add the pool path for contract execution (reversed for exact output)
        }
      } catch (error) {
        console.error('❌ [QUOTE EXACT OUTPUT] Error getting exact output quote:', error)
        throw new Error('Failed to get exact output quote')
      }
    }),

  // Get add liquidity quote for exact input amount
  front_quote_add_liquidity_in: procedure
    .input(
      z.object({
        id: z.string(), // Pool ID (can be pool key or symbol ID)
        amount_in: z.number(),
        token_in: z.string(), // Token UUID
      })
    )
    .query(async ({ input }) => {
      try {
        // Detect if ID is symbol-based or pool key
        const isSymbolId = input.id.includes('-') && !input.id.includes('/')
        let poolKey: string

        if (isSymbolId) {
          // Convert symbol ID to pool key
          const parts = input.id.split('-')
          if (parts.length !== 3) {
            throw new Error('Invalid symbol ID format')
          }

          const [symbol0, symbol1, feeString] = parts
          const feeValue = parseFloat(feeString || '0')
          const feeBasisPoints = Math.round(feeValue * 10)

          // Get all signed pools to find the matching one
          const batchResponse = await fetchFromPoolManager(['get_signed_pools()'])
          const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []

          let matchingPoolKey: string | null = null
          for (const key of poolKeys) {
            const [tokenA, tokenB, feeStr] = key.split('/')
            const poolFeeBasisPoints = parseInt(feeStr || '0')

            if (poolFeeBasisPoints === feeBasisPoints) {
              const tokenASymbol = await getTokenSymbol(tokenA || '')
              const tokenBSymbol = await getTokenSymbol(tokenB || '')

              if (
                (tokenASymbol === symbol0 && tokenBSymbol === symbol1) ||
                (tokenASymbol === symbol1 && tokenBSymbol === symbol0)
              ) {
                matchingPoolKey = key
                break
              }
            }
          }

          if (!matchingPoolKey) {
            throw new Error(`Pool not found for symbol ID: ${input.id}`)
          }
          poolKey = matchingPoolKey
        } else {
          // Use the ID as pool key directly
          poolKey = input.id
        }

        // Validate input amount
        if (input.amount_in <= 0 || !isFinite(input.amount_in)) {
          throw new Error('Invalid amount_in value')
        }

        // Convert decimal amount to cents (Amount type expects integers)
        const amountInCents = Math.round(input.amount_in * 100)

        // Call the contract method with the pool key
        const response = await fetchFromPoolManager([
          `front_quote_add_liquidity_in(${amountInCents}, "${input.token_in}", "${poolKey}")`,
        ])

        const resultInCents =
          response.calls[`front_quote_add_liquidity_in(${amountInCents}, "${input.token_in}", "${poolKey}")`].value

        // Validate and convert result back from cents to decimal
        if (typeof resultInCents !== 'number' || !isFinite(resultInCents)) {
          throw new Error('Invalid response from contract')
        }

        const result = resultInCents / 100

        return result
      } catch (error) {
        console.error(`Error in front_quote_add_liquidity_in for ${input.id}:`, error)
        throw new Error(`Failed to get liquidity quote: ${error}`)
      }
    }),

  // Get add liquidity quote for exact output amount
  front_quote_add_liquidity_out: procedure
    .input(
      z.object({
        id: z.string(), // Pool ID (can be pool key or symbol ID)
        amount_out: z.number(),
        token_in: z.string(), // Token UUID
      })
    )
    .query(async ({ input }) => {
      try {
        // Detect if ID is symbol-based or pool key
        const isSymbolId = input.id.includes('-') && !input.id.includes('/')
        let poolKey: string

        if (isSymbolId) {
          // Convert symbol ID to pool key
          const parts = input.id.split('-')
          if (parts.length !== 3) {
            throw new Error('Invalid symbol ID format')
          }

          const [symbol0, symbol1, feeString] = parts
          const feeValue = parseFloat(feeString || '0')
          const feeBasisPoints = Math.round(feeValue * 10)

          // Get all signed pools to find the matching one
          const batchResponse = await fetchFromPoolManager(['get_signed_pools()'])
          const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []

          let matchingPoolKey: string | null = null
          for (const key of poolKeys) {
            const [tokenA, tokenB, feeStr] = key.split('/')
            const poolFeeBasisPoints = parseInt(feeStr || '0')

            if (poolFeeBasisPoints === feeBasisPoints) {
              const tokenASymbol = await getTokenSymbol(tokenA || '')
              const tokenBSymbol = await getTokenSymbol(tokenB || '')

              if (
                (tokenASymbol === symbol0 && tokenBSymbol === symbol1) ||
                (tokenASymbol === symbol1 && tokenBSymbol === symbol0)
              ) {
                matchingPoolKey = key
                break
              }
            }
          }

          if (!matchingPoolKey) {
            throw new Error(`Pool not found for symbol ID: ${input.id}`)
          }
          poolKey = matchingPoolKey
        } else {
          // Use the ID as pool key directly
          poolKey = input.id
        }

        // Validate input amount
        if (input.amount_out <= 0 || !isFinite(input.amount_out)) {
          throw new Error('Invalid amount_out value')
        }

        // Convert decimal amount to cents (Amount type expects integers)
        const amountOutCents = Math.round(input.amount_out * 100)

        // Call the contract method with the pool key
        const response = await fetchFromPoolManager([
          `front_quote_add_liquidity_out(${amountOutCents}, "${input.token_in}", "${poolKey}")`,
        ])

        const resultInCents =
          response.calls[`front_quote_add_liquidity_out(${amountOutCents}, "${input.token_in}", "${poolKey}")`].value

        // Validate and convert result back from cents to decimal
        if (typeof resultInCents !== 'number' || !isFinite(resultInCents)) {
          throw new Error('Invalid response from contract')
        }

        const result = resultInCents / 100

        return result
      } catch (error) {
        console.error(`Error in front_quote_add_liquidity_out for ${input.id}:`, error)
        throw new Error(`Failed to get liquidity quote: ${error}`)
      }
    }),

  // Get user profit info for a specific pool
  getUserProfitInfo: procedure
    .input(
      z.object({
        address: z.string(),
        poolKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetchFromPoolManager([`get_user_profit_info("${input.address}", "${input.poolKey}")`])
        const profitInfoArray = response.calls[`get_user_profit_info("${input.address}", "${input.poolKey}")`].value

        if (!profitInfoArray) {
          return {
            current_value_usd: 0,
            initial_value_usd: 0,
            profit_amount_usd: 0,
            profit_percentage: 0,
            last_action_timestamp: 0,
          }
        }

        // Parse the NamedTuple array to an object with proper property names
        const profitInfo = parseUserProfitInfo(profitInfoArray)

        return {
          current_value_usd: profitInfo.current_value_usd / 100, // Convert from cents
          initial_value_usd: profitInfo.initial_value_usd / 100, // Convert from cents
          profit_amount_usd: profitInfo.profit_amount_usd / 100, // Convert from cents
          profit_percentage: profitInfo.profit_percentage / 100, // Convert from percentage with 2 decimal places
          last_action_timestamp: profitInfo.last_action_timestamp,
        }
      } catch (error) {
        console.error(`Error fetching profit info for ${input.address} in pool ${input.poolKey}:`, error)
        throw new Error('Failed to fetch user profit information')
      }
    }),

  // Quote for adding liquidity with single token
  quoteSingleTokenLiquidity: procedure
    .input(
      z.object({
        tokenIn: z.string(),
        amountIn: z.number(),
        tokenOut: z.string(),
        fee: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const amountInCents = Math.round(input.amountIn * 100)
        const response = await fetchFromPoolManager([
          `quote_add_liquidity_single_token("${input.tokenIn}", ${amountInCents}, "${input.tokenOut}", ${
            input.fee * 10
          })`,
        ])
        const quoteArray =
          response.calls[
            `quote_add_liquidity_single_token("${input.tokenIn}", ${amountInCents}, "${input.tokenOut}", ${
              input.fee * 10
            })`
          ].value

        if (!quoteArray) {
          throw new Error('Failed to get single token liquidity quote')
        }

        // Parse the NamedTuple array to an object with proper property names
        const quote = parseQuoteSingleTokenResult(quoteArray)

        return {
          liquidity_amount: quote.liquidity_amount,
          token_a_used: quote.token_a_used / 100, // Convert from cents
          token_b_used: quote.token_b_used / 100, // Convert from cents
          excess_token: quote.excess_token,
          excess_amount: quote.excess_amount / 100, // Convert from cents
          swap_amount: quote.swap_amount / 100, // Convert from cents
          swap_output: quote.swap_output / 100, // Convert from cents
          price_impact: quote.price_impact / 100, // Convert from basis points to percentage
        }
      } catch (error) {
        console.error(`Error getting single token liquidity quote:`, error)
        throw new Error('Failed to get single token liquidity quote')
      }
    }),

  // Quote for removing liquidity to receive single token (percentage-based)
  quoteSingleTokenRemovalPercentage: procedure
    .input(
      z.object({
        address: z.string(),
        poolKey: z.string(),
        tokenOut: z.string(),
        percentage: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Convert percentage to basis points (percentage * 100)
        const percentageBasisPoints = Math.round(input.percentage * 100)

        const response = await fetchFromPoolManager([
          `quote_remove_liquidity_single_token_percentage("${input.address}", "${input.poolKey}", "${input.tokenOut}", ${percentageBasisPoints})`,
        ])
        console.log('------- response', response)

        const quoteArray =
          response.calls[
            `quote_remove_liquidity_single_token_percentage("${input.address}", "${input.poolKey}", "${input.tokenOut}", ${percentageBasisPoints})`
          ].value

        if (!quoteArray) {
          throw new Error('Failed to get single token removal quote')
        }

        // Parse the NamedTuple array to an object with proper property names
        const quote = parseQuoteRemoveSingleTokenResult(quoteArray)

        return {
          amount_out: quote.amount_out / 100, // Convert from cents
          token_a_withdrawn: quote.token_a_withdrawn / 100, // Convert from cents
          token_b_withdrawn: quote.token_b_withdrawn / 100, // Convert from cents
          swap_amount: quote.swap_amount / 100, // Convert from cents
          swap_output: quote.swap_output / 100, // Convert from cents
          price_impact: quote.price_impact / 100, // Convert from basis points to percentage
          user_liquidity: quote.user_liquidity,
        }
      } catch (error) {
        console.error(`Error getting single token removal quote:`, error)
        throw new Error('Failed to get single token removal quote')
      }
    }),
}
