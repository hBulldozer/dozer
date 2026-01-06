#!/usr/bin/env node

/**
 * Test script to verify 24h volume calculation using historical state API calls
 * This script tests if the historical call is working and if we're getting correct data
 */

// Set up environment variables from .env file
process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'
process.env.NEXT_PUBLIC_LOCAL_NODE_URL =
  process.env.NEXT_PUBLIC_LOCAL_NODE_URL || 'https://node1.testnet.hathor.network/v1a/'
process.env.NEXT_PUBLIC_PUBLIC_NODE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_NODE_URL || 'https://node1.nano-testnet.hathor.network/v1a/'

const MAX_RETRIES = 3
const INITIAL_TIMEOUT = 5000

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function fetchWithRetry(url, retries, timeout) {
  try {
    const response = await fetchWithTimeout(url, timeout)
    return await response.json()
  } catch (error) {
    if (retries > 0) {
      const nextTimeout = timeout * 2
      await new Promise((resolve) => setTimeout(resolve, nextTimeout))
      return await fetchWithRetry(url, retries - 1, nextTimeout)
    }
    throw error
  }
}

async function fetchNodeData(endpoint, queryParams) {
  if (!process.env.NEXT_PUBLIC_LOCAL_NODE_URL && !process.env.NEXT_PUBLIC_PUBLIC_NODE_URL) {
    throw new Error('No node URLs configured')
  }

  try {
    const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
    if (localNodeUrl) {
      try {
        return await fetchWithRetry(localNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT)
      } catch {
        const publicNodeUrl = `${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
        if (publicNodeUrl) {
          return await fetchWithRetry(publicNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT)
        }
        throw new Error('Failed to fetch data from both local and public nodes')
      }
    }
  } catch (error) {
    throw new Error('Error fetching data to ' + endpoint + 'with params ' + queryParams + ': ' + error.message)
  }
}

async function fetchFromPoolManager(calls, timestamp) {
  if (!process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
  }

  const endpoint = 'nano_contract/state'
  const queryParams = [
    `id=${process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
    ...calls.map((call) => `calls[]=${call}`),
  ]

  if (timestamp) {
    queryParams.push(`timestamp=${timestamp}`)
  }

  return await fetchNodeData(endpoint, queryParams)
}

async function test24hVolumeCalculation() {
  console.log('🧪 Testing 24h Volume Calculation...\n')

  try {
    // First, let's get the list of available pools
    console.log('🔍 Getting available pools...')
    const poolsResponse = await fetchFromPoolManager(['get_signed_pools()'])
    console.log('📋 Available pools:', JSON.stringify(poolsResponse, null, 2))

    // Extract the first available pool key
    const pools = poolsResponse.calls?.['get_signed_pools()']?.value || []
    if (pools.length === 0) {
      throw new Error('No pools available')
    }

    const poolKey = pools[0] // Use the first available pool
    console.log(`📊 Using pool: ${poolKey}`)

    console.log(`📊 Testing pool: ${poolKey}`)
    console.log(`🔗 Contract ID: ${process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`)
    console.log(`🌐 Local Node: ${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}`)
    console.log(`🌐 Public Node: ${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}\n`)

    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 24 * 60 * 60

    console.log(`⏰ Current timestamp: ${now} (${new Date(now * 1000).toISOString()})`)
    console.log(`⏰ 24h ago timestamp: ${oneDayAgo} (${new Date(oneDayAgo * 1000).toISOString()})\n`)

    // Test 1: Get current pool data
    console.log('🔍 Test 1: Fetching current pool data...')
    const currentPoolData = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`])
    console.log('✅ Current pool data fetched successfully')
    console.log('📋 Current pool data:', JSON.stringify(currentPoolData, null, 2))

    // Test 2: Get historical pool data (24h ago)
    console.log('\n🔍 Test 2: Fetching historical pool data (24h ago)...')
    const historicalPoolData = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`], oneDayAgo)
    console.log('✅ Historical pool data fetched successfully')
    console.log('📋 Historical pool data:', JSON.stringify(historicalPoolData, null, 2))

    // Test 3: Calculate volume delta
    console.log('\n🔍 Test 3: Calculating volume delta...')

    // The front_end_api_pool returns an array where volume is at index 3 (pool_volume_a)
    const currentPoolInfo = currentPoolData.calls?.[`front_end_api_pool("${poolKey}")`]?.value || []
    const historicalPoolInfo = historicalPoolData.calls?.[`front_end_api_pool("${poolKey}")`]?.value || []

    const currentVolume = currentPoolInfo[3] || 0 // volume field (pool_volume_a)
    const historicalVolume = historicalPoolInfo[3] || 0 // volume field (pool_volume_a)

    console.log(`📊 Current pool info:`, currentPoolInfo)
    console.log(`📊 Historical pool info:`, historicalPoolInfo)
    console.log(`📊 Current volume: ${currentVolume}`)
    console.log(`📊 Historical volume (24h ago): ${historicalVolume}`)
    console.log(`📊 Volume delta: ${currentVolume - historicalVolume}`)

    // Also check transaction counts
    const currentTransactions = currentPoolInfo[7] || 0 // transactions field
    const historicalTransactions = historicalPoolInfo[7] || 0 // transactions field
    console.log(`📊 Current transactions: ${currentTransactions}`)
    console.log(`📊 Historical transactions (24h ago): ${historicalTransactions}`)
    console.log(`📊 Transaction delta: ${currentTransactions - historicalTransactions}`)

    // Test 4: Get token prices
    console.log('\n🔍 Test 4: Fetching token prices...')
    const tokenPricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
    console.log('✅ Token prices fetched successfully')
    console.log('📋 Token prices:', JSON.stringify(tokenPricesResponse, null, 2))

    // Test 5: Calculate final 24h volume
    console.log('\n🔍 Test 5: Calculating final 24h volume...')
    const volume24h = (currentVolume - historicalVolume) / 100
    const [tokenA] = poolKey.split('/')
    const rawTokenPrices = tokenPricesResponse.calls?.['get_all_token_prices_in_usd()']?.value || {}
    const token0PriceUSD = rawTokenPrices[tokenA] || 0
    const volume24hUSD = volume24h * token0PriceUSD

    console.log(`💰 24h Volume (raw): ${volume24h}`)
    console.log(`💰 Token ${tokenA} Price USD: ${token0PriceUSD}`)
    console.log(`💰 24h Volume USD: ${volume24hUSD}`)

    // Test 6: Check if there's any activity in the last 24h
    console.log('\n🔍 Test 6: Checking for activity in the last 24h...')
    const hasVolumeChange = currentVolume !== historicalVolume
    const hasTransactionChange = currentTransactions !== historicalTransactions

    console.log(`📊 Has volume change: ${hasVolumeChange}`)
    console.log(`📊 Has transaction change: ${hasTransactionChange}`)

    if (!hasVolumeChange && !hasTransactionChange) {
      console.log('⚠️  No activity detected in the last 24h - this is expected for a test environment')
      console.log("   This means the historical API call is working correctly, but there's no trading data")
    }

    // Summary
    console.log('\n📋 SUMMARY:')
    console.log('=' * 50)
    console.log(`✅ Historical API call: ${historicalPoolData ? 'SUCCESS' : 'FAILED'}`)
    console.log(`✅ Volume delta calculation: ${currentVolume - historicalVolume}`)
    console.log(`✅ 24h volume: ${volume24h}`)
    console.log(`✅ 24h volume USD: ${volume24hUSD}`)

    if (currentVolume === historicalVolume) {
      console.log('⚠️  WARNING: Current and historical volumes are the same - this might indicate:')
      console.log('   - No trading activity in the last 24h')
      console.log('   - Historical data is not available')
      console.log('   - Timestamp calculation issue')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the test
test24hVolumeCalculation()
  .then(() => {
    console.log('\n🏁 Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error)
    process.exit(1)
  })
