import { Button, Switch } from '@dozer/ui'
import Background from 'components/Background/Background'
import { BuildWealth } from 'components/BuildWealth/BuildWealth'
import { Hero } from 'components/Hero/Hero'
import { Partners } from 'components/Partners/Partners'
import Roadmap from 'components/Roadmap'
import { Story } from 'components/Story/Story'
// import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const Home = () => {
  return (
    // <article className="w-full my-20">
    <>
      <Background />
      {/* <Partners /> */}
      <Story />
      <Hero />
      <div className="overflow-x-hidden bg-black">
        <div className="flex flex-col gap-2 border-t border-neutral-200/10"></div>
        <BuildWealth />
        <Roadmap />
      </div>
    </>
    // </article>
  )
}

export default Home
