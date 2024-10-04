import { RouterOutputs, api } from '../utils/api'
import { useAccount } from '@dozer/zustand'

const Nanostate = () => {
  const { address } = useAccount()
  const contractIdStake = '000001ba1724c79fc5f2c11eb2026008ff7313b25bd06095e2e891f20a6e2429'
  const contractIdLP = '00002b8239c771e675d8c2a54bbad8a2e10c60017759cf8c0a720d4a7010418f'

  // const { data: data1 } = api.getNanoState.byUser.useQuery(address)
  const { data: data2 } = api.getNanoState.maxWithdrawByUser.useQuery({
    address: address,
    contractId: contractIdStake,
  })
  // const { data: data3 } = api.getNanoState.api.useQuery()
  // const { data: data4 } = api.getProfile.pool.useQuery({ address: address, contractId: contractIdLP })

  return (
    <div>
      <h2>Nanostate by User:</h2>
      {/* <pre>{JSON.stringify(data1, null, 2)}</pre> */}
      <h2>Max Withdraw by User:</h2>
      <pre>{JSON.stringify(data2, null, 2)}</pre>
      <h2>Nanostate API:</h2>
      {/* <pre>{JSON.stringify(data3, null, 2)}</pre> */}
      <h2>Profile Pool:</h2>
      {/* <pre>{JSON.stringify(data4, null, 2)}</pre> */}
    </div>
  )
}

export default Nanostate
