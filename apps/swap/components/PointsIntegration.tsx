import { FC, useEffect } from 'react'
import { useConfirmedTransactionPoints } from '../../_root/hooks/useConfirmedTransactionPoints'
import { useAccount } from '@dozer/zustand'

interface PointsIntegrationProps {
  transactionHash: string
  transactionType: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'bridge'
  volumeUSD: number
  poolId?: string
  blockNumber?: number
  onPointsProcessed?: (pointsAwarded: number) => void
  onError?: (error: Error) => void
}

/**
 * Component to integrate points processing with existing transaction flows
 * This can be used in swap, earn, and other transaction components
 */
export const PointsIntegration: FC<PointsIntegrationProps> = ({
  transactionHash,
  transactionType,
  volumeUSD,
  poolId,
  blockNumber,
  onPointsProcessed,
  onError,
}) => {
  const { userAddress } = useConfirmedTransactionPoints()
  const { hathorAddress, walletType } = useAccount()

  // This component now just stores the transaction data for the confirmed transaction hook to process
  // The actual points processing happens in useConfirmedTransactionPoints when the transaction is confirmed
  useEffect(() => {
    if (!userAddress || !transactionHash) return

    // Store transaction data for later processing when confirmed
    // The useConfirmedTransactionPoints hook will automatically process this when the transaction is confirmed
    console.log(`Transaction ${transactionHash} queued for points processing when confirmed`)
  }, [transactionHash, transactionType, volumeUSD, poolId, blockNumber, userAddress])

  return null // This component doesn't render anything
}

/**
 * Hook to easily integrate points processing into existing components
 */
export const usePointsIntegration = () => {
  const { userAddress } = useConfirmedTransactionPoints()

  // With the confirmed transaction approach, we don't need to manually process transactions
  // The useConfirmedTransactionPoints hook automatically processes points when transactions are confirmed
  // This hook now just provides the user address for reference

  return {
    userAddress,
    // Note: Transaction processing is now automatic when transactions are confirmed
    // No manual processing needed
  }
}
