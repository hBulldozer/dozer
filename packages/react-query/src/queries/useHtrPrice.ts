import { useQuery } from '@tanstack/react-query'

export const useHtrPrice = () => {
  return useQuery({
    queryKey: ['htr_price'],
    queryFn: async () => {
      const res = await fetch('/kucoin/prices?currencies=HTR')
      const data = await res.json()
      return data.data.HTR
    },
    staleTime: 200,
    enabled: true,
  })
}
