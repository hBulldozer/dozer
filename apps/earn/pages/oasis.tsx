import React, { useState } from 'react'
import { Widget, Select, Input, Button, Typography, Slider } from '@dozer/ui'
import { OasisChart } from '../components/OasisChart'

const OasisProgram = () => {
  const [amount, setAmount] = useState<string>('')
  const [token, setToken] = useState<string>('hUSDT')
  const [lockPeriod, setLockPeriod] = useState<number>(12)
  const [tokenPriceChange, setTokenPriceChange] = useState<number>(0)

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
        <Typography
          variant="h1"
          className="mb-4 text-6xl font-bold text-transparent text-yellow bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text"
        >
          OASIS
        </Typography>
        <Typography variant="lg" className="mb-2 text-stone-400">
          The Official Dozer Reward Program!
        </Typography>
        <Typography variant="lg" className="text-stone-200">
          Lock your liquidity and <span className="text-yellow">earn up to 20% in HTR today!</span>
        </Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
        <Widget id="oasisInput" maxWidth="full">
          <Widget.Content>
            <Widget.Header title="Oasis">
              <Typography variant="xs" className="text-stone-400">
                Your Locked Liquidity
              </Typography>
            </Widget.Header>

            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-2">
                <Typography variant="sm" className="text-stone-400">
                  Amount to lock up
                </Typography>
                <Input.Numeric value={amount} onUserInput={(val) => setAmount(val)} className="w-full" />
              </div>

              <div className="flex flex-col w-full gap-2">
                <div className="flex justify-between">
                  <Typography variant="sm" className="text-stone-400">
                    {currency} Price Change
                  </Typography>
                  <Typography variant="sm" className="text-yellow">
                    {tokenPriceChange.toFixed(2)}%
                  </Typography>
                </div>
                {token !== 'hUSDT' && (
                  <Slider
                    value={[tokenPriceChange]}
                    onValueChange={(vals: number[]) => setTokenPriceChange(vals[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Typography variant="sm" className="text-stone-400">
                  Choose token
                </Typography>
                <Select
                  value={token}
                  onChange={(val: string) => setToken(val as string)}
                  button={<Select.Button>{token}</Select.Button>}
                >
                  <Select.Options>
                    <Select.Option value="hUSDT">hUSDT</Select.Option>
                    <Select.Option value="hETH">hETH</Select.Option>
                    <Select.Option value="hBTC">hBTC</Select.Option>
                  </Select.Options>
                </Select>
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
            </div>
          </Widget.Content>
        </Widget>

        <Widget id="oasisChart" maxWidth="full">
          <Widget.Content>
            <Widget.Header title="Return Analysis">
              <Typography variant="xs" className="text-stone-400">
                Price Impact vs Returns
              </Typography>
            </Widget.Header>
            <div className="p-4">
              <div className="h-[500px]">
                {amount && Number(amount) > 0 && (
                  <OasisChart
                    liquidityValue={Number(amount)}
                    initialPrices={initialPrices}
                    bonusRate={bonusRate}
                    holdPeriod={lockPeriod}
                    currency={currency}
                    tokenPriceChange={tokenPriceChange}
                  />
                )}
              </div>
            </div>
          </Widget.Content>
        </Widget>
      </div>
    </div>
  )
}

export default OasisProgram
