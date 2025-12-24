import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { ChainId } from '@dozer/chain'
// import { Native, SUSHI } from '@dozer/currency'
import { getTokens } from '@dozer/currency'
import { useInterval } from '@dozer/hooks'
import { App, Button, classNames, Container, Typography } from '@dozer/ui'
import { Widget } from '@dozer/ui'
// import { CurrencyInput } from '@dozer/higmi/components/Web3Input/Currency'
import { motion, useInView } from 'framer-motion'
import React, { FC, useEffect, useState, useRef } from 'react'

// import { Search } from './Search'
import { CurrencyInput } from 'components/CurrencyInput'
import { TradeType } from 'components/utils/TradeType'

const TITLES = ['Whenever', 'Wherever', 'Whoever']
const VALUES = [
  { value0: '2', value1: '1' },
  { value0: '25', value1: '12.5' },
  { value0: '250', value1: '125' },
  { value0: '2500', value1: '1250' },
  { value0: '2500', value1: '1250' },
]

export const Hero: FC = () => {
  const [index, setIndex] = useState(0)
  const [valueIndex, setValueIndex] = useState<number>(-1)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const token_DZR = getTokens(ChainId.HATHOR)[1]
  const DZR_uuid = token_DZR.uuid
  const prices: { [key: string]: number } = {
    '00': 0.05,
    [DZR_uuid]: 0.1,
  }

  useInterval(() => setIndex((prev) => (prev + 1) % 3), 1500)

  useEffect(() => {
    const setIndex = (i: number) => {
      if (i < 5) {
        setValueIndex(i)
        setTimeout(() => setIndex(i + 1), 250)
      }
    }
    if (isInView) {
      setTimeout(() => setIndex(0), 2400)
    }
  }, [isInView])

  return (
    <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-40 px-4 border-t border-neutral-200/10 bg-gradient-to-b from-white/[0.04] to-black">
      {/* <section className="mt-48 py-20 sm:py-40 px-4 border-t border-neutral-200/10 bg-gradient-to-b from-white/[0.04] to-black"></section> */}
      <Container maxWidth="5xl" className="px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_400px] justify-between gap-[100px]">
          <div className="relative flex justify-end">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: 0.7,
              }}
              variants={{
                visible: { opacity: 1, scale: 1 },
                hidden: { opacity: 0, scale: 1.3 },
              }}
            >
              <Widget id="test" maxWidth={400} className="relative">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  animate={{ opacity: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.5,
                  }}
                  variants={{
                    visible: { opacity: 0 },
                    hidden: { opacity: 0.08 },
                  }}
                  className="bg-white absolute inset-0 z-[10]"
                />
                <Widget.Content>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                      visible: { opacity: 1, scale: 1 },
                      hidden: { opacity: 0, scale: 1.05 },
                    }}
                    transition={{
                      duration: 0.5,
                      delay: 1.4,
                    }}
                  >
                    <div ref={ref} className={classNames('p-3 mx-0.5 grid grid-cols-2 items-center pb-4 font-medium')}>
                      <App.NavItemList hideOnMobile={false}>
                        <App.NavItem href="https://www.dozer.finance/swap" label="Swap" />
                      </App.NavItemList>
                    </div>
                  </motion.div>
                  <CurrencyInput
                    className="p-3"
                    value={valueIndex >= 0 ? VALUES[valueIndex].value0 : ''}
                    onChange={() => {}}
                    onSelect={() => {}}
                    currency={getTokens(ChainId.HATHOR)[0]}
                    disabled={true}
                    id={''}
                    inputType={TradeType.EXACT_INPUT}
                    tradeType={TradeType.EXACT_INPUT}
                    chainId={ChainId.HATHOR}
                    prices={prices}
                  />
                  <div className="flex items-center justify-center -mt-[12px] -mb-[12px] z-10">
                    <button
                      type="button"
                      className=" group bg-stone-700 p-0.5 border-2 border-stone-800 transition-all rounded-full hover:ring-2 hover:ring-stone-500 cursor-pointer"
                    >
                      <div className="transition-all rotate-0 group-hover:rotate-180 group-hover:delay-200">
                        <ChevronDownIcon width={16} height={16} />
                      </div>
                    </button>
                  </div>
                  <div className="bg-stone-800">
                    <CurrencyInput
                      className="p-3 "
                      value={valueIndex >= 0 ? VALUES[valueIndex].value1 : ''}
                      onChange={() => {}}
                      onSelect={() => {}}
                      chainId={ChainId.HATHOR}
                      currency={getTokens(ChainId.HATHOR)[1]}
                      // chainId={ChainId.ETHEREUM}
                      disabled={true}
                      id={''}
                      inputType={TradeType.EXACT_INPUT}
                      tradeType={TradeType.EXACT_INPUT}
                      prices={prices}
                    />
                    <div className="p-3 pt-0">
                      <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                          visible: { opacity: 1, scale: 1 },
                          hidden: { opacity: 0, scale: 1.05 },
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 2,
                        }}
                      >
                        <Button
                          as="a"
                          href="https://forms.gle/8cEKvsaNrTP4c8Ef6"
                          size="md"
                          fullWidth
                          className="relative z-10"
                        >
                          Join Now
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </Widget.Content>
              </Widget>
            </motion.div>
          </div>
          <div className="flex flex-col">
            <Typography variant="hero" weight={800} className="text-neutral-50 leading-[3.5rem]">
              Trade Instantly on Dozer. <br /> <span className="text-yellow"> {TITLES[index]}.</span>
            </Typography>
            <Typography variant="lg" className="mt-3 text-neutral-400">
              The fastest swap in web3. <br />
              No registration needed and you won&apos;t spend gas.
            </Typography>
            {/* <div className="mt-10">
              <Search />
            </div> */}
          </div>
        </div>
      </Container>
    </section>
  )
}
