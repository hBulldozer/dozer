import { Typography } from '@dozer/ui'
import { api } from 'utils/api'

const sql = () => {
  const { data: test } = api.getPools.sql.useQuery()
  const { data: test2 } = api.getPools.allNcids.useQuery()
  // const {data:test3} = api.getPools.contractState.useQuery({})
  const interval = 30 * 60 * 1000
  const { data: test4 } = api.getPools.hourSnaps.useQuery({
    tokenUuid: '00b1b246cb512515c5258cb0301afcf83e74eb595dbe655d14e11782db4b70c6',
  })
  return (
    <>
      <Typography variant="h1">SQL query:</Typography>
      <pre className="text-lg">{JSON.stringify(test4, null, 2)}</pre>
      {/* <pre className="text-lg">{JSON.stringify(test4, ['date', 'reserve0', 'priceHTR'], 2)}</pre> */}
    </>
  )
}

export default sql
