import { Layout } from '../../components/Layout'
import { Button, Widget, Typography } from '@dozer/ui'
import { useState, useEffect, useCallback, useRef } from 'react'
import { MetaMaskProvider, useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'
import { api } from '../../utils/api'

// Demo component that uses all the snap-utils hooks
const SnapUtilsDemo = () => {
  const { provider, installedSnap, error, setInstalledSnap } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()
  const faucetMutation = api.getFaucet.sendHTR.useMutation()

  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [snapId, setSnapId] = useState('local:http://localhost:8089')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [hathorAddress, setHathorAddress] = useState<string | null>(null)
  const [isLoadingFaucet, setIsLoadingFaucet] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('testnet')
  const hasCheckedConnection = useRef(false)

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }, [])

  const checkConnection = useCallback(async () => {
    if (isCheckingConnection) return // Prevent multiple simultaneous checks

    setIsCheckingConnection(true)
    try {
      const accounts = await request({ method: 'eth_accounts' })
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setIsConnected(true)
        setAccount(accounts[0] as string)
        addLog(`✅ Connected to account: ${accounts[0]}`)
      } else {
        setIsConnected(false)
        setAccount(null)
        addLog('❌ No accounts connected')
      }
    } catch (err) {
      addLog(`❌ Error checking connection: ${err}`)
    } finally {
      setIsCheckingConnection(false)
    }
  }, [request, addLog, isCheckingConnection])

  // Check connection status on mount
  useEffect(() => {
    if (provider && !hasCheckedConnection.current) {
      hasCheckedConnection.current = true
      checkConnection()
    }
  }, [provider, checkConnection])

  const connectWallet = async () => {
    try {
      addLog('🔄 Requesting wallet connection...')

      // Check if provider is available
      if (!provider) {
        addLog('❌ No MetaMask provider found. Please install MetaMask extension.')
        addLog('💡 Make sure MetaMask is installed and enabled in your browser.')
        return
      }

      addLog(`🔍 Provider found: ${provider.isMetaMask ? 'MetaMask' : 'Other'}`)

      const accounts = await request({ method: 'eth_requestAccounts' })
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setIsConnected(true)
        setAccount(accounts[0] as string)
        addLog(`✅ Connected to account: ${accounts[0]}`)
      }
    } catch (err) {
      addLog(`❌ Connection failed: ${err}`)
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          addLog('👤 User rejected the connection request')
        } else if (err.message.includes('No provider')) {
          addLog('❌ No wallet provider found. Please install MetaMask.')
        }
      }
    }
  }

  const disconnectWallet = async () => {
    try {
      addLog('🔄 Disconnecting wallet...')
      // Note: MetaMask doesn't have a direct disconnect method
      // This is a conceptual disconnect
      setIsConnected(false)
      setAccount(null)
      addLog('✅ Wallet disconnected')
    } catch (err) {
      addLog(`❌ Disconnect error: ${err}`)
    }
  }

  const getAccountBalance = async () => {
    if (!account) {
      addLog('❌ No account connected')
      return
    }

    try {
      addLog('🔄 Fetching account balance...')
      const balance = await request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      })

      if (balance) {
        const balanceInEth = parseInt(balance as string, 16) / Math.pow(10, 18)
        addLog(`💰 Balance: ${balanceInEth.toFixed(4)} ETH`)
      }
    } catch (err) {
      addLog(`❌ Error fetching balance: ${err}`)
    }
  }

  const getChainId = async () => {
    try {
      addLog('🔄 Fetching chain ID...')
      const chainId = await request({ method: 'eth_chainId' })
      addLog(`⛓️ Chain ID: ${chainId}`)
    } catch (err) {
      addLog(`❌ Error fetching chain ID: ${err}`)
    }
  }

  const switchToMainnet = async () => {
    try {
      addLog('🔄 Switching to Ethereum Mainnet...')
      await request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      })
      addLog('✅ Switched to Ethereum Mainnet')
    } catch (err) {
      addLog(`❌ Error switching network: ${err}`)
    }
  }

  const switchToSepolia = async () => {
    try {
      addLog('🔄 Switching to Sepolia Testnet...')
      await request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      })
      addLog('✅ Switched to Sepolia Testnet')
    } catch (err) {
      addLog(`❌ Error switching network: ${err}`)
    }
  }

  const installSnap = async () => {
    try {
      addLog(`🔄 Installing Hathor snap: ${snapId}`)
      // For local snaps, don't provide a version - MetaMask expects empty object
      const result = await requestSnap(snapId)
      setInstalledSnap(result)
      addLog(`✅ Hathor snap installed: ${result?.id}`)
    } catch (err) {
      addLog(`❌ Snap installation failed: ${err}`)
    }
  }

  const invokeSnapMethod = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Invoking Hathor snap method...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 },
      })
      addLog(`✅ Hathor address: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Snap invocation failed: ${err}`)
    }
  }

  const getSnaps = async () => {
    try {
      addLog('🔄 Fetching installed snaps...')
      const snaps = await request({ method: 'wallet_getSnaps' })
      addLog(`📦 Installed snaps: ${JSON.stringify(snaps, null, 2)}`)
    } catch (err) {
      addLog(`❌ Error fetching snaps: ${err}`)
      addLog('ℹ️ Note: Fetching local snaps is disabled in MetaMask for security reasons')
    }
  }

  const clearLogs = () => {
    setLogs([])
    addLog('📝 Logs cleared')
  }

  const checkMetaMaskAvailability = () => {
    addLog('🔍 Checking MetaMask availability...')

    const info = []

    // Check if window.ethereum exists
    if (typeof window !== 'undefined' && window.ethereum) {
      info.push('✅ window.ethereum is available')
      info.push(`   - isMetaMask: ${window.ethereum.isMetaMask}`)
      info.push(`   - isConnected: ${window.ethereum.isConnected?.()}`)
      info.push(`   - selectedAddress: ${window.ethereum.selectedAddress || 'None'}`)
      info.push(`   - chainId: ${window.ethereum.chainId || 'None'}`)
    } else {
      info.push('❌ window.ethereum is not available')
    }

    // Check if provider is set
    if (provider) {
      info.push('✅ Provider is set in context')
      info.push(`   - isMetaMask: ${provider.isMetaMask}`)
    } else {
      info.push('❌ No provider in context')
    }

    // Check for other wallet providers
    if (typeof window !== 'undefined' && window.ethereum?.providers) {
      info.push(`📦 Multiple providers detected: ${window.ethereum.providers.length}`)
      window.ethereum.providers.forEach((p: unknown, i: number) => {
        const provider = p as { isMetaMask?: boolean }
        info.push(`   - Provider ${i}: ${provider.isMetaMask ? 'MetaMask' : 'Other'}`)
      })
    }

    setDebugInfo(info.join('\n'))
    addLog('📊 Debug info updated - check the debug section below')
  }

  // Hathor-specific methods
  const getHathorBalance = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Hathor balance...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getBalance',
        params: { tokens: ['00', '00000337f9db18c355a376697f64fd6e36945fc984d6569b4b0d86e2af185945'] },
      })
      addLog(`✅ Hathor balance: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Get balance failed: ${err}`)
    }
  }

  const getHathorNetwork = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Hathor network...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getConnectedNetwork',
        params: {},
      })
      addLog(`✅ Hathor network: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Get network failed: ${err}`)
    }
  }

  const getHathorUtxos = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Hathor UTXOs...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getUtxos',
        params: {},
      })
      addLog(`✅ Hathor UTXOs: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Get UTXOs failed: ${err}`)
    }
  }

  const signHathorMessage = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Signing Hathor message...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_signWithAddress',
        params: { message: 'test message', addressIndex: 0 },
      })
      addLog(`✅ Hathor signature: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Sign message failed: ${err}`)
    }
  }

  const getHathorAddress = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Hathor address...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 },
      })

      // Parse the response if it's a string
      let parsedResult = result
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result)
        } catch (parseErr) {
          addLog(`❌ Failed to parse response: ${parseErr}`)
          return
        }
      }

      // Extract the address from the parsed response
      const address = parsedResult?.response?.address || parsedResult?.address
      if (address) {
        setHathorAddress(address)
        addLog(`✅ Hathor address: ${address}`)
        addLog(`📋 Full response: ${JSON.stringify(parsedResult)}`)
      } else {
        addLog(`❌ No address found in response: ${JSON.stringify(parsedResult)}`)
      }
    } catch (err) {
      addLog(`❌ Get address failed: ${err}`)
    }
  }

  const sendHathorTransaction = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Sending Hathor transaction...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendTransaction',
        params: {
          outputs: [{ address: 'WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx', value: '10' }, { data: 'test data' }],
        },
      })
      addLog(`✅ Hathor transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Send transaction failed: ${err}`)
    }
  }

  const createHathorToken = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Creating Hathor token...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_createToken',
        params: {
          name: 'Test Token',
          symbol: 'TST',
          amount: '100',
          address: hathorAddress || 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
          change_address: hathorAddress || 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK',
          create_mint: true,
          mint_authority_address: hathorAddress || 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
          allow_external_mint_authority_address: true,
          create_melt: false,
          data: ['ab', 'c'],
        },
      })
      addLog(`✅ Hathor token created: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Create token failed: ${err}`)
    }
  }

  const sendNanoContractTx = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Sending nano contract transaction...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendNanoContractTx',
        params: {
          method: 'initialize',
          data: {
            blueprint_id: '000001291ad6218140ef41eef71f3c2fbeb000f6ddd592bc42c6cde9fa07a964',
            actions: [],
            args: ['76a914a3d942f602ea11b74c3b58d15531a35a80cab00388ac', '00', 1759997478],
          },
        },
      })
      addLog(`✅ Nano contract transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Send nano contract failed: ${err}`)
    }
  }

  const signOracleData = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Signing oracle data...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_signOracleData',
        params: {
          nc_id: '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490',
          data: '1x0',
          oracle: hathorAddress || 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK',
        },
      })
      addLog(`✅ Oracle data signed: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Sign oracle data failed: ${err}`)
    }
  }

  const switchHathorNetwork = async (network: 'mainnet' | 'testnet') => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog(`🔄 Switching Hathor network to ${network}...`)
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_changeNetwork',
        params: { newNetwork: network },
      })
      setSelectedNetwork(network)
      addLog(`✅ Network switched to ${network}: ${JSON.stringify(result)}`)

      // Clear the Hathor address since it may change with network
      setHathorAddress(null)
      addLog('ℹ️ Hathor address cleared - get new address for the network')
    } catch (err) {
      addLog(`❌ Switch network failed: ${err}`)
      addLog(`ℹ️ Make sure your snap supports the htr_changeNetwork method`)
    }
  }

  const createNanoContractCreateTokenTx = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Creating nano contract create token transaction...')
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_createNanoContractCreateTokenTx',
        params: {
          method: 'initialize',
          createTokenOptions: {
            contract_pays_token_deposit: false,
            name: 'Test Token',
            symbol: 'TST',
            amount: '100',
            address: hathorAddress || 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
            change_address: hathorAddress || 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK',
            create_mint: true,
            mint_authority_address: hathorAddress || 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
            allow_external_mint_authority_address: true,
            create_melt: true,
            data: ['ab', 'c'],
          },
          data: {
            blueprint_id: '000001291ad6218140ef41eef71f3c2fbeb000f6ddd592bc42c6cde9fa07a964',
            actions: [],
            args: ['76a914a3d942f602ea11b74c3b58d15531a35a80cab00388ac', '00', 1759997478],
          },
        },
      })
      addLog(`✅ Nano contract create token transaction: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Create nano contract create token failed: ${err}`)
    }
  }

  const requestFaucet = async () => {
    if (!hathorAddress) {
      addLog('❌ No Hathor address available. Get address first.')
      return
    }

    if (selectedNetwork !== 'testnet') {
      addLog('⚠️ Faucet is only available on testnet. Please switch to testnet first.')
      return
    }

    setIsLoadingFaucet(true)
    try {
      addLog(`🔄 Requesting faucet for ${selectedNetwork} address: ${hathorAddress}`)
      const data = await faucetMutation.mutateAsync({ address: hathorAddress })

      if (data.success) {
        addLog(`✅ Faucet transaction sent: ${data.hash}`)
        addLog(`🔗 You can view the transaction on the testnet explorer`)
      } else {
        addLog(`❌ Faucet failed: ${data.message}`)
      }
    } catch (err) {
      addLog(`❌ Request faucet failed: ${err}`)
      addLog(`ℹ️ Make sure the tRPC API server is running and accessible`)
    } finally {
      setIsLoadingFaucet(false)
    }
  }

  // Dozer-specific operations
  const dozerTestSwap = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    if (!hathorAddress) {
      addLog('❌ No Hathor address available. Get address first.')
      return
    }

    try {
      addLog('🔄 Testing Dozer swap via nano contract...')

      // Test values for HTR/DZR swap
      const poolManagerId =
        process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID ||
        '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'
      const htrToken = '00' // HTR token UUID
      const dzrToken =
        process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',')[0] ||
        '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      const amountIn = 1000 // 10.00 HTR (in cents)
      const fee = 100 // 1% fee (in basis points)

      addLog(`💰 Swapping ${amountIn / 100} HTR for DZR (fee: ${fee / 100}%)`)
      addLog(`📄 Pool Manager: ${poolManagerId}`)

      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'swap_exact_tokens_for_tokens',
          actions: [
            {
              type: 'deposit',
              token: htrToken,
              amount: amountIn,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'withdrawal',
              token: dzrToken,
              amount: 900, // Minimum 9.00 DZR out
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
          ],
          args: [fee],
        },
      })
      addLog(`✅ Dozer swap transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Dozer swap failed: ${err}`)
    }
  }

  const dozerAddLiquidity = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    if (!hathorAddress) {
      addLog('❌ No Hathor address available. Get address first.')
      return
    }

    try {
      addLog('🔄 Testing Dozer add liquidity via nano contract...')

      const poolManagerId =
        process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID ||
        '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'
      const htrToken = '00' // HTR token UUID
      const dzrToken =
        process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',')[0] ||
        '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      const amountA = 1000 // 10.00 HTR (in cents)
      const amountB = 1000 // 10.00 DZR (in cents)
      const fee = 100 // 1% fee (in basis points)

      addLog(`💰 Adding ${amountA / 100} HTR + ${amountB / 100} DZR liquidity (fee: ${fee / 100}%)`)
      addLog(`📄 Pool Manager: ${poolManagerId}`)

      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'add_liquidity',
          actions: [
            {
              type: 'deposit',
              token: htrToken,
              amount: amountA,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'deposit',
              token: dzrToken,
              amount: amountB,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
          ],
          args: [fee],
        },
      })
      addLog(`✅ Dozer add liquidity transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Dozer add liquidity failed: ${err}`)
    }
  }

  const dozerRemoveLiquidity = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    if (!hathorAddress) {
      addLog('❌ No Hathor address available. Get address first.')
      return
    }

    try {
      addLog('🔄 Testing Dozer remove liquidity via nano contract...')

      const poolManagerId =
        process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID ||
        '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'
      const htrToken = '00' // HTR token UUID
      const dzrToken =
        process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',')[0] ||
        '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      const minAmountA = 450 // 4.50 HTR minimum (in cents)
      const minAmountB = 450 // 4.50 DZR minimum (in cents)
      const fee = 100 // 1% fee (in basis points)

      addLog(`💰 Removing liquidity: min ${minAmountA / 100} HTR + ${minAmountB / 100} DZR (fee: ${fee / 100}%)`)
      addLog(`📄 Pool Manager: ${poolManagerId}`)
      addLog(`⚠️ Note: This requires LP tokens - will fail if you don't have any`)

      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'remove_liquidity',
          actions: [
            {
              type: 'withdrawal',
              token: htrToken,
              amount: minAmountA,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'withdrawal',
              token: dzrToken,
              amount: minAmountB,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
          ],
          args: [fee],
        },
      })
      addLog(`✅ Dozer remove liquidity transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Dozer remove liquidity failed: ${err}`)
    }
  }

  const dozerGetPoolState = async () => {
    if (!installedSnap) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Dozer pool state via API...')

      // Fetch pool data from the API (proper way)
      try {
        const response = await fetch('/api/trpc/getPools.all')
        const result = await response.json()
        const pools = result?.result?.data || []

        if (pools.length > 0) {
          addLog(`📊 Found ${pools.length} pools:`)
          pools.forEach((pool: any, index: number) => {
            addLog(
              `${index + 1}. ${pool.token0Symbol}/${pool.token1Symbol} - Fee: ${pool.fee}% - TVL: $${
                pool.totalValueLockedUSD || 'N/A'
              }`
            )
          })

          const htrDzrPool = pools.find(
            (pool: any) =>
              (pool.token0Symbol === 'HTR' && pool.token1Symbol === 'DZR') ||
              (pool.token0Symbol === 'DZR' && pool.token1Symbol === 'HTR')
          )

          if (htrDzrPool) {
            addLog(`🎯 HTR/DZR Pool Details:`)
            addLog(`   - Token0: ${htrDzrPool.token0Symbol} (${htrDzrPool.token0Uuid})`)
            addLog(`   - Token1: ${htrDzrPool.token1Symbol} (${htrDzrPool.token1Uuid})`)
            addLog(`   - Fee: ${htrDzrPool.fee}%`)
            addLog(`   - Volume 24h: $${htrDzrPool.volume24hUSD || 'N/A'}`)
          } else {
            addLog(`⚠️ HTR/DZR pool not found`)
          }
        } else {
          addLog('❌ No pools found')
        }
      } catch (apiError) {
        addLog(`❌ API call failed: ${apiError}`)
        addLog(`ℹ️ Make sure the tRPC server is running`)
      }
    } catch (err) {
      addLog(`❌ Get pool state failed: ${err}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* MetaMask Warning */}
      {!provider && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <Typography variant="sm" className="text-yellow-300 text-center">
            ⚠️ MetaMask not detected. Please install MetaMask extension and refresh the page.
            <br />
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              Download MetaMask
            </a>
          </Typography>
        </div>
      )}

      {/* Connection Status */}
      <Widget id="connection-status" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <Typography variant="h3" className="mb-4">
              🔗 Wallet Connection Status
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Typography variant="sm">Status: {isConnected ? 'Connected' : 'Disconnected'}</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${provider ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Typography variant="sm">Provider: {provider ? 'Available' : 'Not Found'}</Typography>
                </div>
                {account && (
                  <Typography variant="sm" className="text-gray-400 font-mono">
                    Account: {account.slice(0, 6)}...{account.slice(-4)}
                  </Typography>
                )}
                {installedSnap && (
                  <Typography variant="sm" className="text-blue-400">
                    Snap: {installedSnap.id}
                  </Typography>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={isConnected ? disconnectWallet : connectWallet}
                  variant={isConnected ? 'empty' : 'filled'}
                  className="w-full"
                >
                  {isConnected ? 'Disconnect' : 'Connect Wallet'}
                </Button>
                <Button onClick={checkConnection} variant="outlined" className="w-full" disabled={isCheckingConnection}>
                  {isCheckingConnection ? 'Checking...' : 'Refresh Status'}
                </Button>
                <Button onClick={checkMetaMaskAvailability} variant="outlined" className="w-full">
                  Debug MetaMask
                </Button>
              </div>
            </div>
          </div>
        </Widget.Content>
      </Widget>

      {/* Hathor Network Configuration */}
      <Widget id="hathor-network-config" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <Typography variant="h3" className="mb-4">
              🌐 Hathor Network Configuration
            </Typography>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Typography variant="sm" className="text-gray-400">
                  Current Network:
                </Typography>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      selectedNetwork === 'testnet' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                  ></span>
                  <Typography variant="sm" className="font-semibold capitalize">
                    {selectedNetwork}
                  </Typography>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => switchHathorNetwork('testnet')}
                  variant={selectedNetwork === 'testnet' ? 'filled' : 'outlined'}
                  disabled={!installedSnap}
                  className="h-[44px]"
                >
                  Switch to Testnet
                </Button>
                <Button
                  onClick={() => switchHathorNetwork('mainnet')}
                  variant={selectedNetwork === 'mainnet' ? 'filled' : 'outlined'}
                  disabled={!installedSnap}
                  className="h-[44px]"
                >
                  Switch to Mainnet
                </Button>
              </div>

              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <Typography variant="sm" className="text-yellow-300">
                  ℹ️ The faucet only works on testnet. Make sure to switch to testnet before requesting funds.
                </Typography>
              </div>
            </div>
          </div>
        </Widget.Content>
      </Widget>

      {/* Basic Wallet Operations */}
      <Widget id="wallet-operations" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <Typography variant="h3" className="mb-4">
              💼 Basic Wallet Operations
            </Typography>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={getAccountBalance} disabled={!isConnected}>
                Get Balance
              </Button>
              <Button onClick={getChainId} disabled={!isConnected}>
                Get Chain ID
              </Button>
              <Button onClick={switchToMainnet} disabled={!isConnected}>
                Switch to Mainnet
              </Button>
              <Button onClick={switchToSepolia} disabled={!isConnected}>
                Switch to Sepolia
              </Button>
            </div>
          </div>
        </Widget.Content>
      </Widget>

      {/* Snap Operations */}
      <Widget id="snap-operations" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <Typography variant="h3" className="mb-4">
              🧩 Snap Operations
            </Typography>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={snapId}
                  onChange={(e) => setSnapId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm"
                  placeholder="Snap ID (e.g., local:http://localhost:8089)"
                />
                <Button onClick={installSnap} disabled={!isConnected}>
                  Install Snap
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button onClick={invokeSnapMethod} disabled={!installedSnap}>
                  Invoke Snap Method
                </Button>
                <Button onClick={getSnaps} disabled={!isConnected}>
                  Get All Snaps
                </Button>
                <Button onClick={() => setInstalledSnap(null)} disabled={!installedSnap} variant="empty">
                  Clear Snap
                </Button>
              </div>
            </div>
          </div>
        </Widget.Content>
      </Widget>

      {/* Hathor Operations */}
      <Widget id="hathor-operations" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <Typography variant="h3" className="mb-4">
              🏛️ Hathor Operations
            </Typography>
            <div className="space-y-4">
              <Typography variant="sm" className="text-gray-400 mb-4">
                Hathor-specific snap methods for blockchain operations
              </Typography>

              {/* Address and Faucet Section */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Typography variant="sm" className="font-semibold text-blue-300">
                      Hathor Address ({selectedNetwork}):{' '}
                      {hathorAddress ? `${hathorAddress.slice(0, 8)}...${hathorAddress.slice(-8)}` : 'Not set'}
                    </Typography>
                    <Button
                      onClick={getHathorAddress}
                      variant="outlined"
                      className="px-3 h-[36px] text-xs font-semibold"
                      disabled={!isConnected || !installedSnap}
                    >
                      Get Address
                    </Button>
                  </div>

                  {hathorAddress && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selectedNetwork === 'testnet' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></span>
                        <Typography variant="xs" className="text-gray-400">
                          Faucet {selectedNetwork === 'testnet' ? 'available' : 'unavailable'} on {selectedNetwork}
                        </Typography>
                      </div>
                      <Button
                        onClick={requestFaucet}
                        variant="filled"
                        className="px-3 h-[36px] text-xs font-semibold"
                        disabled={!isConnected || !installedSnap || isLoadingFaucet || selectedNetwork !== 'testnet'}
                      >
                        {isLoadingFaucet
                          ? 'Requesting...'
                          : selectedNetwork === 'testnet'
                          ? 'Request Faucet'
                          : 'Testnet Required'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Operations */}
              <div>
                <Typography variant="sm" className="font-semibold mb-2 text-gray-300">
                  Basic Operations
                </Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={getHathorAddress}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Get Address
                  </Button>
                  <Button
                    onClick={getHathorBalance}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Get Balance
                  </Button>
                  <Button
                    onClick={getHathorNetwork}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Get Network
                  </Button>
                  <Button
                    onClick={getHathorUtxos}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Get UTXOs
                  </Button>
                </div>
              </div>

              {/* Transaction Operations */}
              <div>
                <Typography variant="sm" className="font-semibold mb-2 text-gray-300">
                  Transaction Operations
                </Typography>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Button
                    onClick={signHathorMessage}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Sign Message
                  </Button>
                  <Button
                    onClick={sendHathorTransaction}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Send Transaction
                  </Button>
                  <Button
                    onClick={createHathorToken}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Create Token
                  </Button>
                </div>
              </div>

              {/* Nano Contract Operations */}
              <div>
                <Typography variant="sm" className="font-semibold mb-2 text-gray-300">
                  Nano Contract Operations
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button
                    onClick={sendNanoContractTx}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Send Nano Contract
                  </Button>
                  <Button
                    onClick={signOracleData}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Sign Oracle Data
                  </Button>
                  <Button
                    onClick={createNanoContractCreateTokenTx}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!isConnected || !installedSnap}
                  >
                    Create Token + Contract
                  </Button>
                </div>
              </div>

              {/* Dozer Protocol Operations */}
              <div>
                <Typography variant="sm" className="font-semibold mb-2 text-gray-300">
                  Dozer Protocol Operations
                </Typography>
                <Typography variant="xs" className="text-gray-400 mb-3">
                  Test Dozer DEX functionality using the DozerPoolManager contract
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    onClick={dozerTestSwap}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                    disabled={!isConnected || !installedSnap || !hathorAddress}
                  >
                    Test Swap (HTR→DZR)
                  </Button>
                  <Button
                    onClick={dozerAddLiquidity}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-green-600 hover:bg-green-700"
                    disabled={!isConnected || !installedSnap || !hathorAddress}
                  >
                    Add Liquidity
                  </Button>
                  <Button
                    onClick={dozerRemoveLiquidity}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-red-600 hover:bg-red-700"
                    disabled={!isConnected || !installedSnap || !hathorAddress}
                  >
                    Remove Liquidity
                  </Button>
                  <Button
                    onClick={dozerGetPoolState}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-purple-600 hover:bg-purple-700"
                    disabled={!isConnected || !installedSnap}
                  >
                    Get Pool State
                  </Button>
                </div>

                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <Typography variant="xs" className="text-blue-300">
                    ℹ️ Pool Manager Contract:{' '}
                    {process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID ||
                      '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'}
                    <br />
                    Test Pool: HTR/DZR/100 (1% fee)
                    <br />
                    Amounts are in cents (100 = 1.00 HTR/DZR)
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </Widget.Content>
      </Widget>

      {/* Error Display */}
      {error && (
        <Widget id="error-display" maxWidth="full">
          <Widget.Content>
            <div className="p-4">
              <Typography variant="h3" className="mb-2 text-red-400">
                ❌ Error
              </Typography>
              <Typography variant="sm" className="text-red-300 font-mono">
                {error.message}
              </Typography>
            </div>
          </Widget.Content>
        </Widget>
      )}

      {/* Activity Logs */}
      <Widget id="activity-logs" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h3">📝 Activity Logs</Typography>
              <Button onClick={clearLogs} variant="outlined" size="sm">
                Clear Logs
              </Button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <Typography variant="sm" className="text-gray-400">
                  No activity yet. Try connecting your wallet or performing operations.
                </Typography>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-300">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Widget.Content>
      </Widget>

      {/* Debug Information */}
      {debugInfo && (
        <Widget id="debug-info" maxWidth="full">
          <Widget.Content>
            <div className="p-4">
              <Typography variant="h3" className="mb-4">
                🔍 Debug Information
              </Typography>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            </div>
          </Widget.Content>
        </Widget>
      )}

      {/* Implementation Guide */}
      <Widget id="implementation-guide" maxWidth="full">
        <Widget.Content>
          <div className="p-4">
            <Typography variant="h3" className="mb-4">
              📚 Implementation Guide
            </Typography>
            <div className="space-y-4 text-sm">
              <div>
                <Typography variant="sm" className="font-semibold mb-2">
                  1. Setup MetaMaskProvider
                </Typography>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {`import { MetaMaskProvider } from '@dozer/snap-utils'

function App() {
  return (
    <MetaMaskProvider>
      <YourApp />
    </MetaMaskProvider>
  )
}`}
                </pre>
              </div>

              <div>
                <Typography variant="sm" className="font-semibold mb-2">
                  2. Use Hooks in Components
                </Typography>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {`import { useMetaMaskContext, useRequest, useInvokeSnap } from '@dozer/snap-utils'

function HathorWalletButton() {
  const { provider, isConnected } = useMetaMaskContext()
  const request = useRequest()
  const invokeSnap = useInvokeSnap()
  
  const connect = async () => {
    await request({ method: 'eth_requestAccounts' })
  }
  
  const getHathorAddress = async () => {
    const result = await invokeSnap({
      snapId: 'local:http://localhost:8089',
      method: 'htr_getAddress',
      params: { type: 'index', index: 0 }
    })
    console.log('Hathor address:', result)
  }
  
  return (
    <div>
      <button onClick={connect}>Connect</button>
      <button onClick={getHathorAddress}>Get Hathor Address</button>
    </div>
  )
}`}
                </pre>
              </div>

              <div>
                <Typography variant="sm" className="font-semibold mb-2">
                  3. Snap Operations
                </Typography>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {`import { useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'

function HathorSnapComponent() {
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()
  
  const installHathorSnap = async () => {
    await requestSnap('local:http://localhost:8089')
  }
  
  const getHathorBalance = async () => {
    const result = await invokeSnap({
      snapId: 'local:http://localhost:8089',
      method: 'htr_getBalance',
      params: { tokens: ['00'] }
    })
    console.log('Balance:', result)
  }
  
  const getHathorAddress = async () => {
    const result = await invokeSnap({
      snapId: 'local:http://localhost:8089',
      method: 'htr_getAddress',
      params: { type: 'index', index: 0 }
    })
    console.log('Address:', result)
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </Widget.Content>
      </Widget>
    </div>
  )
}

const SnapUtilsDemoPage = () => {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-[80vh] max-w-2xl mx-auto">
          <Widget id="dev-only" maxWidth={600}>
            <Widget.Content>
              <div className="p-6 text-center">
                <Typography variant="h2" className="mb-4 text-red-400">
                  🚫 Development Only
                </Typography>
                <Typography variant="lg" className="text-gray-400">
                  This debug section is only available in development mode.
                </Typography>
              </div>
            </Widget.Content>
          </Widget>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col justify-center items-center min-h-[80vh] max-w-6xl mx-auto">
        <Widget id="snap-utils-demo" maxWidth={1200}>
          <Widget.Content>
            <div className="p-6">
              <Typography variant="h2" className="mb-2 text-center">
                🧩 Snap Utils Demo
              </Typography>
              <Typography variant="sm" className="mb-6 text-center text-gray-400">
                Comprehensive demonstration of Hathor network snap integration using @dozer/snap-utils
              </Typography>

              <MetaMaskProvider>
                <SnapUtilsDemo />
              </MetaMaskProvider>
            </div>
          </Widget.Content>
        </Widget>
      </div>
    </Layout>
  )
}

export default SnapUtilsDemoPage
