import { FC, useState, useEffect } from 'react'
import { useAccount, useNetwork } from '@dozer/zustand'
import { Button, Widget, classNames } from '@dozer/ui'
import { useBridge } from '@dozer/higmi'
import { Token } from '@dozer/currency'
import Image from 'next/legacy/image'
import { ArrowTopRightOnSquareIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/solid'
import { api } from 'utils/api'
import bridgeIcon from '../../public/bridge-icon.jpeg'
import { CurrencyInput } from '../CurrencyInput'
import { TradeType } from '../utils/TradeType'

interface BridgeProps {
  initialToken?: Token
}

export const Bridge: FC<BridgeProps> = ({ initialToken }) => {
  const network = useNetwork((state) => state.network)
  const { data: tokens } = api.getTokens.all.useQuery()
  const { data: prices } = api.getPrices.all.useQuery()
  
  const [bridgeDirection, setBridgeDirection] = useState<'toHathor' | 'toArbitrum'>('toHathor')
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(initialToken)
  const [amount, setAmount] = useState<string>('')
  const [hathorAddress, setHathorAddress] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { connection, connectArbitrum, disconnectArbitrum, bridgeTokenToHathor, pendingClaims, loadPendingClaims } = useBridge()
  
  // Filter to only show bridged tokens
  const bridgedTokens = tokens
    ? tokens
        .filter((token) => token.bridged)
        .map((token) => new Token(token))
    : []
  
  const navigateToClaims = () => {
    window.location.href = '/bridge/claims'
  }
  
  useEffect(() => {
    if (initialToken) {
      setSelectedToken(initialToken)
    }
  }, [initialToken])
  
  useEffect(() => {
    // Load pending claims when component mounts or when Arbitrum connection status changes
    if (connection.arbitrumConnected) {
      loadPendingClaims();
    }
  }, [connection.arbitrumConnected, loadPendingClaims]);
  
  const handleMetaMaskConnect = async () => {
    try {
      await connectArbitrum()
    } catch (error) {
      console.error('Failed to connect MetaMask:', error)
    }
  }
  
  const handleBridge = async () => {
    if (!selectedToken || !amount || !connection.arbitrumAddress) return
    
    setIsProcessing(true)
    try {
      if (bridgeDirection === 'toHathor') {
        // Bridge from Arbitrum to Hathor
        await bridgeTokenToHathor(
          selectedToken.originalAddress || '',
          amount,
          hathorAddress || ''
        )
      } else {
        // Bridge from Hathor to Arbitrum
        // This would need to be implemented with the Hathor wallet
        console.log('Bridging from Hathor to Arbitrum is not implemented yet')
      }
    } catch (error) {
      console.error('Bridge operation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const toggleBridgeDirection = () => {
    setBridgeDirection(bridgeDirection === 'toHathor' ? 'toArbitrum' : 'toHathor')
  }
  
  return (
    <Widget id="bridge" maxWidth={400}>
      <Widget.Content>
        <div className="p-3 pb-4 font-medium">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Token Bridge</span>
            <div className="flex items-center">
              <Image 
                src={bridgeIcon} 
                width={24} 
                height={24} 
                alt="Bridge" 
                className="object-cover rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-stone-800">
          <div className="flex justify-between mb-4">
            <div className={classNames(
              "py-2 px-3 rounded-lg cursor-pointer transition-all",
              bridgeDirection === 'toHathor' ? "bg-blue-600" : "bg-stone-700"
            )} onClick={() => setBridgeDirection('toHathor')}>
              Arbitrum → Hathor
            </div>
            <div className={classNames(
              "py-2 px-3 rounded-lg cursor-pointer transition-all",
              bridgeDirection === 'toArbitrum' ? "bg-blue-600" : "bg-stone-700"
            )} onClick={() => setBridgeDirection('toArbitrum')}>
              Hathor → Arbitrum
            </div>
          </div>

          <CurrencyInput
            id={'bridge-token-input'}
            className="p-3"
            value={amount}
            onChange={setAmount}
            currency={selectedToken}
            onSelect={setSelectedToken}
            chainId={network}
            inputType={TradeType.EXACT_INPUT}
            tradeType={TradeType.EXACT_INPUT}
            prices={prices || {}}
            tokens={bridgedTokens}
          />
          
          {bridgeDirection === 'toHathor' && (
            <div className="mt-4 mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Hathor Address
              </label>
              <input
                type="text"
                className="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Hathor address"
                value={hathorAddress}
                onChange={(e) => setHathorAddress(e.target.value)}
              />
            </div>
          )}
          
          <div className="mt-4">
            {!connection.arbitrumConnected ? (
              <Button 
                fullWidth 
                size="md" 
                color="blue"
                onClick={handleMetaMaskConnect}
              >
                Connect MetaMask
              </Button>
            ) : (
              <Button 
                fullWidth 
                size="md" 
                color="blue"
                onClick={handleBridge}
                disabled={!selectedToken || !amount || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Bridge Token'}
              </Button>
            )}
          </div>
          
          {pendingClaims.length > 0 && (
            <div className="mt-4 p-3 border border-yellow-600 bg-yellow-900/20 rounded-lg">
              <h3 className="mb-2 text-sm font-bold text-yellow-500">Pending Claims</h3>
              <p className="text-xs text-yellow-300">
                You have {pendingClaims.length} pending claim(s) available.
              </p>
              <Button 
                fullWidth 
                size="sm" 
                color="yellow"
                className="mt-2"
                onClick={navigateToClaims}
              >
                View Claims
              </Button>
            </div>
          )}
        </div>
      </Widget.Content>
    </Widget>
  )
}
