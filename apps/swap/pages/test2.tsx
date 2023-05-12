import { api } from 'utils/api'
// import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const Test = () => {
  const pools = api.getPools.all.useQuery().data
  const tokens = api.getTokens.all.useQuery().data
  const htr = api.getTokens.bySymbol.useQuery({ symbol: 'HTR' }).data
  if (!pools) {
    return <div>Loading...</div>
  }
  return (
    <div>
      {pools.map((index) => {
        return <p key={index.id}>{index.name}</p>
      })}
      {tokens?.map((index) => {
        return <p key={index.id}>{index.symbol}</p>
      })}
      <p>{htr?.name}</p>
    </div>
  )
}

export default Test
