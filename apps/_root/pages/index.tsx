import { Button, Switch } from '@dozer/ui'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Background from 'components/Background/Background'
import { BuildWealth } from 'components/BuildWealth/BuildWealth'
import { Hero } from 'components/Hero/Hero'
import { Partners } from 'components/Partners/Partners'
import { Story } from 'components/Story/Story'
import { api } from 'utils/api'
// import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const Home = () => {
  // return (
  //   // <article className="w-full my-20">
  //   <>
  //     <Background />
  //     <Hero />
  //     <Partners />
  //     <div className="overflow-x-hidden bg-black">
  //       <Story />
  //       <div className="flex flex-col gap-2 border-t border-neutral-200/10"></div>
  //       <BuildWealth />
  //     </div>
  //   </>
  //   // </article>
  // )
  const pools = api.getPools.all.useQuery().data
  const tokens = api.getTokens.all.useQuery().data
  if (!pools) {
    return <div>Loading...</div>
  }
  return (
    <div>
      {/* {pools.map((index) => {
        return <p key={index.id}>{index.name}</p>
      })} */}
      {tokens?.map((index) => {
        return <p key={index.id}>{index.symbol}</p>
      })}
    </div>
    

    
  )
}

export default Home
