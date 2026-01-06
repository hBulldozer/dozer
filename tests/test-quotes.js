// Quick test script to check quote functionality
require('dotenv').config()
const fetch = require('node-fetch')

const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || '0000626e3c230f011a5084c58806a83e4af4db0fd55d320f527d19aa1bf30a25'
const HATHOR_NODE_URL =
  process.env.NEXT_PUBLIC_LOCAL_NODE_URL ||
  process.env.NEXT_PUBLIC_PUBLIC_NODE_URL ||
  'https://node1.nano-testnet.hathor.network/v1a'

async function fetchNodeData(endpoint, params = []) {
  const queryString = params.join('&')

  // Try local node first
  const localUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL
  if (localUrl) {
    try {
      const url = `${localUrl}${endpoint}?${queryString}`
      console.log(`🌐 Trying local: ${url}`)
      const response = await fetch(url)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.log(`⚠️  Local node failed: ${error.message}`)
    }
  }

  // Fallback to public node
  const publicUrl = process.env.NEXT_PUBLIC_PUBLIC_NODE_URL || 'https://node1.nano-testnet.hathor.network/v1a'
  const url = `${publicUrl}/${endpoint}?${queryString}`

  console.log(`🌐 Trying public: ${url}`)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

async function testContract() {
  try {
    console.log('🔍 Testing contract connection...')
    console.log('📝 Contract ID:', NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID)

    // Test both old and new contract IDs to see which one works
    console.log('\n=== Testing New Contract ID ===')
    const newContractId = '0000626e3c230f011a5084c58806a83e4af4db0fd55d320f527d19aa1bf30a25'
    const newContractResponse = await fetchNodeData('nano_contract/state', [
      `id=${newContractId}`,
      'calls[]=get_signed_pools()',
      'calls[]=get_all_pools()',
    ])
    console.log('📋 New contract response:', JSON.stringify(newContractResponse, null, 2))

    // Test 1: Check basic contract state
    console.log('\n=== Test 1: Basic Contract State ===')
    const stateResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
      'calls[]=get_signed_pools()',
      'calls[]=get_all_pools()',
    ])

    console.log('📋 Response:', JSON.stringify(stateResponse, null, 2))

    const signedPools = stateResponse.calls['get_signed_pools()']?.value || []
    const allPools = stateResponse.calls['get_all_pools()']?.value || []

    console.log('✅ Signed pools:', signedPools)
    console.log('📊 All pools:', allPools)

    if (signedPools.length === 0) {
      console.log('❌ No signed pools found!')
      return
    }

    // Test 2: Try a quote with the first available pool
    console.log('\n=== Test 2: Quote Test ===')
    const firstPool = signedPools[0]
    const [tokenA, tokenB] = firstPool.split('/')

    console.log(`🎯 Testing quote: 100 ${tokenA} → ${tokenB}`)

    // Try different quote methods
    const amount = 10000 // 100 * 100 (in cents)

    // Test 1: find_best_swap_path_str
    console.log('\n--- Testing find_best_swap_path_str ---')
    const quoteResponse1 = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(${amount},"${tokenA}","${tokenB}",3)`,
    ])

    const quoteResult1 = quoteResponse1.calls[`find_best_swap_path_str(${amount},"${tokenA}","${tokenB}",3)`]?.value
    console.log('📈 find_best_swap_path_str result:', quoteResult1)

    // Test 2: front_quote_exact_tokens_for_tokens
    console.log('\n--- Testing front_quote_exact_tokens_for_tokens ---')
    const quoteResponse2 = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
      `calls[]=front_quote_exact_tokens_for_tokens("${firstPool}",${amount},"${tokenA}")`,
    ])

    const quoteResult2 =
      quoteResponse2.calls[`front_quote_exact_tokens_for_tokens("${firstPool}",${amount},"${tokenA}")`]?.value
    console.log('📈 front_quote_exact_tokens_for_tokens result:', quoteResult2)

    // Test 3: Try a smaller amount
    console.log('\n--- Testing with smaller amount (1 HTR) ---')
    const smallAmount = 100 // 1 * 100 (in cents)
    const quoteResponse3 = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(${smallAmount},"${tokenA}","${tokenB}",3)`,
    ])

    const quoteResult3 =
      quoteResponse3.calls[`find_best_swap_path_str(${smallAmount},"${tokenA}","${tokenB}",3)`]?.value
    console.log('📈 Small amount result:', quoteResult3)

    // Test 4: Try reverse direction
    console.log('\n--- Testing reverse direction ---')
    const quoteResponse4 = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(100,"${tokenB}","${tokenA}",3)`,
    ])

    const quoteResult4 = quoteResponse4.calls[`find_best_swap_path_str(100,"${tokenB}","${tokenA}",3)`]?.value
    console.log('📈 Reverse direction result:', quoteResult4)

    // Test 3: Check pool info
    console.log('\n=== Test 3: Pool Info ===')
    const poolInfoResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
      `calls[]=pool_info_str("${firstPool}")`,
    ])

    const poolInfo = poolInfoResponse.calls[`pool_info_str("${firstPool}")`]?.value
    console.log('🏊 Pool info:', poolInfo)

    if (poolInfo) {
      try {
        const parsedPoolInfo = JSON.parse(poolInfo)
        console.log('🔍 Parsed pool info:', JSON.stringify(parsedPoolInfo, null, 2))
        console.log('💰 Reserve A:', (parsedPoolInfo.reserve_a || 0) / 100)
        console.log('💰 Reserve B:', (parsedPoolInfo.reserve_b || 0) / 100)
      } catch (e) {
        console.log('❌ Failed to parse pool info:', e.message)
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testContract()
