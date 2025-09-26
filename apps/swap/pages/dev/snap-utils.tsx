import { Layout } from '../../components/Layout'
import { Button, Widget, Typography } from '@dozer/ui'
import { useState, useEffect, useCallback, useRef } from 'react'
import { MetaMaskProvider, useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'
import { useJsonRpc } from '@dozer/higmi'
import { sendNanoContractTxRpcRequest } from '@hathor/hathor-rpc-handler'
import { api } from '../../utils/api'
import { useAccount } from '@dozer/zustand'

// Demo component that uses all the snap-utils hooks
const SnapUtilsDemo = () => {
  const { provider, error } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()
  const { hathorRpc, isRpcRequestPending, rpcResult } = useJsonRpc()
  const faucetMutation = api.getFaucet.sendHTR.useMutation()
  const utils = api.useUtils()

  // Use unified wallet state from Zustand store
  const {
    walletType,
    hathorAddress,
    isSnapInstalled,
    snapId,
    targetNetwork,
    currentNetwork,
    setCurrentNetwork,
    isNetworkMismatch,
    setWalletConnection,
    disconnectWallet: globalDisconnectWallet,
  } = useAccount()

  // Local state for the demo (separate from global wallet state)
  const [account, setAccount] = useState<string | null>(null)
  const [localSnapId, setLocalSnapId] = useState(snapId || 'local:http://localhost:8089')

  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [isLoadingFaucet, setIsLoadingFaucet] = useState(false)
  const hasCheckedConnection = useRef(false)

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }, [])

  // Helper function to check snap installation directly from MetaMask
  const checkSnapInstallation = useCallback(async (): Promise<{ id: string } | null> => {
    try {
      const snaps = await request({ method: 'wallet_getSnaps' }) as Record<string, any>
      const snapIds = [localSnapId || 'local:http://localhost:8089', 'npm:@hathor/snap']
      
      for (const snapId of snapIds) {
        if (snaps && snaps[snapId]) {
          return { id: snapId }
        }
      }
      return null
    } catch (error) {
      addLog(`⚠️ Failed to check snap installation: ${error}`)
      return null
    }
  }, [request, localSnapId, addLog])

  // Helper function to execute snap operations with dynamic snap check
  const executeSnapOperation = useCallback(async (
    operation: string,
    snapMethod: (snapId: string) => Promise<void>
  ) => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog(`❌ No snap installed for ${operation}`)
      return
    }

    try {
      await snapMethod(snapStatus.id)
    } catch (err) {
      addLog(`❌ ${operation} failed: ${err}`)
    }
  }, [checkSnapInstallation, addLog])

  const checkConnection = useCallback(async () => {
    if (isCheckingConnection) return // Prevent multiple simultaneous checks

    setIsCheckingConnection(true)
    try {
      const accounts = await request({ method: 'eth_accounts' })
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setIsConnected(true)
        addLog(`✅ Connected to account: ${accounts[0]}`)

        // Also log current wallet state from Zustand
        if (walletType) {
          addLog(`📱 Wallet type: ${walletType}`)
          if (hathorAddress) {
            addLog(`🏛️ Hathor address: ${hathorAddress}`)
          }
          if (currentNetwork) {
            addLog(`🌐 Current network: ${currentNetwork}`)
          }
          addLog(`🎯 Target network: ${targetNetwork}`)
          if (isNetworkMismatch()) {
            addLog(`⚠️ Network mismatch detected!`)
          }
        }
      } else {
        setIsConnected(false)
        addLog('❌ No accounts connected')
      }
    } catch (err) {
      addLog(`❌ Error checking connection: ${err}`)
    } finally {
      setIsCheckingConnection(false)
    }
  }, [
    request,
    addLog,
    isCheckingConnection,
    walletType,
    hathorAddress,
    currentNetwork,
    targetNetwork,
    isNetworkMismatch,
  ])

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
        // Also update global wallet state for consistency
        setWalletConnection({ address: accounts[0] as string })
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
      // Use global disconnect function
      globalDisconnectWallet()
      // Also clear local demo state
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
      addLog(`🔄 Installing Hathor snap: ${localSnapId}`)
      // For local snaps, don't provide a version - MetaMask expects empty object
      const result = await requestSnap(localSnapId || 'local:http://localhost:8089')
      addLog(`✅ Hathor snap installed: ${result?.id}`)
      // Don't store local state - always check with MetaMask directly
    } catch (err) {
      addLog(`❌ Snap installation failed: ${err}`)
    }
  }

  const invokeSnapMethod = async () => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Invoking Hathor snap method...')
      const result = await invokeSnap({
        snapId: snapStatus.id,
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
    await executeSnapOperation('Getting Hathor balance', async (snapId) => {
      addLog('🔄 Getting Hathor balance...')
      const result = await invokeSnap({
        snapId,
        method: 'htr_getBalance',
        params: { tokens: ['00', '00000337f9db18c355a376697f64fd6e36945fc984d6569b4b0d86e2af185945'] },
      })
      addLog(`✅ Hathor balance: ${JSON.stringify(result)}`)
    })
  }

  const getHathorNetwork = async () => {
    await executeSnapOperation('Getting Hathor network', async (snapId) => {
      addLog('🔄 Getting Hathor network...')
      const result = await invokeSnap({
        snapId,
        method: 'htr_getConnectedNetwork',
        params: {},
      })
      addLog(`✅ Hathor network: ${JSON.stringify(result)}`)
    })
  }

  const getHathorUtxos = async () => {
    await executeSnapOperation('Getting Hathor UTXOs', async (snapId) => {
      addLog('🔄 Getting Hathor UTXOs...')
      const result = await invokeSnap({
        snapId,
        method: 'htr_getUtxos',
        params: {},
      })
      addLog(`✅ Hathor UTXOs: ${JSON.stringify(result)}`)
    })
  }

  const signHathorMessage = async () => {
    await executeSnapOperation('Signing Hathor message', async (snapId) => {
      addLog('🔄 Signing Hathor message...')
      const result = await invokeSnap({
        snapId,
        method: 'htr_signWithAddress',
        params: { message: 'test message', addressIndex: 0 },
      })
      addLog(`✅ Hathor signature: ${JSON.stringify(result)}`)
    })
  }

  const getHathorAddress = async () => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Hathor address...')
      const result = await invokeSnap({
        snapId: snapStatus.id,
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
      interface SnapResponse {
        response?: { address?: string }
        address?: string
      }
      const address = (parsedResult as SnapResponse)?.response?.address || (parsedResult as SnapResponse)?.address
      if (address) {
        // Update global wallet state with Hathor address
        setWalletConnection({ hathorAddress: address })
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
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Sending Hathor transaction...')
      const result = await invokeSnap({
        snapId: snapStatus.id,
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
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Creating Hathor token...')
      const result = await invokeSnap({
        snapId: snapStatus.id,
        method: 'htr_createToken',
        params: {
          name: 'Test Token',
          symbol: 'TST',
          amount: '100',
          // address: hathorAddress || 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
          // change_address: hathorAddress || 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK',
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
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Sending nano contract transaction...')
      const result = await invokeSnap({
        snapId: snapStatus.id,
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
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Signing oracle data...')
      const result = await invokeSnap({
        snapId: snapStatus.id,
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
    if (!snapId) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog(`🔄 Switching Hathor network to ${network}...`)

      // First check current network
      // const currentNet = await walletService.getCurrentNetwork(invokeSnap, snapId)
      // if (currentNet === network) {
      //   addLog(`✅ Already on ${network} network`)
      //   setCurrentNetwork(network)
      //   return
      // }

      const result = await invokeSnap({
        snapId: snapId,
        method: 'htr_changeNetwork',
        params: { newNetwork: network },
      })

      // Update the unified state
      setCurrentNetwork(network)
      addLog(`✅ Network switched to ${network}: ${JSON.stringify(result)}`)
      addLog('ℹ️ Address may have changed - get new address for the network')
    } catch (err) {
      addLog(`❌ Switch network failed: ${err}`)
      addLog(`ℹ️ Make sure your snap supports the htr_changeNetwork method`)
    }
  }

  const createNanoContractCreateTokenTx = async () => {
    await executeSnapOperation('Creating nano contract create token transaction', async (snapId) => {
      addLog('🔄 Creating nano contract create token transaction...')
      const result = await invokeSnap({
        snapId,
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
    })
  }

  const requestFaucet = async () => {
    if (!hathorAddress) {
      addLog('❌ No Hathor address available. Get address first.')
      return
    }

    // Use current network from unified state
    const networkToCheck = currentNetwork || targetNetwork
    if (networkToCheck !== 'testnet') {
      addLog('⚠️ Faucet is only available on testnet. Please switch to testnet first.')
      addLog(`🔄 Current network: ${networkToCheck}, Target: ${targetNetwork}`)
      return
    }

    setIsLoadingFaucet(true)
    try {
      addLog(`🔄 Requesting faucet for ${networkToCheck} address: ${hathorAddress}`)
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
    addLog('🔍 DIRECT SNAP CALL - Debug Info:')
    const snapStatus = await checkSnapInstallation()
    addLog(`🔍 snapStatus: ${JSON.stringify(snapStatus)}`)
    addLog(`🔍 snapStatus.id: ${snapStatus?.id}`)
    addLog(`🔍 invokeSnap available: ${!!invokeSnap}`)
    addLog(`🔍 hathorAddress: ${hathorAddress}`)

    if (!snapStatus) {
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

      const snapCallParams = {
        snapId: snapStatus.id,
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
      }

      addLog(`🔍 DIRECT SNAP CALL - Calling invokeSnap with: ${JSON.stringify(snapCallParams, null, 2)}`)

      const result = await invokeSnap(snapCallParams)

      addLog(`🔍 DIRECT SNAP CALL - Raw result: ${JSON.stringify(result, null, 2)}`)
      addLog(`✅ Dozer swap transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Dozer swap failed: ${err}`)
    }
  }

  const dozerAddLiquidity = async () => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
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
        snapId: snapStatus.id,
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
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
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
        snapId: snapStatus.id,
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

  // Enhanced Dozer operations using real APIs
  const dozerGetPoolState = async () => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus) {
      addLog('❌ No snap installed')
      return
    }

    try {
      addLog('🔄 Getting Dozer pool state via tRPC API...')

      // Use the proper tRPC API
      const pools = await utils.getPools.all.fetch()
      const tokens = await utils.getTokens.all.fetch()

      if (pools && pools.length > 0) {
        addLog(`📊 Found ${pools.length} pools:`)
        pools.slice(0, 5).forEach((pool, index) => {
          addLog(
            `${index + 1}. ${pool.token0.symbol}/${pool.token1.symbol} - Fee: ${pool.swapFee}% - TVL: $${
              pool.liquidityUSD || 'N/A'
            }`
          )
        })

        // Find specific pools for debugging
        const htrDzrPool = pools.find(
          (pool) =>
            (pool.token0.symbol === 'HTR' && pool.token1.symbol === 'DZR') ||
            (pool.token0.symbol === 'DZR' && pool.token1.symbol === 'HTR')
        )

        const hUSDCPool = pools.find(
          (pool) =>
            pool.token0.symbol === 'hUSDC' || pool.token1.symbol === 'hUSDC'
        )

        if (htrDzrPool) {
          addLog(`🎯 HTR/DZR Pool:`)
          addLog(`   - Tokens: ${htrDzrPool.token0.symbol}/${htrDzrPool.token1.symbol}`)
          addLog(`   - Fee: ${htrDzrPool.swapFee}% - TVL: $${htrDzrPool.liquidityUSD || 'N/A'}`)
        }

        if (hUSDCPool) {
          addLog(`💰 hUSDC Pool:`)
          addLog(`   - Tokens: ${hUSDCPool.token0.symbol}/${hUSDCPool.token1.symbol}`)
          addLog(`   - Fee: ${hUSDCPool.swapFee}% - TVL: $${hUSDCPool.liquidityUSD || 'N/A'}`)
        }

        // Show token information
        const hUSDCToken = tokens?.find(token => token.symbol === 'hUSDC')
        if (hUSDCToken) {
          addLog(`🏦 hUSDC Token: ${hUSDCToken.uuid}`)
        }
      } else {
        addLog('❌ No pools found')
      }
    } catch (err) {
      addLog(`❌ Get pool state failed: ${err}`)
    }
  }

  const dozerGetSwapQuote = async (fromToken: string, toToken: string, amount: number) => {
    try {
      addLog(`🔍 Getting swap quote: ${amount} ${fromToken} → ${toToken}`)
      
      // Get tokens to find UUIDs
      const tokens = await utils.getTokens.all.fetch()
      const fromTokenData = tokens?.find(t => t.symbol === fromToken)
      const toTokenData = tokens?.find(t => t.symbol === toToken)

      if (!fromTokenData || !toTokenData) {
        addLog(`❌ Token not found: ${fromToken} or ${toToken}`)
        return null
      }

      const quote = await utils.getPools.quote.fetch({
        amountIn: amount,
        tokenIn: fromTokenData.uuid,
        tokenOut: toTokenData.uuid,
        maxHops: 3
      })

      if (quote) {
        addLog(`💹 Quote Result:`)
        addLog(`   - Amount In: ${amount} ${fromToken}`)
        addLog(`   - Amount Out: ${quote.amountOut} ${toToken}`)
        addLog(`   - Price Impact: ${quote.priceImpact}%`)
        addLog(`   - Path: ${quote.path}`)
        return quote
      } else {
        addLog(`❌ No quote available`)
        return null
      }
    } catch (err) {
      addLog(`❌ Get quote failed: ${err}`)
      return null
    }
  }

  const dozerSwapWithRealQuote = async (fromToken: string, toToken: string, amount: number) => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus || !hathorAddress) {
      addLog('❌ Wallet not connected')
      return
    }

    try {
      addLog(`🔄 Executing real swap: ${amount} ${fromToken} → ${toToken}`)
      
      // Get the quote first
      const quote = await dozerGetSwapQuote(fromToken, toToken, amount)
      if (!quote) {
        addLog('❌ Cannot get quote for swap')
        return
      }

      // Use hardcoded token UUIDs like the working examples
      const poolManagerId = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'
      
      let fromTokenUUID = '00' // HTR default
      let toTokenUUID = '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8' // DZR default
      
      // Set token UUIDs based on symbols
      if (fromToken === 'HTR') fromTokenUUID = '00'
      if (fromToken === 'DZR') fromTokenUUID = '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      if (fromToken === 'hUSDC') fromTokenUUID = process.env.NEXT_PUBLIC_hUSDC_UUID || '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      
      if (toToken === 'HTR') toTokenUUID = '00'
      if (toToken === 'DZR') toTokenUUID = '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      if (toToken === 'hUSDC') toTokenUUID = process.env.NEXT_PUBLIC_hUSDC_UUID || '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'

      // Calculate minimum amount out (5% slippage)
      const minAmountOut = quote.amountOut * 0.95
      const amountInCents = Math.round(amount * 100)
      const minAmountOutCents = Math.round(minAmountOut * 100)

      addLog(`📋 Swap Details:`)
      addLog(`   - From: ${amount} ${fromToken} (${fromTokenUUID})`)
      addLog(`   - To: ${quote.amountOut} ${toToken} (${toTokenUUID})`)
      addLog(`   - Min Out: ${minAmountOut} ${toToken}`)
      addLog(`   - Path: ${quote.path}`)

      // Copy the exact working pattern from existing dozerSwap function
      const result = await invokeSnap({
        snapId: snapStatus.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'swap_exact_tokens_for_tokens',
          actions: [
            {
              type: 'withdrawal',
              token: fromTokenUUID,
              amount: amountInCents,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'withdrawal', 
              token: toTokenUUID,
              amount: minAmountOutCents,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
          ],
          args: [
            amountInCents, // amountIn in cents
            minAmountOutCents, // minAmountOut in cents
            quote.path || `${fromTokenUUID}/${toTokenUUID}/100`, // path from quote or constructed
            hathorAddress, // to address
          ],
        },
      })

      addLog(`✅ Swap transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Swap failed: ${err}`)
    }
  }

  // hUSDC specific operations for debugging
  const dozerSwapHTRToHUSDC = async () => {
    addLog('💰 Testing HTR → hUSDC swap with real quote...')
    await dozerSwapWithRealQuote('HTR', 'hUSDC', 100) // 100 HTR to hUSDC
  }

  const dozerSwapHUSDCToHTR = async () => {
    addLog('💰 Testing hUSDC → HTR swap with real quote...')
    await dozerSwapWithRealQuote('hUSDC', 'HTR', 50) // 50 hUSDC to HTR
  }

  const dozerSwapHUSDCToDZR = async () => {
    addLog('💰 Testing hUSDC → DZR swap with real quote...')
    await dozerSwapWithRealQuote('hUSDC', 'DZR', 25) // 25 hUSDC to DZR
  }

  const dozerAddLiquidityHTRHUSDC = async () => {
    const snapStatus = await checkSnapInstallation()
    if (!snapStatus || !hathorAddress) {
      addLog('❌ Wallet not connected')
      return
    }

    try {
      addLog('🔄 Adding HTR/hUSDC liquidity...')
      
      // Use the same pattern as the working add liquidity function
      const poolManagerId = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || '00003274b072d50f82a62d75277f8dcff83c6e35c4a8314c207f8a2cc24fa4bc'
      const htrToken = '00' // HTR token UUID
      const hUSDCToken = process.env.NEXT_PUBLIC_hUSDC_UUID || '000000006c82966f45145fdc6caef7676ecbbbe7a0e7fc3025b9b69e217db7d8'
      const amountHTR = 5000 // 50.00 HTR (in cents)
      const amountHUSDC = 2500 // 25.00 hUSDC (in cents)
      const fee = 100 // 1% fee (in basis points)

      addLog(`💰 Adding ${amountHTR / 100} HTR + ${amountHUSDC / 100} hUSDC liquidity (fee: ${fee / 100}%)`)
      addLog(`📄 Pool Manager: ${poolManagerId}`)
      addLog(`🏦 hUSDC Token: ${hUSDCToken}`)

      // Copy the exact working pattern from dozerAddLiquidity
      const result = await invokeSnap({
        snapId: snapStatus.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'add_liquidity',
          actions: [
            {
              type: 'deposit',
              token: htrToken,
              amount: amountHTR,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'deposit',
              token: hUSDCToken,
              amount: amountHUSDC,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
          ],
          args: [fee],
        },
      })

      addLog(`✅ HTR/hUSDC liquidity transaction sent: ${JSON.stringify(result)}`)
    } catch (err) {
      addLog(`❌ Add HTR/hUSDC liquidity failed: ${err}`)
    }
  }

  const dozerTestAllHUSDCOperations = async () => {
    addLog('🚀 Running comprehensive hUSDC test suite...')
    
    // First get pool state to see what's available
    await dozerGetPoolState()
    
    // Test quotes for different hUSDC pairs
    await dozerGetSwapQuote('HTR', 'hUSDC', 100)
    await dozerGetSwapQuote('hUSDC', 'HTR', 50)
    await dozerGetSwapQuote('hUSDC', 'DZR', 25)
    await dozerGetSwapQuote('DZR', 'hUSDC', 1000)
    
    addLog('📊 hUSDC test suite completed - check quotes above')
  }

  const dozerTestSwapViaJsonRpc = async () => {
    addLog('🔍 JSONRPC CALL - Debug Info:')
    addLog(`🔍 hathorRpc available: ${!!hathorRpc}`)
    addLog(`🔍 isRpcRequestPending: ${isRpcRequestPending}`)
    addLog(`🔍 rpcResult: ${JSON.stringify(rpcResult)}`)
    addLog(`🔍 hathorAddress: ${hathorAddress}`)
    const snapStatus = await checkSnapInstallation()
    addLog(`🔍 snapStatus: ${JSON.stringify(snapStatus)}`)
    addLog(`🔍 snapStatus.id: ${snapStatus?.id}`)
    addLog(`🔍 invokeSnap available: ${!!invokeSnap}`)

    if (!hathorRpc) {
      addLog('❌ No RPC available. Make sure wallet is connected.')
      return
    }

    if (!hathorAddress) {
      addLog('❌ No Hathor address available. Get address first.')
      return
    }

    try {
      addLog('🔄 Testing Dozer swap via JsonRpcContext (MetaMask Snap)...')
      addLog(`⏳ RPC Status: ${isRpcRequestPending ? 'Pending' : 'Ready'}`)

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

      const ncTxRpcReq = sendNanoContractTxRpcRequest(
        'swap_exact_tokens_for_tokens',
        poolManagerId,
        [
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
        [fee],
        false, // isBlueprint
        null // ncId
      )

      addLog(`🔍 JSONRPC CALL - RPC Request: ${JSON.stringify(ncTxRpcReq, null, 2)}`)
      addLog(`📤 Sending nano contract transaction via JsonRpcContext...`)

      const result = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

      addLog(`🔍 JSONRPC CALL - Raw result: ${JSON.stringify(result, null, 2)}`)
      addLog(`✅ Dozer swap transaction sent via JsonRpcContext: ${JSON.stringify(result)}`)

      // Log RPC result if available
      if (rpcResult) {
        addLog(`📊 RPC Result: ${JSON.stringify(rpcResult)}`)
      }
    } catch (err) {
      addLog(`❌ Dozer swap via JsonRpcContext failed: ${err}`)

      // Log RPC result if available (might contain error details)
      if (rpcResult) {
        addLog(`📊 RPC Error Result: ${JSON.stringify(rpcResult)}`)
      }
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
                  <span className={`w-3 h-3 rounded-full ${walletType ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Typography variant="sm">Status: {walletType ? `Connected (${walletType})` : 'Disconnected'}</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${provider ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Typography variant="sm">Provider: {provider ? 'Available' : 'Not Found'}</Typography>
                </div>
                {(account || hathorAddress) && (
                  <Typography variant="sm" className="text-gray-400 font-mono">
                    Account: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : hathorAddress ? `${hathorAddress.slice(0, 6)}...${hathorAddress.slice(-4)}` : 'N/A'}
                  </Typography>
                )}
                {isSnapInstalled && (
                  <Typography variant="sm" className="text-blue-400">
                    Snap: {snapId || 'Installed'}
                  </Typography>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={walletType ? disconnectWallet : connectWallet}
                  variant={walletType ? 'empty' : 'filled'}
                  className="w-full"
                >
                  {walletType ? 'Disconnect' : 'Connect Wallet'}
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
                      (currentNetwork || targetNetwork) === 'testnet' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                  ></span>
                  <Typography variant="sm" className="font-semibold capitalize">
                    {currentNetwork || targetNetwork} {currentNetwork !== targetNetwork ? '(mismatch!)' : ''}
                  </Typography>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => switchHathorNetwork('testnet')}
                  variant={(currentNetwork || targetNetwork) === 'testnet' ? 'filled' : 'outlined'}
                  disabled={!isSnapInstalled || !snapId}
                  className="h-[44px]"
                >
                  Switch to Testnet
                </Button>
                <Button
                  onClick={() => switchHathorNetwork('mainnet')}
                  variant={(currentNetwork || targetNetwork) === 'mainnet' ? 'filled' : 'outlined'}
                  disabled={!isSnapInstalled || !snapId}
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
                  value={localSnapId || ''}
                  onChange={(e) => setLocalSnapId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm"
                  placeholder="Snap ID (e.g., local:http://localhost:8089)"
                />
                <Button onClick={installSnap} disabled={!walletType}>
                  Install/Reinstall Snap
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button onClick={invokeSnapMethod} disabled={!isSnapInstalled || !localSnapId}>
                  Invoke Snap Method
                </Button>
                <Button onClick={getSnaps} disabled={!isConnected}>
                  Get All Snaps
                </Button>
                <Button onClick={async () => {
                  const snapStatus = await checkSnapInstallation()
                  if (snapStatus) {
                    addLog(`🔄 Snap found: ${snapStatus.id}`)
                  } else {
                    addLog('❌ No snap currently installed')
                  }
                }} variant="outlined">
                  Check Snap Status
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
                      Hathor Address ({currentNetwork || targetNetwork}):{' '}
                      {hathorAddress ? `${hathorAddress.slice(0, 8)}...${hathorAddress.slice(-8)}` : 'Not set'}
                    </Typography>
                    <Button
                      onClick={getHathorAddress}
                      variant="outlined"
                      className="px-3 h-[36px] text-xs font-semibold"
                      disabled={!walletType || !isSnapInstalled || !snapId}
                    >
                      Get Address
                    </Button>
                  </div>

                  {hathorAddress && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            (currentNetwork || targetNetwork) === 'testnet' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></span>
                        <Typography variant="xs" className="text-gray-400">
                          Faucet {(currentNetwork || targetNetwork) === 'testnet' ? 'available' : 'unavailable'} on{' '}
                          {currentNetwork || targetNetwork}
                        </Typography>
                      </div>
                      <Button
                        onClick={requestFaucet}
                        variant="filled"
                        disabled={!hathorAddress || (currentNetwork || targetNetwork) !== 'testnet' || isLoadingFaucet}
                        className="px-3 h-[36px] text-xs font-semibold"
                      >
                        {isLoadingFaucet
                          ? 'Requesting...'
                          : (currentNetwork || targetNetwork) === 'testnet'
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
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Get Address
                  </Button>
                  <Button
                    onClick={getHathorBalance}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Get Balance
                  </Button>
                  <Button
                    onClick={getHathorNetwork}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Get Network
                  </Button>
                  <Button
                    onClick={getHathorUtxos}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
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
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Sign Message
                  </Button>
                  <Button
                    onClick={sendHathorTransaction}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Send Transaction
                  </Button>
                  <Button
                    onClick={createHathorToken}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
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
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Send Nano Contract
                  </Button>
                  <Button
                    onClick={signOracleData}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Sign Oracle Data
                  </Button>
                  <Button
                    onClick={createNanoContractCreateTokenTx}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold"
                    disabled={!walletType || !isSnapInstalled}
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
                    disabled={!walletType || !isSnapInstalled || !hathorAddress}
                  >
                    Test Swap (HTR→DZR)
                  </Button>
                  <Button
                    onClick={dozerTestSwapViaJsonRpc}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-cyan-600 hover:bg-cyan-700"
                    disabled={!walletType || !isSnapInstalled || !hathorAddress || !hathorRpc}
                  >
                    Test Swap via JsonRpc
                  </Button>
                  <Button
                    onClick={dozerAddLiquidity}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-green-600 hover:bg-green-700"
                    disabled={!walletType || !isSnapInstalled || !hathorAddress}
                  >
                    Add Liquidity
                  </Button>
                  <Button
                    onClick={dozerRemoveLiquidity}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-red-600 hover:bg-red-700"
                    disabled={!walletType || !isSnapInstalled || !hathorAddress}
                  >
                    Remove Liquidity
                  </Button>
                  <Button
                    onClick={dozerGetPoolState}
                    variant="filled"
                    className="px-3 h-[44px] text-sm font-semibold bg-purple-600 hover:bg-purple-700"
                    disabled={!walletType || !isSnapInstalled}
                  >
                    Get Pool State (Enhanced)
                  </Button>
                </div>

                {/* hUSDC Testing Section */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <Typography variant="sm" className="font-semibold mb-2 text-gray-300">
                    🏦 hUSDC Operations
                  </Typography>
                  <Typography variant="xs" className="text-gray-400 mb-3">
                    Test hUSDC token operations with real quotes and transactions
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button
                      onClick={dozerTestAllHUSDCOperations}
                      variant="filled"
                      className="px-3 h-[44px] text-sm font-semibold bg-indigo-600 hover:bg-indigo-700"
                      disabled={!walletType || !isSnapInstalled}
                    >
                      Test All hUSDC Quotes
                    </Button>
                    <Button
                      onClick={dozerSwapHTRToHUSDC}
                      variant="filled"
                      className="px-3 h-[44px] text-sm font-semibold bg-cyan-600 hover:bg-cyan-700"
                      disabled={!walletType || !isSnapInstalled || !hathorAddress}
                    >
                      Swap HTR → hUSDC
                    </Button>
                    <Button
                      onClick={dozerSwapHUSDCToHTR}
                      variant="filled"
                      className="px-3 h-[44px] text-sm font-semibold bg-teal-600 hover:bg-teal-700"
                      disabled={!walletType || !isSnapInstalled || !hathorAddress}
                    >
                      Swap hUSDC → HTR
                    </Button>
                    <Button
                      onClick={dozerSwapHUSDCToDZR}
                      variant="filled"
                      className="px-3 h-[44px] text-sm font-semibold bg-emerald-600 hover:bg-emerald-700"
                      disabled={!walletType || !isSnapInstalled || !hathorAddress}
                    >
                      Swap hUSDC → DZR
                    </Button>
                    <Button
                      onClick={dozerAddLiquidityHTRHUSDC}
                      variant="filled"
                      className="px-3 h-[44px] text-sm font-semibold bg-pink-600 hover:bg-pink-700"
                      disabled={!walletType || !isSnapInstalled || !hathorAddress}
                    >
                      Add HTR/hUSDC Liquidity
                    </Button>
                  </div>
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
