import { api } from 'utils/api'

const Stats = () => {
  const { data: visitors24h } = api.getStats.visitors24h.useQuery()
  const { data: qtyVisitors } = api.getStats.qtyVisitors.useQuery()
  const { data: qtyFaucet } = api.getStats.userFaucetQty.useQuery()

  return (
    <div className="flex flex-row gap-10">
      <pre className="text-lg">Visitors24h: {JSON.stringify(visitors24h, null, 2)}</pre>
      <pre className="text-lg">Visitor All: {JSON.stringify(qtyVisitors, null, 2)}</pre>
      <pre className="text-lg">Users Faucet: {JSON.stringify(qtyFaucet, null, 2)}</pre>
    </div>
  )
}

export default Stats
