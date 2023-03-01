import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, Button, classNames, Container, Link, Typography, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { TokenSelectorCustomTokenRow, TokenSelectorCustomTokensOverlay } from '@dozer/higmi/components/TokenSelector'

const Home = () => {
  return (
    <Layout>
      <Widget id="swap" maxWidth={400}>
        <Widget.Content>
          <div className={classNames('p-3 mx-0.5 grid grid-cols-2 items-center pb-4 font-medium')}>
            <App.NavItemList hideOnMobile={false}>
              <App.NavItem href="https://dozer.finance/swap" label="Swap" />
            </App.NavItemList>
          </div>
          <div className="flex items-center justify-center -mt-[12px] -mb-[12px] z-10">
            <button
              type="button"
              // onClick={}
              className="group bg-slate-700 p-0.5 border-2 border-slate-800 transition-all rounded-full hover:ring-2 hover:ring-slate-500 cursor-pointer"
            >
              <div className="transition-all rotate-0 group-hover:rotate-180 group-hover:delay-200">
                <ChevronDownIcon width={16} height={16} />
              </div>
            </button>
          </div>
          <div className="bg-slate-800">
            <div>oioioioioioioioi</div>
            <Button fullWidth disabled size="md">
              No trade found
            </Button>
            <TokenSelectorCustomTokensOverlay/>
          </div>
        </Widget.Content>
      </Widget>
    </Layout>
  )
}

export default Home
