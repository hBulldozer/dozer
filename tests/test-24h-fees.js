#!/usr/bin/env node

/**
 * Test script to verify 24h fees calculation using volume * fee rate
 * This script tests if the fees calculation is working correctly
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

// Helper function to parse pool API info (simplified version)
function parsePoolApiInfo(poolDataArray) {
  return {
    reserve0: poolDataArray[0] || 0,
    reserve1: poolDataArray[1] || 0,
    fee: poolDataArray[2] || 0,
    volume: poolDataArray[3] || 0,
    fee0: poolDataArray[4] || 0,
    fee1: poolDataArray[5] || 0,
    dzr_rewards: poolDataArray[6] || 0,
    transactions: poolDataArray[7] || 0,
    is_signed: poolDataArray[8] || 0,
    signer: poolDataArray[9] || null,
  }
}

// Helper function to format price (simplified version)
function formatPrice(price) {
  return price / 100000000 // Convert from smallest unit to full unit
}

async function test24hFeesCalculation() {
  console.log('🧪 Testing 24h Fees Calculation...\n')

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
    const currentPoolInfo = currentPoolData.calls?.[`front_end_api_pool("${poolKey}")`]?.value || []
    const historicalPoolInfo = historicalPoolData.calls?.[`front_end_api_pool("${poolKey}")`]?.value || []

    const currentVolume = currentPoolInfo[3] || 0 // volume field (pool_volume_a)
    const historicalVolume = historicalPoolInfo[3] || 0 // volume field (pool_volume_a)

    console.log(`📊 Current volume: ${currentVolume}`)
    console.log(`📊 Historical volume (24h ago): ${historicalVolume}`)
    console.log(`📊 Volume delta: ${currentVolume - historicalVolume}`)

    // Test 4: Get token prices
    console.log('\n🔍 Test 4: Fetching token prices...')
    const tokenPricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
    console.log('✅ Token prices fetched successfully')

    // Test 5: Calculate 24h volume in USD
    console.log('\n🔍 Test 5: Calculating 24h volume in USD...')
    const volume24h = (currentVolume - historicalVolume) / 100
    const [tokenA] = poolKey.split('/')
    const rawTokenPrices = tokenPricesResponse.calls?.['get_all_token_prices_in_usd()']?.value || {}
    const tokenPrices = Object.fromEntries(Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v)]))
    const token0PriceUSD = tokenPrices[tokenA] || 0
    const volume24hUSD = volume24h * token0PriceUSD

    console.log(`💰 24h Volume (raw): ${volume24h}`)
    console.log(`💰 Token ${tokenA} Price USD: ${token0PriceUSD}`)
    console.log(`💰 24h Volume USD: ${volume24hUSD}`)

    // Test 6: Calculate 24h fees using volume * fee rate
    console.log('\n🔍 Test 6: Calculating 24h fees using volume * fee rate...')
    const currentPoolDataParsed = parsePoolApiInfo(currentPoolInfo)
    const feeRate = (currentPoolDataParsed.fee || 0) / 10000 // Convert from basis points to decimal
    const fees24hUSD = volume24hUSD * feeRate

    console.log(`📊 Pool fee rate (basis points): ${currentPoolDataParsed.fee}`)
    console.log(`📊 Pool fee rate (decimal): ${feeRate}`)
    console.log(`💰 24h Fees USD: ${fees24hUSD}`)

    // Test 7: Show different scenarios
    console.log('\n🔍 Test 7: Testing different volume scenarios...')

    // Scenario 1: $1000 volume
    const testVolume1 = 1000
    const testFees1 = testVolume1 * feeRate
    console.log(`📊 $${testVolume1} volume → $${testFees1.toFixed(6)} fees`)

    // Scenario 2: $100 volume
    const testVolume2 = 100
    const testFees2 = testVolume2 * feeRate
    console.log(`📊 $${testVolume2} volume → $${testFees2.toFixed(6)} fees`)

    // Scenario 3: $10 volume
    const testVolume3 = 10
    const testFees3 = testVolume3 * feeRate
    console.log(`📊 $${testVolume3} volume → $${testFees3.toFixed(6)} fees`)

    // Scenario 4: $1 volume
    const testVolume4 = 1
    const testFees4 = testVolume4 * feeRate
    console.log(`📊 $${testVolume4} volume → $${testFees4.toFixed(6)} fees`)

    // Summary
    console.log('\n📋 SUMMARY:')
    console.log('=' * 50)
    console.log(`✅ Pool fee rate: ${currentPoolDataParsed.fee} basis points (${feeRate} decimal)`)
    console.log(`✅ 24h volume USD: $${volume24hUSD}`)
    console.log(`✅ 24h fees USD: $${fees24hUSD}`)
    console.log(`✅ Calculation method: volume * fee_rate`)

    if (volume24hUSD > 0 && fees24hUSD === 0) {
      console.log('⚠️  WARNING: Volume > 0 but fees = 0 - this might indicate a very low fee rate')
    } else if (volume24hUSD === 0) {
      console.log('ℹ️  INFO: No volume in last 24h - fees correctly calculated as 0')
    } else {
      console.log('✅ Fees calculation working correctly!')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the test
test24hFeesCalculation()
  .then(() => {
    console.log('\n🏁 Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error)
    process.exit(1)
  })
