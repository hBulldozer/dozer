import { useQuery } from '@tanstack/react-query'
import { ChainId } from '@dozer/chain'

export const usePrices = (chainId: ChainId) => {
  return useQuery({
    queryKey: ['token_prices', chainId],
    queryFn: async () =>
      fetch(
        'https://raw.githubusercontent.com/Dozer-Protocol/automatic-exchange-service/main/assets/' + chainId + '/prices'
      ).then((response) => response.json()),
    staleTime: 60,
    enabled: true,
  })
}
