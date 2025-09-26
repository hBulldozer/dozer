import { useCallback, useEffect, useRef } from 'react'
import { api } from '../utils/api'

interface UseRealtimePointsOptions {
  pollingInterval?: number
  enabled?: boolean
}

export const useRealtimePoints = (
  userAddress?: string,
  options: UseRealtimePointsOptions = {}
) => {
  const { pollingInterval = 30000, enabled = true } = options
  const intervalRef = useRef<NodeJS.Timeout>()

  // Get the tRPC utils for manual refetching
  const utils = api.useUtils()

  // Manual refresh function
  const triggerManualRefresh = useCallback(async () => {
    if (!userAddress) return

    try {
      // Refresh all points-related queries
      await utils.getPoints.getUserPoints.invalidate({ userAddress })
      await utils.getPoints.getUserRank.invalidate({ userAddress })
      await utils.getPoints.getLeaderboard.invalidate()
    } catch (error) {
      console.error('Error refreshing points data:', error)
    }
  }, [userAddress, utils])

  // Auto-refresh effect
  useEffect(() => {
    if (!enabled || !userAddress) return

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      triggerManualRefresh()
    }, pollingInterval)

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, userAddress, pollingInterval, triggerManualRefresh])

  // Stop polling function
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [])

  // Start polling function
  const startPolling = useCallback(() => {
    if (!enabled || !userAddress || intervalRef.current) return

    intervalRef.current = setInterval(() => {
      triggerManualRefresh()
    }, pollingInterval)
  }, [enabled, userAddress, pollingInterval, triggerManualRefresh])

  return {
    triggerManualRefresh,
    stopPolling,
    startPolling,
    isPolling: !!intervalRef.current,
  }
}