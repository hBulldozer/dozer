import { Button, Switch } from '@dozer/ui'
import { ChevronDownIcon } from '@heroicons/react/solid'

const Home = () => {
  return (
    <>
      <h1 className="text-yellow-500">Root</h1>
      <Button color="yellow" variant="filled">
        DOZER PROTOCOL
      </Button>
      <button
        type="button"
        // onClick={console.log('test')}
        className="group bg-stone-700 p-0.5 border-2 border-stone-800 transition-all rounded-full hover:ring-2 hover:ring-stone-500 cursor-pointer"
      >
        <div className="transition-all rotate-0 group-hover:rotate-180 group-hover:delay-200">
          <ChevronDownIcon width={16} height={16} />
        </div>
      </button>
    </>
  )
}

export default Home
