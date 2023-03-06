import { useQuery } from '@tanstack/react-query'

export const usePrices = () => {
  return useQuery({
    queryKey: ['token_prices'],
    queryFn: async () =>
      fetch('https://raw.githubusercontent.com/Dozer-Protocol/automatic-exchange-service/main/assets/prices').then(
        (response) => response.json()
      ),
    staleTime: 60,
    enabled: true,
  })
}
