// Test script for the new contract with correct fees
require('dotenv').config();
const fetch = require('node-fetch');

const NEW_CONTRACT_ID = '0000626e3c230f011a5084c58806a83e4af4db0fd55d320f527d19aa1bf30a25';

async function fetchNodeData(endpoint, params = []) {
  const queryString = params.join('&');
  
  // Try local node first
  const localUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL;
  if (localUrl) {
    try {
      const url = `${localUrl}${endpoint}?${queryString}`;
      console.log(`🌐 Trying local: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`⚠️  Local node failed: ${error.message}`);
    }
  }
  
  // Fallback to public node
  const publicUrl = process.env.NEXT_PUBLIC_PUBLIC_NODE_URL || 'https://node1.nano-testnet.hathor.network/v1a';
  const url = `${publicUrl}/${endpoint}?${queryString}`;
  
  console.log(`🌐 Trying public: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

async function testNewContract() {
  try {
    console.log('🔍 Testing NEW contract with correct fees...');
    console.log('📝 Contract ID:', NEW_CONTRACT_ID);
    
    // Get all pools
    const poolsResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      'calls[]=get_signed_pools()',
      'calls[]=get_all_pools()'
    ]);
    
    const signedPools = poolsResponse.calls['get_signed_pools()']?.value || [];
    const allPools = poolsResponse.calls['get_all_pools()']?.value || [];
    
    console.log('✅ Signed pools:', signedPools);
    console.log('📊 All pools:', allPools);
    
    if (signedPools.length === 0) {
      console.log('❌ No signed pools found!');
      return;
    }
    
    // Test quote with first pool
    const firstPool = signedPools[0];
    const [tokenA, tokenB] = firstPool.split('/');
    
    console.log(`\n🎯 Testing quote: 100 ${tokenA} → ${tokenB}`);
    
    // Test find_best_swap_path_str with new contract
    const amount = 10000; // 100 * 100 (in cents)
    const quoteResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(${amount},"${tokenA}","${tokenB}",3)`
    ]);
    
    const quoteResult = quoteResponse.calls[`find_best_swap_path_str(${amount},"${tokenA}","${tokenB}",3)`]?.value;
    
    console.log('📈 Quote result:', quoteResult);
    
    if (quoteResult) {
      try {
        const parsedQuote = JSON.parse(quoteResult);
        console.log('🔍 Parsed quote:', JSON.stringify(parsedQuote, null, 2));
        console.log('💰 Amount out:', (parsedQuote.amount_out || 0) / 100);
        console.log('📍 Path:', parsedQuote.path || 'No path');
        console.log('📊 Price impact:', parsedQuote.price_impact || 0, '%');
      } catch (e) {
        console.log('❌ Failed to parse quote result:', e.message);
      }
    } else {
      console.log('❌ No quote result received');
    }
    
    // Test pool info
    console.log(`\n🏊 Pool info for: ${firstPool}`);
    const poolInfoResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=pool_info_str("${firstPool}")`
    ]);
    
    const poolInfo = poolInfoResponse.calls[`pool_info_str("${firstPool}")`]?.value;
    if (poolInfo) {
      try {
        const parsedPoolInfo = JSON.parse(poolInfo);
        console.log('🔍 Pool details:');
        console.log('   💰 Reserve A:', (parsedPoolInfo.reserve_a || 0) / 100);
        console.log('   💰 Reserve B:', (parsedPoolInfo.reserve_b || 0) / 100);
        console.log('   💸 Fee:', parsedPoolInfo.fee || 0);
        console.log('   ✅ Signed:', parsedPoolInfo.is_signed || false);
      } catch (e) {
        console.log('❌ Failed to parse pool info:', e.message);
      }
    }
    
    // Test a reverse quote too
    console.log(`\n🔄 Testing reverse quote: 10 ${tokenB} → ${tokenA}`);
    const reverseAmount = 1000; // 10 * 100
    const reverseQuoteResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=find_best_swap_path_str(${reverseAmount},"${tokenB}","${tokenA}",3)`
    ]);
    
    const reverseQuoteResult = reverseQuoteResponse.calls[`find_best_swap_path_str(${reverseAmount},"${tokenB}","${tokenA}",3)`]?.value;
    
    if (reverseQuoteResult) {
      try {
        const parsedReverse = JSON.parse(reverseQuoteResult);
        console.log('🔄 Reverse amount out:', (parsedReverse.amount_out || 0) / 100);
        console.log('📍 Reverse path:', parsedReverse.path || 'No path');
      } catch (e) {
        console.log('❌ Failed to parse reverse quote:', e.message);
      }
    }
    
    // Test prices
    console.log(`\n💰 Testing price data...`);
    const pricesResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      'calls[]=get_all_token_prices_in_usd()'
    ]);
    
    const prices = pricesResponse.calls['get_all_token_prices_in_usd()']?.value;
    console.log('📊 Token prices:', prices);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNewContract();