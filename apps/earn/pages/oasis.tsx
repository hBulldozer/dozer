import React, { Fragment, useState } from 'react'
import { Widget, Select, Input, Button, Typography, Slider, classNames } from '@dozer/ui'
import { OasisChart } from '../components/OasisChart'
import Image, { ImageProps } from 'next/legacy/image'
import { Token } from '@dozer/currency'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import backgroundOasis from '../public/background_oasis.jpeg'
import { Tab, Transition } from '@headlessui/react'

const TokenOption = ({ token }: { token: string }) => {
  const currency = token == 'hUSDT' ? 'USDT' : token == 'hETH' ? 'ETH' : token == 'hBTC' ? 'BTC' : 'USDC'
  return (
    <div className="flex flex-row items-center w-full gap-4">
      <div className="flex-shrink-0 w-7 h-7">
        <Image key={token} src={`/logos/${currency}.svg`} width={28} height={28} alt={token} className="rounded-full" />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <Typography variant="sm" weight={500} className="truncate text-stone-200 group-hover:text-stone-50">
          {token}
        </Typography>
      </div>
    </div>
  )
}

const OasisProgram = () => {
  const [amount, setAmount] = useState<string>('')
  const [token, setToken] = useState<string>('hUSDT')
  const [lockPeriod, setLockPeriod] = useState<number>(12)
  const [tokenPriceChange, setTokenPriceChange] = useState<number>(0)
  const [hover, setHover] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const maxHTR = 1000
  const availableHTR = 500
  const progress = (availableHTR / maxHTR) * 100

  // Bonus rate based on lock period
  const bonusRate = lockPeriod === 6 ? 0.1 : lockPeriod === 9 ? 0.15 : 0.2

  // Current HTR price - in real implementation, get this from API
  const initialPrices = {
    htr: 0.07,
    btc: 98520,
    eth: 3339,
    usdc: 1,
    usdt: 1,
  }

  // Unlock date calculation
  const unlockDate = new Date(Date.now() + lockPeriod * 30 * 24 * 60 * 60 * 1000)
  const currency = token == 'hUSDT' ? 'USDT' : token == 'hETH' ? 'ETH' : token == 'hBTC' ? 'BTC' : 'USDC'

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Gradient Overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          src={backgroundOasis} // Make sure to include the file extension
          alt="Background"
          layout="fill"
          objectFit="cover" // Add this
          quality={100} // Add this
          priority // Add this as a proper prop
          className="opacity-50" // Add some opacity to help with the overlay
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
          style={{ mixBlendMode: 'multiply' }} // Add this for better gradient blending
        />
      </div>

      {/* Your content - now with relative positioning and z-index */}
      <div className="relative z-10 flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-6 px-6 bg-black/80">
          <div className="flex flex-col items-center text-center ">
            <div className="flex flex-col items-center pt-10 ">
              <h1 className="relative z-20 text-3xl font-bold text-center text-white md:text-7xl lg:text-9xl">OASIS</h1>
              <div className="w-[40rem] h-40 relative">
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent h-[2px] w-3/4 blur-sm" />
                <div className="absolute top-0 w-3/4 h-px inset-x-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-yellow-500 to-transparent h-[5px] w-1/4 blur-sm" />
                <div className="absolute top-0 w-1/4 h-px inset-x-60 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

                <Typography variant="lg" className="mt-8 text-stone-400">
                  The Official Hathor Liquidity Incentive program
                </Typography>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
              <div className="p-6 bg-stone-800/50 rounded-xl">
                <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                  1. Equal HTR Matching
                </Typography>
                <Typography variant="sm" className="text-stone-400">
                  For every $1 worth of tokens you provide, Oasis will match with $1 worth of HTR, doubling the
                  effective liquidity you provide to the pool.
                </Typography>
              </div>

              <div className="p-6 bg-stone-800/50 rounded-xl">
                <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                  2. Instant Bonus
                </Typography>
                <Typography variant="sm" className="text-stone-400">
                  Get an immediate upfront payment of up to 20% of your deposit value in HTR, depending on your chosen
                  lock period.
                </Typography>
              </div>

              <div className="p-6 bg-stone-800/50 rounded-xl">
                <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                  3. IL Protection
                </Typography>
                <Typography variant="sm" className="text-stone-400">
                  Your deposit is protected against impermanent loss up to a 4x price difference between HTR and your
                  deposited token.
                </Typography>
              </div>
            </div>
            <div className="flex justify-center">
              <Button variant="outlined" className="text-yellow hover:text-yellow-600">
                <Typography variant="sm" weight={500}>
                  Learn More
                </Typography>
                <ArrowTopRightOnSquareIcon width={16} height={16} className="ml-2 text-yellow" />
              </Button>
            </div>
          </div>

          <Widget id="oasisInput" maxWidth="full" className="py-10 my-20">
            <Widget.Content>
              <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
                {/* Left column with tabs */}
                <div className="flex flex-col gap-4">
                  <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                    <div>
                      <div className="flex items-center gap-6 mb-6 ml-8">
                        <Tab
                          className={({ selected }) =>
                            classNames(
                              'transition-colors duration-200 font-medium !outline-none',
                              selected ? 'text-yellow border-b-2 border-yellow' : 'text-stone-500 hover:text-stone-200'
                            )
                          }
                        >
                          Deposit Now
                        </Tab>
                        <Tab
                          className={({ selected }) =>
                            classNames(
                              'transition-colors duration-200 font-medium !outline-none',
                              selected ? 'text-yellow border-b-2 border-yellow' : 'text-stone-500 hover:text-stone-200'
                            )
                          }
                        >
                          My Position
                        </Tab>
                      </div>

                      <Tab.Panels>
                        <Tab.Panel>
                          <div className="flex flex-col gap-4 p-8">
                            <div className="flex flex-row gap-2 justify-items-end">
                              <div className="flex flex-col flex-1 gap-2">
                                <Typography variant="sm" className="text-stone-400">
                                  Amount to lock up
                                </Typography>
                                <div className="h-[51px]">
                                  {' '}
                                  {/* h-10 = 40px, standard input height */}
                                  <Input.Numeric
                                    value={amount}
                                    onUserInput={(val) => setAmount(val)}
                                    className="h-full"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 w-[180px]">
                                <Typography variant="sm" className="text-stone-400">
                                  Choose token
                                </Typography>

                                <Select
                                  value={token}
                                  onChange={(val: string) => {
                                    if (val == 'hUSDT') setTokenPriceChange(0)
                                    setToken(val as string)
                                  }}
                                  button={
                                    <Select.Button>
                                      <div className="flex flex-row items-center flex-grow gap-4 mr-8">
                                        <div className="flex-shrink-0 w-7 h-7">
                                          <Image
                                            key={currency}
                                            src={`/logos/${currency}.svg`}
                                            width={28}
                                            height={28}
                                            alt={currency}
                                            className="rounded-full"
                                          />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                          <Typography
                                            variant="sm"
                                            weight={500}
                                            className="truncate text-stone-200 group-hover:text-stone-50"
                                          >
                                            {token}
                                          </Typography>
                                        </div>
                                      </div>
                                    </Select.Button>
                                  }
                                >
                                  <Select.Options>
                                    <Select.Option value="hUSDT">
                                      <TokenOption token="hUSDT" />
                                    </Select.Option>
                                    <Select.Option value="hETH">
                                      <TokenOption token="hETH" />
                                    </Select.Option>
                                    <Select.Option value="hBTC">
                                      <TokenOption token="hBTC" />
                                    </Select.Option>
                                  </Select.Options>
                                </Select>
                              </div>
                            </div>

                            <div
                              className="relative"
                              onMouseEnter={() => setHover(true)}
                              onMouseLeave={() => setHover(false)}
                            >
                              <Transition
                                show={Boolean(hover && token == 'hUSDT')}
                                as={Fragment}
                                enter="transition duration-300 origin-center ease-out"
                                enterFrom="transform opacity-0"
                                enterTo="transform opacity-100"
                                leave="transition duration-75 ease-out"
                                leaveFrom="transform opacity-100"
                                leaveTo="transform opacity-0"
                              >
                                <div className="py-6 border border-stone-200/5 flex justify-center items-center z-[100] absolute inset-0 backdrop-blur bg-black bg-opacity-[0.24] ">
                                  <Typography
                                    variant="xs"
                                    weight={600}
                                    className="bg-white bg-opacity-[0.12] rounded-full p-2 px-3"
                                  >
                                    USDT has no price change
                                  </Typography>
                                </div>
                              </Transition>
                              <div className="flex flex-col w-full gap-2">
                                <div className="flex justify-between">
                                  <Typography variant="sm" className="text-stone-400">
                                    {currency} Price Change
                                  </Typography>
                                  <Typography variant="sm" className="text-yellow">
                                    {tokenPriceChange.toFixed(2)}%
                                  </Typography>
                                </div>
                                <Slider
                                  value={[tokenPriceChange]}
                                  onValueChange={(vals: number[]) => {
                                    if (token !== 'hUSDT') setTokenPriceChange(vals[0])
                                  }}
                                  min={-100}
                                  max={100}
                                  step={1}
                                  className="w-full"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Typography variant="sm" className="text-stone-400">
                                Lock up time
                              </Typography>
                              <Select
                                value={lockPeriod.toString()}
                                onChange={(val: string) => setLockPeriod(Number(val))}
                                button={
                                  <Select.Button>
                                    {lockPeriod} months - Bonus {(bonusRate * 100).toFixed(2)}%
                                  </Select.Button>
                                }
                              >
                                <Select.Options>
                                  <Select.Option value="6">6 months - Bonus 10.00%</Select.Option>
                                  <Select.Option value="9">9 months - Bonus 15.00%</Select.Option>
                                  <Select.Option value="12">12 months - Bonus 20.00%</Select.Option>
                                </Select.Options>
                              </Select>
                            </div>

                            <div className="p-4 mt-4 bg-stone-800 rounded-xl">
                              <div className="flex flex-col gap-4">
                                <div className="flex justify-between">
                                  <Typography variant="sm" className="text-stone-400">
                                    Bonus you'll get now:
                                  </Typography>
                                  <Typography variant="sm" className="text-yellow">
                                    {amount ? `${(Number(amount) * bonusRate).toFixed(2)} HTR` : '-'}
                                  </Typography>
                                </div>
                                <div className="flex justify-between">
                                  <Typography variant="sm" className="text-stone-400">
                                    HTR Match:
                                  </Typography>
                                  <Typography variant="sm" className="text-yellow">
                                    {amount ? `${Number(amount).toFixed(2)} HTR` : '-'}
                                  </Typography>
                                </div>
                                <div className="flex justify-between">
                                  <Typography variant="sm" className="text-stone-400">
                                    Unlock date:
                                  </Typography>
                                  <Typography variant="sm" className="text-yellow">
                                    {amount ? unlockDate.toLocaleDateString() : '-'}
                                  </Typography>
                                </div>
                              </div>
                            </div>

                            <Typography variant="xs" className="mt-2 text-center text-stone-500">
                              By locking up your tokens,
                              <br />
                              you'll not be able to remove them for {lockPeriod} months
                            </Typography>

                            <Button className="w-full mt-4" disabled={!amount || Number(amount) <= 0}>
                              Get tokens then ignite now
                            </Button>

                            <div className="w-full max-w-[600px] mt-4 ">
                              <Typography variant="xs" className="text-stone-400">
                                Oasis Reserve available
                              </Typography>
                              <div className="relative h-[23px] w-full">
                                <div className="absolute inset-0 rounded-md bg-[rgba(255,255,255,0.12)] ring-1 ring-yellow-500 "></div>
                                <div
                                  className="absolute inset-y-0 left-0 overflow-hidden rounded-md"
                                  style={{ width: `${progress}%` }}
                                >
                                  <div className="h-full bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500" />
                                </div>
                              </div>
                              <div className="flex flex-row items-center justify-between mt-2">
                                <Typography variant="sm" className="text-center text-neutral-200">
                                  HTR matched
                                </Typography>
                                <Typography variant="sm" className="text-center text-neutral-200">
                                  {availableHTR.toLocaleString()} / {maxHTR.toLocaleString()} HTR
                                </Typography>
                              </div>
                            </div>
                          </div>
                        </Tab.Panel>

                        <Tab.Panel>
                          <div className="flex flex-col gap-4 p-8">
                            <div className="p-4 bg-stone-800/50 rounded-xl">
                              <Typography variant="lg" weight={500} className="mb-4 text-yellow">
                                Your Active Positions
                              </Typography>

                              {/* Example position card */}
                              <div className="p-4 mb-4 border rounded-lg border-stone-700">
                                <div className="flex justify-between mb-2">
                                  <Typography variant="sm" className="text-stone-400">
                                    Locked Amount:
                                  </Typography>
                                  <Typography variant="sm" className="text-stone-200">
                                    1,000 hUSDT
                                  </Typography>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <Typography variant="sm" className="text-stone-400">
                                    HTR Matched:
                                  </Typography>
                                  <Typography variant="sm" className="text-stone-200">
                                    1,000 HTR
                                  </Typography>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <Typography variant="sm" className="text-stone-400">
                                    Unlock Date:
                                  </Typography>
                                  <Typography variant="sm" className="text-stone-200">
                                    Dec 24, 2024
                                  </Typography>
                                </div>
                                <div className="flex justify-between">
                                  <Typography variant="sm" className="text-stone-400">
                                    Status:
                                  </Typography>
                                  <Typography variant="sm" className="text-green-500">
                                    Active
                                  </Typography>
                                </div>
                              </div>

                              {/* Empty state */}
                              <div className="py-8 text-center">
                                <Typography variant="sm" className="text-stone-500">
                                  No active positions found.
                                  <br />
                                  Start by making a deposit!
                                </Typography>
                              </div>
                            </div>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </div>
                  </Tab.Group>
                </div>

                <div className="p-4">
                  <OasisChart
                    liquidityValue={Number(amount)}
                    initialPrices={initialPrices}
                    bonusRate={bonusRate}
                    holdPeriod={lockPeriod}
                    currency={currency}
                    tokenPriceChange={tokenPriceChange}
                  />
                </div>
              </div>
            </Widget.Content>
          </Widget>
        </div>
      </div>
    </div>
  )
}

export default OasisProgram
