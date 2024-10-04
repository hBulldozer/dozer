import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const { USDT_UUID } = process.env
export interface TokenBalance {
  token_uuid: string
  token_symbol: string
  token_balance: number
}
export interface AccountState {
  address: string
  setAddress: (address: string) => void
  balance: TokenBalance[]
  setBalance: (balance: TokenBalance[]) => void
  notifications: Record<number, string[]>
  setNotifications: (notifications: Record<number, string[]>) => void
  clearNotifications: () => void
  updateNotificationLastState: (txHash: string, last_status: string, last_message: string) => void
  updateNotificationStatus: (txHash: string, status: string, message?: string) => void
  addNotification: (notification: string[]) => void
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      address: '',
      setAddress: (address) => set((state) => ({ address: address })),
      balance: [
        {
          token_uuid: '00',
          token_symbol: 'HTR',
          token_balance: 0,
        },
        {
          token_uuid: USDT_UUID ? USDT_UUID : '',
          token_symbol: 'USDT',
          token_balance: 100,
        },
      ],
      setBalance: (balance) => set((state) => ({ balance: balance })),

      notifications: [],
      setNotifications: (notifications) => set((state) => ({ notifications: notifications })),
      clearNotifications: () => set((state) => ({ notifications: [] })),
      updateNotificationLastState: (txHash: string, last_status: string, last_message: string) =>
        set((state) => {
          const updatedNotifications = { ...state.notifications }

          for (const notificationId in updatedNotifications) {
            const notificationString = updatedNotifications[notificationId]
            const notification: any = JSON.parse(notificationString[0])

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
            const notification: any = JSON.parse(notificationString[0])

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
    }),
    {
      name: 'account-storage',
    }
  )
)
