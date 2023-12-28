import { RouterOutputs, api } from '../utils/trpc'
import { useAccount } from '@dozer/zustand'

const Nanostate = () => {
  const userAddress = 'Wcwqb5eX1BYAjazBfHNPaFtp9344aPUv7L'
  const contractId = '00009a7b3e3e3a062de7429e49168b7a8bd437058b152e6ef881288abe9eb6c0'

  const { data: data1 } = api.getNanoState.byUser.useQuery(userAddress)
  const { data: data2 } = api.getNanoState.maxWithdrawByUser.useQuery(userAddress)
  const { data: data3 } = api.getNanoState.api.useQuery()
  const { data: data4 } = api.getProfile.pool.useQuery({ address: userAddress, contractId: contractId })

  console.log(data1, data3, data4) // Log all data for debugging

  return (
    <div>
      <h2>Nanostate by User:</h2>
      <pre>{JSON.stringify(data1, null, 2)}</pre>
      <h2>Max Withdraw by User:</h2>
      <pre>{JSON.stringify(data2, null, 2)}</pre>
      <h2>Nanostate API:</h2>
      <pre>{JSON.stringify(data3, null, 2)}</pre>
      <h2>Profile Pool:</h2>
      <pre>{JSON.stringify(data4, null, 2)}</pre>
    </div>
  )
}

export default Nanostate
