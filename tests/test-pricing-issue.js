// Test pricing calculation with new contract
require('dotenv').config();
const fetch = require('node-fetch');

const NEW_CONTRACT_ID = '000028a472a77f4bf83fd0e5022d771fa87f789f975abef1bcdab17453475739';

async function fetchNodeData(endpoint, params = []) {
  const queryString = params.join('&');
  const localUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL;
  const url = `${localUrl}${endpoint}?${queryString}`;
  const response = await fetch(url);
  return await response.json();
}

async function testPricing() {
  try {
    console.log('🔍 Testing pricing calculation...');
    console.log('📝 Contract ID:', NEW_CONTRACT_ID);
    
    // Get token prices
    const pricesResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      'calls[]=get_all_token_prices_in_usd()'
    ]);
    
    const prices = pricesResponse.calls['get_all_token_prices_in_usd()']?.value;
    console.log('💰 Token prices from contract:', prices);
    
    // Get pools
    const poolsResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      'calls[]=get_signed_pools()'
    ]);
    
    const signedPools = poolsResponse.calls['get_signed_pools()']?.value || [];
    console.log('🏊 Signed pools:', signedPools);
    
    // Find HTR/hUSDC pool
    const htrUsdcPool = signedPools.find(pool => 
      pool.includes('00') && // HTR
      pool.includes('00000348f13d8aed1eee459a5a3db812e4327a67615600b0ebf764f6d39e2fa1') || // old hUSDC
      pool.includes('0000') // new hUSDC pattern
    );
    
    console.log('🎯 HTR/USDC pool found:', htrUsdcPool);
    
    if (htrUsdcPool) {
      // Get pool info  
      const poolInfoResponse = await fetchNodeData('nano_contract/state', [
        `id=${NEW_CONTRACT_ID}`,
        `calls[]=pool_info_str("${htrUsdcPool}")`
      ]);
      
      const poolInfo = JSON.parse(poolInfoResponse.calls[`pool_info_str("${htrUsdcPool}")`]?.value);
      console.log('📊 Pool info:', poolInfo);
      
      const [tokenA, tokenB] = htrUsdcPool.split('/');
      console.log('\\n🔍 Pool analysis:');
      console.log('Token A (HTR):', tokenA);
      console.log('Token B (hUSDC):', tokenB);
      console.log('Reserve A:', (poolInfo.reserve_a || 0) / 100, 'HTR');
      console.log('Reserve B:', (poolInfo.reserve_b || 0) / 100, 'hUSDC');
      
      // Calculate pool ratio
      const poolRatio = (poolInfo.reserve_b / 100) / (poolInfo.reserve_a / 100);
      console.log('\\n📈 Pool ratio: 1 HTR =', poolRatio.toFixed(6), 'hUSDC');
      
      // Expected ratio based on prices
      const htrPrice = (prices && prices['00']) ? prices['00'] / 100 : 0.02; // HTR price in USD
      const usdcPrice = 1.00; // hUSDC should be $1
      const expectedRatio = htrPrice / usdcPrice;
      console.log('💡 Expected ratio: 1 HTR =', expectedRatio.toFixed(6), 'hUSDC (based on USD prices)');
      
      console.log('\\n⚠️  Issue analysis:');
      if (Math.abs(poolRatio - expectedRatio) > 0.001) {
        console.log('❌ Pool ratio does NOT match expected USD-based ratio');
        console.log('   Pool ratio:', poolRatio.toFixed(6));
        console.log('   Expected ratio:', expectedRatio.toFixed(6));
        console.log('   Difference:', (poolRatio - expectedRatio).toFixed(6));
      } else {
        console.log('✅ Pool ratio matches expected USD-based ratio');
      }
    }
    
    // Test the quote that shows in UI: 9000 HTR → hUSDC
    console.log('\\n🧪 Testing UI quote: 9000 HTR → hUSDC');
    const amount = 900000; // 9000 * 100 (in cents)
    const quoteResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(${amount},"00","${htrUsdcPool.split('/')[1]}",3)`
    ]);
    
    const quoteResult = quoteResponse.calls[`find_best_swap_path_str(${amount},"00","${htrUsdcPool.split('/')[1]}",3)`]?.value;
    
    if (quoteResult) {
      const parsedQuote = JSON.parse(quoteResult);
      console.log('📈 Quote result: 9000 HTR →', (parsedQuote.amount_out || 0) / 100, 'hUSDC');
      console.log('📊 This gives rate: 1 HTR =', ((parsedQuote.amount_out || 0) / 100 / 9000).toFixed(6), 'hUSDC');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPricing();