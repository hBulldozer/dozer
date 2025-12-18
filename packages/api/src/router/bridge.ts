import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'

// Get explorer service URLs from environment
const NEXT_PUBLIC_EXPLORER_SERVICE_URL = process.env.NEXT_PUBLIC_EXPLORER_SERVICE_URL
const NEXT_PUBLIC_TESTNET_EXPLORER_SERVICE_URL = process.env.NEXT_PUBLIC_TESTNET_EXPLORER_SERVICE_URL

// Get node URLs from environment
const NEXT_PUBLIC_PUBLIC_NODE_URL = process.env.NEXT_PUBLIC_PUBLIC_NODE_URL
const NEXT_PUBLIC_TESTNET_NODE_URL = process.env.NEXT_PUBLIC_TESTNET_NODE_URL

export const bridgeRouter = createTRPCRouter({
  /**
   * Check if bridge transaction has been received on Hathor network
   * This is used to poll for bridge completion after EVM confirmation
   */
  checkBridgeReceipt: procedure
    .input(
      z.object({
        hathorAddress: z.string(),
        tokenUuid: z.string(),
        evmConfirmationTime: z.number(), // Unix timestamp in seconds
        isTestnet: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      const { hathorAddress, tokenUuid, evmConfirmationTime, isTestnet } = input

      try {
        // Get the appropriate explorer service URL
        const explorerUrl = isTestnet
          ? NEXT_PUBLIC_TESTNET_EXPLORER_SERVICE_URL || 'https://explorer-service.testnet.hathor.network'
          : NEXT_PUBLIC_EXPLORER_SERVICE_URL || 'https://explorer-service.hathor.network'

        // Fetch transaction history for this address and token
        const historyResponse = await fetch(
          `${explorerUrl}/address/history?address=${hathorAddress}&token=${tokenUuid}&limit=50`
        )

        if (!historyResponse.ok) {
          console.error('Failed to fetch history:', historyResponse.status)
          return {
            received: false,
            error: `Failed to fetch history: ${historyResponse.status}`,
          }
        }

        const historyData = await historyResponse.json()

        console.log(
          `[checkBridgeReceipt] Checking for ${tokenUuid} on ${isTestnet ? 'TESTNET' : 'MAINNET'}`
        )
        console.log(`[checkBridgeReceipt] Address: ${hathorAddress}, EVM Confirm Time: ${evmConfirmationTime}`)
        console.log(`[checkBridgeReceipt] Explorer URL: ${explorerUrl}`)
        console.log(`[checkBridgeReceipt] Found ${historyData.history?.length || 0} transactions`)

        if (!historyData.history || historyData.history.length === 0) {
          return { received: false }
        }

        // Look for a transaction after EVM confirmation where we received tokens (positive balance change)
        const receivedTx = historyData.history.find(
          (tx: any) => tx.timestamp > evmConfirmationTime && tx.balance > 0
        )

        if (!receivedTx) {
          return { received: false }
        }

        // Get the appropriate node URL
        const nodeUrl = isTestnet
          ? NEXT_PUBLIC_TESTNET_NODE_URL || 'https://node1.testnet.hathor.network/v1a'
          : NEXT_PUBLIC_PUBLIC_NODE_URL || 'https://node1.mainnet.hathor.network/v1a'

        // Verify the transaction is confirmed on the network
        const txResponse = await fetch(`${nodeUrl}/transaction?id=${receivedTx.tx_id}`)

        if (!txResponse.ok) {
          console.error('Failed to fetch transaction:', txResponse.status)
          return {
            received: false,
            error: `Failed to fetch transaction: ${txResponse.status}`,
          }
        }

        const txData = await txResponse.json()

        // Check if transaction is confirmed (has first_block and not voided)
        const isConfirmed =
          txData.success &&
          txData.meta?.first_block &&
          (!txData.meta?.voided_by || txData.meta.voided_by.length === 0)

        if (isConfirmed) {
          return {
            received: true,
            txId: receivedTx.tx_id,
            timestamp: receivedTx.timestamp,
            balance: receivedTx.balance,
          }
        }

        return { received: false }
      } catch (error) {
        console.error('Error checking bridge receipt:', error)
        return {
          received: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }),
})
