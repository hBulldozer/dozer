import { RouterOutputs, api } from '../utils/trpc'
import { useAccount } from '@dozer/zustand'

const Nanostate = () => {
  const userAddress = useAccount().address
  // const { data } = api.getNanoState.byUser.useQuery(userAddress)
  // const { data } = api.getNanoState.maxWithdrawByUser.useQuery(userAddress)
  const { data } = api.getNanoState.api.useQuery()
  console.log(data?.owner_balance)
  return <div> {data?.rewards_per_share}</div>
}

export default Nanostate
