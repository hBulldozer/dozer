import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { api } from 'utils/api'

const Stats = () => {
  const router = useRouter()
  const [apiKey, setApiKey] = useState<string>('')

  // Wait for router to be ready and get the key from URL
  useEffect(() => {
    if (router.isReady) {
      const key = router.query.key as string
      setApiKey(key || '')
    }
  }, [router.isReady, router.query.key])

  const { data: visitors24h } = api.getStats.visitors24h.useQuery({ apiKey }, { enabled: !!apiKey })
  const { data: qtyVisitors } = api.getStats.qtyVisitors.useQuery({ apiKey }, { enabled: !!apiKey })
  const { data: qtyFaucet } = api.getStats.userFaucetQty.useQuery({ apiKey }, { enabled: !!apiKey })

  if (!apiKey) {
    return <div>No key provided</div>
  }

  return (
    <div className="flex flex-row gap-10">
      <pre className="text-lg">Visitors24h: {JSON.stringify(visitors24h, null, 2)}</pre>
      <pre className="text-lg">Visitor All: {JSON.stringify(qtyVisitors, null, 2)}</pre>
      <pre className="text-lg">Users Faucet: {JSON.stringify(qtyFaucet, null, 2)}</pre>
    </div>
  )
}

export default Stats
