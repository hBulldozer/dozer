import { LiquidityPool } from './liquiditypool'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function check_wallet(wallet: string) {
  let response, statusCode
  while (!(statusCode == 3)) {
    await delay(1000)
    try {
      response = await GetHeadless(
        wallet,
        '/wallet/status',
        {
          'x-wallet-id': wallet == 'master' ? process.env.WALLET_ID : 'default',
          'X-API-Key': process.env.WALLET_API_KEY,
        },
        {}
      ).then((res) => {
        console.log('Waiting wallet to be ready...')
        statusCode = res.statusCode
      })
    } catch (e) {
      console.log(e)
    }
  }

  return response
}

async function PostHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (
    !process.env.LOCAL_WALLET_MASTER_URL ||
    !process.env.WALLET_ID ||
    !process.env.LOCAL_WALLET_USERS_URL ||
    !process.env.WALLET_API_KEY
  ) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL, Wallet ID or Wallet API Key is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? process.env.LOCAL_WALLET_MASTER_URL : process.env.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'X-API-Key': process.env.WALLET_API_KEY },
      body: JSON.stringify(body),
    }
    const response = await fetch(localWalletUrl, requestOptions)
    return await response.json()
  } catch (error: any) {
    throw new Error('Error posting data: ' + error.message)
  }
}

async function GetHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (
    !process.env.LOCAL_WALLET_MASTER_URL ||
    !process.env.WALLET_ID ||
    !process.env.LOCAL_WALLET_USERS_URL ||
    !process.env.WALLET_API_KEY
  ) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL, Wallet ID or Wallet API Key is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? process.env.LOCAL_WALLET_MASTER_URL : process.env.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'GET',
      headers: { ...headers, 'Content-Type': 'application/json', 'X-API-Key': process.env.WALLET_API_KEY },
    }
    try {
      const response = await fetch(localWalletUrl, requestOptions)
      return await response.json()
    } catch {
      throw new Error('Failed to get data from local wallet')
    }
  } catch (error: any) {
    throw new Error('Error getting data: ' + error.message)
  }
}

