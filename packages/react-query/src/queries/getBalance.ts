import { useQuery } from '@tanstack/react-query'

export const useBalance = (address: string) => {
  return useQuery({
    queryKey: ['balance_' + address],
    queryFn: async () =>
      fetch('https://node1.testnet.hathor.network/v1a/thin_wallet/address_balance?address=' + address).then(
        (response) => response.json()
      ),
    staleTime: Infinity,
    enabled: Boolean(address),
  })
}
