import { ChainId } from '@dozer/chain'
import { api } from '../../utils/api'
import { useEffect, useMemo, useState } from 'react'

export const useWaitForTransaction = (hash: string, chainId: ChainId) => {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    const fetchTx = async (): Promise<any> => {
      try {
        const TxInfo = await api.getPools.waitForTx.useQuery({
          hash,
          chainId,
        })
        setStatus(TxInfo)
      } catch (e) {
        console.error(e)

        return null
      }
    }

    fetchTx()
  }, [])

  return status
}
