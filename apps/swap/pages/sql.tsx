import { Typography } from '@dozer/ui'
import { api } from 'utils/api'

const sql = () => {
  const { data: test } = api.getPools.sql.useQuery()
  const { data: test2 } = api.getPools.allNcids.useQuery()
  // const {data:test3} = api.getPools.contractState.useQuery({})
  const interval = 10 * 60 * 1000
  const { data: test4 } = api.getPools.hourSnaps.useQuery({ poolId: '1', interval: interval })
  return (
    <>
      <Typography variant="h1">SQL query:</Typography>
      <pre className="text-lg">{JSON.stringify(test4, null, 2)}</pre>
      {/* <pre className="text-lg">{JSON.stringify(test4, ['date', 'reserve0', 'priceHTR'], 2)}</pre> */}
    </>
  )
}

export default sql
