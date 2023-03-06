import { useQuery } from '@tanstack/react-query'

export const useBalance = (address: string) => {
  return useQuery({
    queryKey: ['balance_' + address],
    queryFn: async () =>
      fetch('https://node1.testnet.hathor.network/v1a/thin_wallet/address_balance?address=' + address).then(
        (response) => {
          const balance_data = []
          const { data } = response.json()
          for (const token in data) {
            balance_data.push({
              token_uuid: token,
              token_symbol: data[token].symbol,
              token_balance: data[token].received - data[token].spent,
            })
          }
        }
      ),
    staleTime: Infinity,
    enabled: Boolean(address),
  })
}