export async function seed_nc(n_users = 5) {
  // write the script to initialize wallet and create the contract
  let DZR_uuid,
    USDT_uuid,
    CTHOR_uuid,
    NST_uuid,
    KELB_uuid,
    admin_address,
    HTR_USDT_ncid,
    HTR_DZR_ncid,
    HTR_KELB_ncid,
    HTR_NST_ncid,
    HTR_CTHOR_ncid
  let users_addresses: string[] | undefined
  console.log('*** Starting to seed NanoContracts... ***')
  // 1. Start the master wallet
  console.log('Starting wallet...')
  await PostHeadless('master', '/start', {}, { 'wallet-id': process.env.WALLET_ID, seedKey: 'genesis' }).then(
    async (data) => {
      if (data.success || data.errorCode == 'WALLET_ALREADY_STARTED') {
        console.log(data.success ? 'Wallet started!' : 'Wallet was already started')
      } else {
        throw new Error(`Failed to start wallet. ${data.message}`)
      }
    }
  )
  await check_wallet('master')

  // 2. Create the USDT token
  await delay(2000).then(() => {
    console.log('Creating DZR Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'Dozer', symbol: 'DZR', amount: 1_400_000_00 }
  ).then((data) => {
    if (data.success) {
      DZR_uuid = data.configurationString.split(':')[2]
      console.log(`Token DZR Created - UUID: ${DZR_uuid}`)
    } else {
      throw new Error(`Failed to create DZR token. ${data.error}`)
    }
  })

  await check_wallet('master')
  // 3. Create the USDT token
  await delay(2000).then(() => {
    console.log('Creating USDT Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'USD Tether', symbol: 'USDT', amount: 2_800_000_00 }
  ).then((data) => {
    if (data.success) {
      USDT_uuid = data.configurationString.split(':')[2]
      console.log(`Token USDT Created - UUID: ${USDT_uuid}`)
    } else {
      throw new Error(`Failed to create USDT token. ${data.error}`)
    }
  })

  await check_wallet('master')
  // 3. Create the NST token
  await delay(2000).then(() => {
    console.log('Creating NST Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'NileSwap Token', symbol: 'NST', amount: 1_000_000_00 }
  ).then((data) => {
    if (data.success) {
      NST_uuid = data.configurationString.split(':')[2]
      console.log(`Token NST Created - UUID: ${NST_uuid}`)
    } else {
      throw new Error(`Failed to create NST token. ${data.error}`)
    }
  })

  await check_wallet('master')
  // 3. Create the CTHOR token
  await delay(2000).then(() => {
    console.log('Creating CTHOR Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'Cathor', symbol: 'CTHOR', amount: 1_000_000_00 }
  ).then((data) => {
    if (data.success) {
      CTHOR_uuid = data.configurationString.split(':')[2]
      console.log(`Token CTHOR Created - UUID: ${CTHOR_uuid}`)
    } else {
      throw new Error(`Failed to create CTHOR token. ${data.error}`)
    }
  })

  await check_wallet('master')
  // 3. Create the KELB token
  await delay(2000).then(() => {
    console.log('Creating KELB Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'Kelbcoin', symbol: 'KELB', amount: 1_000_000_00 }
  ).then((data) => {
    if (data.success) {
      KELB_uuid = data.configurationString.split(':')[2]
      console.log(`Token KELB Created - UUID: ${KELB_uuid}`)
    } else {
      throw new Error(`Failed to create KELB token. ${data.error}`)
    }
  })

  // 4. Get Wallet admin address
  console.log('Getting Wallet admin address...')
  await GetHeadless('master', '/wallet/address', { 'x-wallet-id': process.env.WALLET_ID }, {}).then((data) => {
    if (data.address) {
      admin_address = data.address
      console.log(`Wallet admin address: ${admin_address}`)
    } else {
      throw new Error(`Failed to get admin address. ${data.message}`)
    }
  })

  // DZR_uuid = '000001b455e8860667601f833833f32077bbba99eabb5874d26adab0eb1bd01f'
  // USDT_uuid = '00000196e885717d5d2499f41be612df13575f32e8ede8aad9711d9fd4b0a6cc'
  // NST_uuid = '0000024d3d4c855d82fcf40dae4975b2080f90d81ec05d24a2d7045ddb742aa8'
  // CTHOR_uuid = '000004a54f75dee2df12f31abca7728bf19d2b61e34d16debd034455dab51b66'
  // KELB_uuid = '000002e447903da989c3252d140d00424b161ffb3e6e52e2aeba56535a3a8246'

  // 5. Create the HTR-DZR Pool
  console.log('Creating HTR-DZR Pool...')
  if (DZR_uuid && admin_address) {
    const HTR_DZR_pool = new LiquidityPool('00', DZR_uuid, 5, 50)
    const response = await HTR_DZR_pool.initialize(admin_address, 100_000, 70_000)
    console.log(response)
    HTR_DZR_pool.ncid = response.hash
    HTR_DZR_ncid = response.hash
    console.log(`HTR-DZR Pool created. ncid: ${HTR_DZR_pool.ncid}`)
  } else throw new Error('DZR UUID and/or admin_address not found.')

  await check_wallet('master')
  // 6. Create the HTR-USDT Pool
  await delay(2000).then(() => {
    console.log('Creating HTR-USDT Pool...')
  })
  if (USDT_uuid && admin_address) {
    const HTR_USDT_pool = new LiquidityPool('00', USDT_uuid, 5, 50)
    const response = await HTR_USDT_pool.initialize(admin_address, 462_000, 18_480)
    HTR_USDT_pool.ncid = response.hash
    HTR_USDT_ncid = response.hash
    console.log(`HTR-USDT Pool created. ncid: ${HTR_USDT_pool.ncid}`)
  } else throw new Error('USDT UUID and/or admin_address not found.')

  await check_wallet('master')
  // 6. Create the HTR-NST Pool
  await delay(2000).then(() => {
    console.log('Creating HTR-NST Pool...')
  })
  if (NST_uuid && admin_address) {
    const HTR_NST_pool = new LiquidityPool('00', NST_uuid, 5, 50)
    const response = await HTR_NST_pool.initialize(admin_address, 50_000, 41_350)
    HTR_NST_pool.ncid = response.hash
    HTR_NST_ncid = response.hash
    console.log(`HTR-NST Pool created. ncid: ${HTR_NST_pool.ncid}`)
  } else throw new Error('NST UUID and/or admin_address not found.')

  await check_wallet('master')
  // 6. Create the HTR-USDT Pool
  await delay(2000).then(() => {
    console.log('Creating HTR-CTHOR Pool...')
  })
  if (CTHOR_uuid && admin_address) {
    const HTR_CTHOR_pool = new LiquidityPool('00', CTHOR_uuid, 5, 50)
    const response = await HTR_CTHOR_pool.initialize(admin_address, 50_000, 3_900)
    HTR_CTHOR_pool.ncid = response.hash
    HTR_CTHOR_ncid = response.hash
    console.log(`HTR-CTHOR Pool created. ncid: ${HTR_CTHOR_pool.ncid}`)
  } else throw new Error('CTHOR UUID and/or admin_address not found.')

  await check_wallet('master')
  // 6. Create the HTR-USDT Pool
  await delay(2000).then(() => {
    console.log('Creating HTR-KELB Pool...')
  })
  if (KELB_uuid && admin_address) {
    const HTR_KELB_pool = new LiquidityPool('00', KELB_uuid, 5, 50)
    const response = await HTR_KELB_pool.initialize(admin_address, 50_000, 2_900)
    HTR_KELB_pool.ncid = response.hash
    HTR_KELB_ncid = response.hash
    console.log(`HTR-KELB Pool created. ncid: ${HTR_KELB_pool.ncid}`)
  } else throw new Error('KELB UUID and/or admin_address not found.')

  // 7. Start the users wallet
  console.log('Starting users wallet...')
  await PostHeadless('users', '/start', {}, { 'wallet-id': 'default', seedKey: 'default' }).then(async (data) => {
    if (data.success || data.errorCode == 'WALLET_ALREADY_STARTED') {
      console.log(data.success ? 'Wallet started!' : 'Wallet was already started')
    } else {
      throw new Error(`Failed to start wallet. ${data.message}`)
    }
  })
  await check_wallet('users')

  // 8. Sending 50 HTR for each user
  console.log('Sending funds to users...')
  for (let i = 0; i < n_users; i++) {
    // Get user address
    console.log(`Get address of #${i + 1} user...`)
    let address = ''
    await GetHeadless('users', `/wallet/address?index=${i}`, { 'x-wallet-id': 'default' }, {}).then((data) => {
      if (data.address) {
        address = data.address
        console.log(`User #${i + 1} address: ${address}`)
      } else {
        throw new Error(`Failed to get user address. ${data.message}`)
      }
    })
    console.log(`Sending 5k USDT to ${address}...`)
    await PostHeadless(
      'master',
      '/wallet/simple-send-tx',
      { 'x-wallet-id': process.env.WALLET_ID },
      {
        address: address,
        value: 5_000_00,
        token: USDT_uuid,
      }
    ).then(async (data) => {
      if (data.success) {
        console.log(`Sent 5k USDT to ${address}.`)
      } else {
        throw new Error(`Failed to send HTR to ${address}.` + data)
      }
    })
    await delay(2000)
  }

  console.log('Users funding complete!')
  console.log('Seed Complete!')

  return {
    DZR_uuid: DZR_uuid,
    USDT_uuid: USDT_uuid,
    NST_uuid: NST_uuid,
    KELB_uuid: KELB_uuid,
    CTHOR_uuid: CTHOR_uuid,
    HTR_USDT_ncid: HTR_USDT_ncid,
    HTR_DZR_ncid: HTR_DZR_ncid,
    HTR_KELB_ncid: HTR_KELB_ncid,
    HTR_NST_ncid: HTR_NST_ncid,
    HTR_CTHOR_ncid: HTR_CTHOR_ncid,
  }
}
