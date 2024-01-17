import { api } from 'utils/api'

const sql = () => {
  const { data: test } = api.getPools.sql.useQuery()
  console.log(test)
  return (
    <>
      <h2>sql testingPI:</h2>
      <pre>{JSON.stringify(test, null, 2)}</pre>
    </>
  )
}

export default sql
