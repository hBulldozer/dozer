// Debug the reserve mapping issue
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

async function debugReserves() {
  try {
    console.log('🔍 Debugging reserve calculation issue...');
    
    const poolKey = '00/000002e80a24c7b32c0c81f27dd63356c18f3fe4ab61595b43ed65e29fd2ebb2/5';
    const tokenIn = '00'; // HTR
    const tokenOut = '000002e80a24c7b32c0c81f27dd63356c18f3fe4ab61595b43ed65e29fd2ebb2'; // hBTC
    
    // Get pool info
    const poolInfoResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=pool_info_str("${poolKey}")`
    ]);
    
    const poolInfo = JSON.parse(poolInfoResponse.calls[`pool_info_str("${poolKey}")`]?.value);
    console.log('📊 Pool info:');
    console.log('   Token A:', poolKey.split('/')[0], '(HTR)');
    console.log('   Token B:', poolKey.split('/')[1], '(hBTC)'); 
    console.log('   Reserve A:', poolInfo.reserve_a / 100, 'HTR');
    console.log('   Reserve B:', poolInfo.reserve_b / 100, 'hBTC');
    
    // Test the calculate_amount_out method directly
    console.log('\\n🧮 Testing calculate_amount_out directly...');
    
    try {
      const calcResponse = await fetchNodeData('nano_contract/state', [
        `id=${NEW_CONTRACT_ID}`,
        `calls[]=calculate_amount_out(10000,"${tokenIn}","${tokenOut}",5)`
      ]);
      
      console.log('📈 calculate_amount_out result:', calcResponse.calls);
    } catch (error) {
      console.log('❌ calculate_amount_out failed:', error.message);
    }
    
    // Test manual calculation using get_amount_out
    console.log('\\n🔢 Manual calculation:');
    const amountIn = 80000; // 800 HTR in cents
    const reserveIn = poolInfo.reserve_a; // 100M HTR in cents  
    const reserveOut = poolInfo.reserve_b; // 100 hBTC in cents
    const feeNumerator = 5;
    const feeDenominator = 1000;
    
    console.log('Input parameters:');
    console.log('   Amount In:', amountIn / 100, 'HTR');
    console.log('   Reserve In:', reserveIn / 100, 'HTR');
    console.log('   Reserve Out:', reserveOut / 100, 'hBTC');
    console.log('   Fee:', feeNumerator + '/' + feeDenominator, '(0.5%)');
    
    // Manual calculation: (reserve_out * amount_in * (fee_denominator - fee_numerator)) / (reserve_in * fee_denominator + amount_in * (fee_denominator - fee_numerator))
    const a = feeDenominator - feeNumerator; // 995
    const b = feeDenominator; // 1000
    
    const numerator = reserveOut * amountIn * a;
    const denominator = reserveIn * b + amountIn * a;
    const expectedOut = Math.floor(numerator / denominator);
    
    console.log('\\n🔍 Manual calculation:');
    console.log('   Numerator:', reserveOut / 100, '*', amountIn / 100, '*', a, '=', numerator / 10000);
    console.log('   Denominator:', reserveIn / 100, '*', b, '+', amountIn / 100, '*', a, '=', denominator / 10000);
    console.log('   Expected output:', expectedOut / 100, 'hBTC');
    
    // Test if the pool actually contains the reserves we think
    console.log('\\n🔍 Testing reserve reality...');
    const reservesResponse = await fetchNodeData('nano_contract/state', [
      `id=${NEW_CONTRACT_ID}`,
      `calls[]=get_pool_reserves("${tokenIn}","${tokenOut}",5)`
    ]);
    
    console.log('📊 get_pool_reserves result:', reservesResponse.calls);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugReserves();