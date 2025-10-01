import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const { hUSDC_UUID } = process.env

export type WalletType = 'walletconnect' | 'metamask-snap' | null

export interface TokenBalance {
  token_uuid: string
  token_symbol: string
  token_balance: number
}

export interface WalletConnection {
  walletType: WalletType
  // For WalletConnect: this is the Hathor address
  // For MetaMask: this is the ETH address from MetaMask
  address: string
  // For MetaMask Snap: this is the Hathor address from the snap
  // For WalletConnect: this is the same as address
  hathorAddress: string
  // MetaMask Snap specific fields
  isSnapInstalled: boolean
  snapId: string | null
  // Network state
  selectedNetwork: 'mainnet' | 'testnet'
}

export interface AccountState extends WalletConnection {
  // Legacy address field for backward compatibility
  address: string
  setAddress: (address: string) => void
  
  // New wallet connection methods
  setWalletConnection: (connection: Partial<WalletConnection>) => void
  disconnectWallet: () => void
  
  // Network management
  targetNetwork: 'mainnet' | 'testnet'
  currentNetwork: 'mainnet' | 'testnet' | null
  setCurrentNetwork: (network: 'mainnet' | 'testnet') => void
  isNetworkMismatch: () => boolean
  
  // Balance and notifications (unchanged)
  balance: TokenBalance[]
  setBalance: (balance: TokenBalance[]) => void
  notifications: Record<number, string[]>
  setNotifications: (notifications: Record<number, string[]>) => void
  clearNotifications: () => void
  updateNotificationLastState: (txHash: string, last_status: string, last_message: string) => void
  updateNotificationStatus: (txHash: string, status: string, message?: string) => void
  addNotification: (notification: string[]) => void
  zealyIdentity: string
  setZealyIdentity: (identity: string) => void
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      // Wallet connection state
      walletType: null as WalletType,
      address: '',
      hathorAddress: '',
      isSnapInstalled: false,
      snapId: null as string | null,
      selectedNetwork: 'testnet' as 'mainnet' | 'testnet',
      
      // Network management
      targetNetwork: 'testnet' as 'mainnet' | 'testnet',
      currentNetwork: null as 'mainnet' | 'testnet' | null,
      setCurrentNetwork: (network) => set(() => ({ currentNetwork: network })),
      isNetworkMismatch: (): boolean => {
        const state: AccountState = useAccount.getState()
        return state.currentNetwork !== null && state.currentNetwork !== state.targetNetwork
      },
      
      // Legacy setAddress method for backward compatibility
      setAddress: (address: string) => set((state) => ({
        address: address,
        hathorAddress: state.walletType === 'walletconnect' ? address : state.hathorAddress
      })),
      
      // New wallet connection methods
      setWalletConnection: (connection: Partial<WalletConnection>) => set((state) => ({
        ...state,
        ...connection,
        // Update legacy address field for backward compatibility
        address: connection.address || state.address,
      })),
      
      disconnectWallet: () => set(() => ({
        walletType: null,
        address: '',
        hathorAddress: '',
        isSnapInstalled: false,
        snapId: null,
        selectedNetwork: 'testnet',
        currentNetwork: null,
        balance: [
          {
            token_uuid: '00',
            token_symbol: 'HTR',
            token_balance: 0,
          },
          {
            token_uuid: hUSDC_UUID ? hUSDC_UUID : '',
            token_symbol: 'hUSDC',
            token_balance: 0,
          },
        ],
      })),
      
      // Balance and notifications (unchanged from original)
      balance: [
        {
          token_uuid: '00',
          token_symbol: 'HTR',
          token_balance: 0,
        },
        {
          token_uuid: hUSDC_UUID ? hUSDC_UUID : '',
          token_symbol: 'hUSDC',
          token_balance: 100,
        },
      ],
      setBalance: (balance: TokenBalance[]) => set(() => ({ balance: balance })),

      notifications: {} as Record<number, string[]>,
      setNotifications: (notifications: Record<number, string[]>) => set(() => ({ notifications: notifications })),
      clearNotifications: () => set(() => ({ notifications: {} })),
      updateNotificationLastState: (txHash: string, last_status: string, last_message: string) =>
        set((state) => {
          const updatedNotifications = { ...state.notifications }

          for (const notificationId in updatedNotifications) {
            const notificationString = updatedNotifications[notificationId]
            const notification = JSON.parse(notificationString[0]) as { txHash: string; last_status?: string; last_message?: string }

            if (notification.txHash === txHash) {
              updatedNotifications[notificationId][0] = JSON.stringify({
                ...notification,
                last_status: last_status,
                last_message: last_message,
              })
              break // Only mark the first matching notification as validated
            }
          }

          return { notifications: updatedNotifications }
        }),
      updateNotificationStatus: (txHash: string, status: string, message?: string) =>
        set((state) => {
          const updatedNotifications = { ...state.notifications }

          for (const notificationId in updatedNotifications) {
            const notificationString = updatedNotifications[notificationId]
            const notification = JSON.parse(notificationString[0]) as { txHash: string; status?: string; last_message?: string }

            if (notification.txHash === txHash) {
              updatedNotifications[notificationId][0] = JSON.stringify({
                ...notification,
                status: status,
                last_message: message,
              })
              break // Only mark the first matching notification as validated
            }
          }

          return { notifications: updatedNotifications }
        }),
      addNotification: (notification: string[]) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [Object.keys(state.notifications).length + 1]: notification,
          },
        })),
      zealyIdentity: '',
      setZealyIdentity: (identity: string) => set(() => ({ zealyIdentity: identity })),
    }),
    {
      name: 'account-storage',
    }
  )
)
