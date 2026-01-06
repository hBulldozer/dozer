// Test HTR → hBTC quote specifically
require('dotenv').config();
const fetch = require('node-fetch');

const NEW_CONTRACT_ID = '0000626e3c230f011a5084c58806a83e4af4db0fd55d320f527d19aa1bf30a25';

async function fetchNodeData(endpoint, params = []) {
  const queryString = params.join('&');
  const localUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL;
  const url = `${localUrl}${endpoint}?${queryString}`;
  const response = await fetch(url);
  return await response.json();
}

async function testHTRtoBTC() {
  try {
    console.log('🔍 Testing HTR → hBTC quote issue...');
    
    // Get all pools first
    const poolsResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      'calls[]=get_signed_pools()'
    ]);
    
    const signedPools = poolsResponse.calls['get_signed_pools()']?.value || [];
    console.log('✅ All signed pools:', signedPools);
    
    // Find the HTR/hBTC pool
    const hbtcPool = signedPools.find(pool => 
      pool.includes('000002e80a24c7b32c0c81f27dd63356c18f3fe4ab61595b43ed65e29fd2ebb2')
    );
    console.log('🎯 HTR/hBTC pool:', hbtcPool);
    
    if (!hbtcPool) {
      console.log('❌ HTR/hBTC pool not found!');
      return;
    }
    
    // Check pool info
    const poolInfoResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=pool_info_str("${hbtcPool}")`
    ]);
    
    const poolInfo = JSON.parse(poolInfoResponse.calls[`pool_info_str("${hbtcPool}")`]?.value);
    console.log('🏊 Pool info:');
    console.log('   💰 Reserve A (HTR):', (poolInfo.reserve_a || 0) / 100);
    console.log('   💰 Reserve B (hBTC):', (poolInfo.reserve_b || 0) / 100);
    console.log('   💸 Fee:', poolInfo.fee || 0);
    console.log('   ✅ Signed:', poolInfo.is_signed || false);
    
    // Test the exact quote: 800 HTR → hBTC
    const amount = 80000; // 800 * 100 (in cents)
    const tokenIn = '00'; // HTR
    const tokenOut = '000002e80a24c7b32c0c81f27dd63356c18f3fe4ab61595b43ed65e29fd2ebb2'; // hBTC
    
    console.log(`\n🎯 Testing quote: ${amount/100} HTR → hBTC`);
    
    const quoteResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(${amount},"${tokenIn}","${tokenOut}",3)`
    ]);
    
    const quoteResult = quoteResponse.calls[`find_best_swap_path_str(${amount},"${tokenIn}","${tokenOut}",3)`]?.value;
    
    console.log('📈 Quote result raw:', quoteResult);
    
    if (quoteResult) {
      const parsedQuote = JSON.parse(quoteResult);
      console.log('🔍 Parsed quote:', JSON.stringify(parsedQuote, null, 2));
      console.log('💰 Amount out:', (parsedQuote.amount_out || 0) / 100);
      console.log('📍 Path:', parsedQuote.path || 'No path');
      console.log('📊 Price impact:', parsedQuote.price_impact || 0, '%');
      
      if (parsedQuote.amount_out === 0) {
        console.log('\n❌ ZERO OUTPUT DETECTED! Debugging...');
        
        // Test with smaller amount
        console.log('\n🔬 Testing with smaller amount (1 HTR)...');
        const smallQuote = await fetchNodeData('nano_contract/state', [
          `id=${NEW_CONTRACT_ID}`,
          `calls[]=find_best_swap_path_str(100,"${tokenIn}","${tokenOut}",3)`
        ]);
        
        const smallResult = JSON.parse(smallQuote.calls[`find_best_swap_path_str(100,"${tokenIn}","${tokenOut}",3)`]?.value);
        console.log('🔍 Small amount result:', smallResult);
        
        // Check if there's sufficient liquidity
        const reserveHTR = poolInfo.reserve_a / 100;
        const reservehBTC = poolInfo.reserve_b / 100;
        const requestedHTR = amount / 100;
        
        console.log('\n💧 Liquidity check:');
        console.log(`   Pool HTR: ${reserveHTR}`);
        console.log(`   Pool hBTC: ${reservehBTC}`);
        console.log(`   Requested HTR: ${requestedHTR}`);
        console.log(`   % of pool: ${((requestedHTR / reserveHTR) * 100).toFixed(2)}%`);
        
        if (requestedHTR > reserveHTR * 0.9) {
          console.log('❌ Insufficient liquidity! Requested amount too large.');
        }
      }
    } else {
      console.log('❌ No quote result received');
    }
    
    // Test reverse: hBTC → HTR
    console.log('\n🔄 Testing reverse: 1 hBTC → HTR');
    const reverseQuote = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(100,"${tokenOut}","${tokenIn}",3)`
    ]);
    
    const reverseResult = JSON.parse(reverseQuote.calls[`find_best_swap_path_str(100,"${tokenOut}","${tokenIn}",3)`]?.value);
    console.log('🔄 Reverse result:', reverseResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHTRtoBTC();