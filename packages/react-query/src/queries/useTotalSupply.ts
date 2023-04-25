import { ChainId } from '@dozer/chain'
import { useQuery } from '@tanstack/react-query'

export const useTotalSupply = (uuid: string, chainId: number) => {
  if (chainId == ChainId.HATHOR)
    return useQuery({
      queryKey: ['totalSupply' + uuid],
      queryFn: async () =>
        fetch('https://node1.mainnet.hathor.network/v1a/thin_wallet/token?id=' + uuid).then((response) =>
          response.json()
        ),
      staleTime: 100,
      enabled: Boolean(uuid),
    })
  else
    return useQuery({
      queryKey: ['totalSupply' + uuid],
      queryFn: async () =>
        fetch('https://node1.testnet.hathor.network/v1a/thin_wallet/token?id=' + uuid).then((response) =>
          response.json()
        ),
      staleTime: 100,
      enabled: Boolean(uuid),
    })
}
