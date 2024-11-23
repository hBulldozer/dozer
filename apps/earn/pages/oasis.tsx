import React, { useState } from 'react'
import {
  Widget,
  Select,
  Input,
  Button,
  Typography,
  Slider,
  TextHoverEffect,
  BackgroundGradientAnimation,
} from '@dozer/ui'
import { OasisChart } from '../components/OasisChart'
import Image, { ImageProps } from 'next/legacy/image'
import { Token } from '@dozer/currency'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

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
    <div className="flex flex-col gap-6 p-6 bg-black/80">
      <div className="flex flex-col items-center mb-8 text-center">
        <Typography variant="h1" className="mb-4 text-6xl font-bold text-transparent text-yellow bg-clip-text">
          OASIS
        </Typography>
        <Typography variant="lg" className="mb-2 text-stone-400">
          The Official Dozer Reward Program!
        </Typography>
        <Typography variant="lg" className="text-stone-200">
          Lock your liquidity and <span className="text-yellow">earn up to 20% in HTR today!</span>
        </Typography>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-stone-800/50 rounded-xl">
            <Typography variant="lg" weight={500} className="mb-2 text-yellow">
              1. Equal HTR Matching
            </Typography>
            <Typography variant="sm" className="text-stone-400">
              For every $1 worth of tokens you provide, Oasis will match with $1 worth of HTR, doubling the effective
              liquidity you provide to the pool.
            </Typography>
          </div>

          <div className="p-6 bg-stone-800/50 rounded-xl">
            <Typography variant="lg" weight={500} className="mb-2 text-yellow">
              2. Instant Bonus
            </Typography>
            <Typography variant="sm" className="text-stone-400">
              Get an immediate upfront payment of up to 20% of your deposit value in HTR, depending on your chosen lock
              period.
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
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-row gap-2 justify-items-end">
                <div className="flex flex-col flex-1 gap-2">
                  <Typography variant="sm" className="text-stone-400">
                    Amount to lock up
                  </Typography>
                  <div className="h-[51px]">
                    {' '}
                    {/* h-10 = 40px, standard input height */}
                    <Input.Numeric value={amount} onUserInput={(val) => setAmount(val)} className="h-full" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-[180px]">
                  <Typography variant="sm" className="text-stone-400">
                    Choose token
                  </Typography>

                  <Select
                    value={token}
                    onChange={(val: string) => setToken(val as string)}
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

              {token !== 'hUSDT' && (
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
                    onValueChange={(vals: number[]) => setTokenPriceChange(vals[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

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

              {amount && (
                <div className="p-4 mt-4 bg-stone-800 rounded-xl">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between">
                      <Typography variant="sm" className="text-stone-400">
                        Bonus you'll get now:
                      </Typography>
                      <Typography variant="sm" className="text-yellow">
                        {(Number(amount) * bonusRate).toFixed(2)} HTR
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="sm" className="text-stone-400">
                        HTR Match:
                      </Typography>
                      <Typography variant="sm" className="text-yellow">
                        {Number(amount).toFixed(2)} HTR
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="sm" className="text-stone-400">
                        Unlock date:
                      </Typography>
                      <Typography variant="sm" className="text-yellow">
                        {unlockDate.toLocaleDateString()}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}

              <Typography variant="xs" className="mt-2 text-center text-stone-500">
                By locking up your tokens,
                <br />
                you'll not be able to remove them for {lockPeriod} months
              </Typography>

              <Button className="w-full mt-4" disabled={!amount || Number(amount) <= 0}>
                Get tokens then ignite now
              </Button>

              <div className="w-full max-w-[600px] mt-4 ">
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

            <div className="p-4">
              <div className="h-[500px]">
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
          </div>
        </Widget.Content>
      </Widget>
    </div>
  )
}

export default OasisProgram
