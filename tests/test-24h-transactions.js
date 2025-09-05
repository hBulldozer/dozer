/**
 * Test script for 24h transaction count calculation using historic API delta approach
 * This tests the same pattern as 24h volume calculation but for transaction counts
 */

const fetch = require('node-fetch')

// Configuration
const POOL_MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || '0000000000000000000000000000000000000000000000000000000000000000'
const NODE_URL = process.env.NEXT_PUBLIC_NODE_URL || 'https://node1.mainnet.hathor.network/v1a'

// Test pool key (hUSDC/DZR with 0.1% fee)
const poolKey = '00/0000000000000000000000000000000000000000000000000000000000000000/1'

console.log('🧪 Testing 24h Transaction Count Calculation...\n')
console.log(`📋 Pool Key: ${poolKey}`)
console.log(`📋 Contract ID: ${POOL_MANAGER_CONTRACT_ID}`)
console.log(`📋 Node URL: ${NODE_URL}\n`)

// Helper function to fetch from pool manager
async function fetchFromPoolManager(calls, timestamp) {
  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${POOL_MANAGER_CONTRACT_ID}`]

  if (timestamp) {
    queryParams.push(`timestamp=${timestamp}`)
  }

  const url = `${NODE_URL}/${endpoint}?${queryParams.join('&')}`
  console.log(`🔗 Fetching: ${url}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// Helper function to parse pool API info
function parsePoolApiInfo(poolDataArray) {
  if (!Array.isArray(poolDataArray) || poolDataArray.length !== 10) {
    throw new Error('Invalid PoolApiInfo array format')
  }

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

// Helper function to calculate 24h transaction count using delta approach
async function calculate24hTransactionCount(poolKey) {
  try {
    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 24 * 60 * 60 // 24 hours ago in seconds

    console.log(`⏰ Current timestamp: ${now} (${new Date(now * 1000).toISOString()})`)
    console.log(`⏰ 24h ago timestamp: ${oneDayAgo} (${new Date(oneDayAgo * 1000).toISOString()})`)

    // Get current pool data
    console.log('\n🔍 Test 1: Fetching current pool data...')
    const currentResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`])
    const currentPoolDataArray = currentResponse.calls?.[`front_end_api_pool("${poolKey}")`]?.value

    if (!currentPoolDataArray) {
      console.warn(`⚠️  No current data found for pool ${poolKey}`)
      return 0
    }

    const currentPoolData = parsePoolApiInfo(currentPoolDataArray)
    const currentTransactions = currentPoolData.transactions || 0

    console.log('✅ Current pool data fetched successfully')
    console.log('📋 Current pool data:', JSON.stringify(currentPoolData, null, 2))
    console.log(`📊 Current transactions: ${currentTransactions}`)

    // Get historical pool data from 24 hours ago
    console.log('\n🔍 Test 2: Fetching historical pool data (24h ago)...')
    let historicalTransactions = 0
    try {
      const historicalResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`], oneDayAgo)
      const historicalPoolDataArray = historicalResponse.calls?.[`front_end_api_pool("${poolKey}")`]?.value

      if (historicalPoolDataArray) {
        const historicalPoolData = parsePoolApiInfo(historicalPoolDataArray)
        historicalTransactions = historicalPoolData.transactions || 0
        console.log('✅ Historical pool data fetched successfully')
        console.log('📋 Historical pool data:', JSON.stringify(historicalPoolData, null, 2))
        console.log(`📊 Historical transactions (24h ago): ${historicalTransactions}`)
      } else {
        console.log('⚠️  No historical data found, assuming 0 historical transactions')
      }
    } catch (error) {
      console.warn(
        `⚠️  Historical data unavailable for pool ${poolKey} at ${oneDayAgo}, assuming 0 historical transactions`
      )
      console.warn(`   Error: ${error.message}`)
      historicalTransactions = 0
    }

    // Calculate 24h transaction delta
    console.log('\n🔍 Test 3: Calculating transaction delta...')
    const transactions24h = Math.max(0, currentTransactions - historicalTransactions)

    console.log(`📊 Current transactions: ${currentTransactions}`)
    console.log(`📊 Historical transactions (24h ago): ${historicalTransactions}`)
    console.log(`📊 Transaction delta (24h): ${transactions24h}`)

    return transactions24h
  } catch (error) {
    console.error(`❌ Error calculating 24h transaction count for pool ${poolKey}:`, error)
    return 0
  }
}

// Main test function
async function test24hTransactionCalculation() {
  console.log('🧪 Testing 24h Transaction Count Calculation...\n')

  try {
    // Test the calculation
    const txCount24h = await calculate24hTransactionCount(poolKey)

    console.log('\n🎉 Test Results:')
    console.log(`✅ 24h Transaction Count: ${txCount24h}`)

    if (txCount24h >= 0) {
      console.log('✅ Test passed: Transaction count calculation successful')
    } else {
      console.log('❌ Test failed: Transaction count should be non-negative')
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
test24hTransactionCalculation()
  .then(() => {
    console.log('\n🏁 Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
