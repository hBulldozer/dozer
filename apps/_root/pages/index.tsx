import { Button, Switch } from '@dozer/ui'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Background from 'components/Background'
import { Hero } from 'components/Hero/Hero'

const Home = () => {
  return (
    <article className="w-full my-20">
      <Background />
      <Hero />
    </article>
  )
}

export default Home
