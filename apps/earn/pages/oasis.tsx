import React, { Fragment, useEffect, useState } from 'react'
import {
  Widget,
  Select,
  Input,
  Button,
  Typography,
  Slider,
  classNames,
  NotificationData,
  createSuccessToast,
  createErrorToast,
  Dots,
} from '@dozer/ui'
import { OasisChart } from '../components/OasisChart'
import Image from 'next/legacy/image'
import { Token } from '@dozer/currency'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import backgroundOasis from '../public/background_oasis.jpeg'
import { Tab, Transition } from '@headlessui/react'
import { Connected } from '@dozer/higmi/systems/Checker/Connected'
import { api } from '@dozer/higmi/utils/api'
import { Checker, useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { get, set } from 'lodash'
import { Oasis } from '@dozer/nanocontracts'
import { useAccount, useNetwork } from '@dozer/zustand'
import { ChainId } from '@dozer/chain'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import { OasisAddModal, OasisRemoveModal } from '../components/OasisModal'
import type { OasisPosition } from '../components/OasisModal/types'

const TokenOption = ({ token, disabled }: { token: string; disabled?: boolean }) => {
  const currency = token == 'hUSDT' ? 'USDT' : token == 'hETH' ? 'ETH' : token == 'hBTC' ? 'BTC' : 'USDC'
  return (
    <div className={classNames('flex flex-row items-center w-full gap-4', disabled && 'opacity-50')}>
      <div className="flex flex-row items-center w-full gap-4">
        <div className="flex-shrink-0 w-7 h-7">
          <Image
            key={token}
            src={`/logos/${currency}.svg`}
            width={28}
            height={28}
            alt={token}
            className="rounded-full"
          />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <Typography variant="sm" weight={500} className="truncate text-stone-200 group-hover:text-stone-50">
            {token}
          </Typography>
        </div>
      </div>
    </div>
  )
}

const UserOasisPosition = ({
  oasis,
  buttonWithdraw,
  buttonWithdrawBonus,
}: {
  oasis: {
    id: string
    user_deposit_b: number
    user_balance_a: number
    user_withdrawal_time: Date
    max_withdraw_htr: number
    max_withdraw_b: number
    token: { symbol: string }
    user_lp_htr: number
    user_lp_b: number
  }
  buttonWithdraw: JSX.Element
  buttonWithdrawBonus: JSX.Element
}) => {
  return (
    <div className="flex flex-col border rounded-lg border-stone-700">
      <div className="flex flex-col mt-2 ">
        <div className="flex flex-row items-center justify-center gap-2 p-4 my-auto">
          <div className="flex-shrink-0 w-7 h-7">
            <Image
              key={`position-${oasis.token.symbol}`}
              src={`/logos/${oasis.token.symbol}.svg`}
              width={28}
              height={28}
              alt={`position-${oasis.token.symbol}`}
              className="rounded-full"
            />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <Typography variant="h3" weight={500} className="truncate text-stone-200 group-hover:text-stone-50">
              {oasis.token.symbol}
            </Typography>
          </div>
        </div>

        <div className="h-[1px] w-4/5 mx-auto bg-stone-600 " />
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-row gap-1">
            <Typography variant="sm" className="text-stone-400">
              Locked Amount:
            </Typography>
            <Typography variant="sm" className="text-stone-200">
              {oasis.user_deposit_b} {oasis.token.symbol}
            </Typography>
          </div>

          <div className="flex flex-row gap-1">
            <Typography variant="sm" className="text-stone-400">
              Unlock Date:
            </Typography>
            <Typography variant="sm" className="text-stone-200">
              {oasis.user_withdrawal_time.toLocaleDateString()}
            </Typography>
          </div>
          <div className="flex flex-row gap-1">
            <Typography variant="sm" className="text-stone-400">
              Max withdraw {oasis.token.symbol}:
            </Typography>
            <Typography variant="sm" className="text-stone-200">
              {oasis.max_withdraw_b} {oasis.token.symbol}
            </Typography>
          </div>
          <div className="flex flex-row gap-1">
            <Typography variant="sm" className="text-stone-400">
              Max withdraw HTR:
            </Typography>
            <Typography variant="sm" className="text-stone-200">
              {oasis.max_withdraw_htr} HTR
            </Typography>
          </div>
          <div className="flex flex-row gap-1">
            <Typography variant="sm" className="text-stone-400">
              HTR Bonus available:
            </Typography>
            <Typography variant="sm" className="text-stone-200">
              {oasis.user_balance_a} HTR
            </Typography>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {oasis.user_withdrawal_time.getTime() < Date.now() && buttonWithdraw}
        {oasis.user_balance_a > 0 && buttonWithdrawBonus}
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
  const [unlockDate, setUnlockDate] = useState<Date>(new Date())
  const [htrMatch, setHtrMatch] = useState<number>(0)
  const [fetchLoading, setFetchLoading] = useState<boolean>(false)
  const [hasPosition, setHasPosition] = useState<boolean>(false)
  const [bonus, setBonus] = useState<number>(0)
  const [sentTX, setSentTX] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false)
  const [removeModalOpen, setRemoveModalOpen] = useState<boolean>(false)
  const [selectedOasisForRemove, setSelectedOasisForRemove] = useState<OasisPosition | null>(null)

  const { network } = useNetwork()
  const { addNotification } = useAccount()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

  const utils = api.useUtils()
  const { data: htrPrice } = api.getPrices.htr.useQuery()

  // Bonus rate based on lock period
  const bonusRate = lockPeriod === 6 ? 0.1 : lockPeriod === 9 ? 0.15 : 0.2

  // Current HTR price - in real implementation, get this from API
  const initialPrices = {
    htr: htrPrice || 0,
    btc: 98520,
    eth: 3339,
    usdc: 1,
    usdt: 1,
  }
  const maxHTR = 10000000

  // Unlock date calculation
  // const unlockDate = new Date(Date.now() + lockPeriod * 30 * 24 * 60 * 60 * 1000)
  const currency = token == 'hUSDT' ? 'USDT' : token == 'hETH' ? 'ETH' : token == 'hBTC' ? 'BTC' : 'USDC'
  const { data: allOasis } = api.getOasis.all.useQuery()
  const { data: allReserves } = api.getOasis.allReserves.useQuery()
  const { data: allUserOasis } = api.getOasis.allUser.useQuery({ address: address }, { enabled: Boolean(address) })

  const oasis = allOasis?.find((oasis) => oasis.token.symbol == currency)
  const oasisReserve = allReserves?.find((oasis) => oasis.token.symbol == currency)
  const usedHTR = oasisReserve?.dev_balance || 0
  const progress = (usedHTR / maxHTR) * 100
  const oasisId = oasis?.id
  const oasisName = oasis?.name || ''
  const poolId = oasis?.pool.id || ''
  const tokenUuid = oasis?.token.uuid || ''
  const oasisObj = new Oasis(tokenUuid, poolId)
  const handleAddLiquidity = async (): Promise<void> => {
    setSentTX(true)
    if (amount && lockPeriod && oasisId) {
      const response = await oasisObj.user_deposit(hathorRpc, address, lockPeriod, oasisId, parseFloat(amount))
    }
  }

  const handleRemoveLiquidity = async (removeAmount: string): Promise<void> => {
    setSentTX(true)
    if (removeAmount && selectedOasisForRemove?.id) {
      console.log('user_withdraw', selectedOasisForRemove.id, removeAmount)
    }
  }

  const onClickWithdrawBonus = async (oasisId: string) => {
    setSentTX(true)
    if (amount && lockPeriod && oasis) {
      // const response = await oasisObj.user_withdraw(hathorRpc, address, oasisId)
      console.log('user_withdraw_bonus', oasisId)
    }
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      if (amount && lockPeriod && oasisId) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Waiting for next block. Add liquidity in ${oasisName} Oasis pool.`,
              completed: `Success! Added ${amount} ${token} in ${oasisName} Oasis pool.`,
              failed: 'Failed summary',
              info: `Adding Liquidity in ${oasisName} Oasis pool: ${amount} ${token}.`,
            },
            status: 'pending',
            txHash: hash,
            groupTimestamp: Math.floor(Date.now() / 1000),
            timestamp: Math.floor(Date.now() / 1000),
            promise: new Promise((resolve) => {
              setTimeout(resolve, 500)
            }),
            account: address,
          }
          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setAddModalOpen(false)
          setSentTX(false)
        } else {
          createErrorToast(`Error`, true)
          setAddModalOpen(false)
          setSentTX(false)
        }
      }
    }
  }, [rpcResult])

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true)
      const response =
        amount && lockPeriod && oasisId
          ? await utils.getOasis.getFrontQuoteLiquidityIn.fetch({
              id: oasisId,
              amount_in: parseFloat(amount),
              timelock: lockPeriod,
              now: Math.floor(Date.now()),
              address: address,
            })
          : {
              bonus: 0,
              htr_amount: 0,
              withdrawal_time: new Date(),
              has_position: false,
            }

      return response
    }

    // call the function
    if (amount && oasisId) {
      fetchData()
        .then((response) => {
          setFetchLoading(false)
          setHtrMatch(response['htr_amount'])
          setUnlockDate(response['withdrawal_time'])
          setBonus(response['bonus'])
          setHasPosition(response['has_position'])
        })
        // make sure to catch any error
        .catch((err) => {
          console.error(err)
          setFetchLoading(false)
        })
    } else {
      setHtrMatch(0)
      setUnlockDate(new Date())
      setBonus(0)
      setHasPosition(false)
    }
  }, [amount, lockPeriod])

  return (
    <div className="relative min-h-screen">
      <BlockTracker client={api} className="z-50" />
      <div className="fixed inset-0 z-0">
        <Image
          src={backgroundOasis}
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
          className="opacity-50"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-6 px-6 bg-black/80">
          {/* Title Section - Keep centered */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex flex-col items-center pt-10">
              <h1 className="relative z-20 text-4xl font-bold text-center text-white sm:text-7xl lg:text-9xl">OASIS</h1>
              <div className="w-full max-w-[40rem] relative px-4">
                <div className="absolute w-full sm:w-3/4 h-[2px] left-1/2 -translate-x-1/2 top-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                </div>
              </div>
              <Typography variant="lg" className="mt-8 text-stone-400">
                The Official Hathor Liquidity Incentive program
              </Typography>
            </div>
          </div>

          {/* Main Content Area - New Layout */}
          <div className="flex justify-center w-full py-4 max-w-[1400px] mx-auto -my-8">
            {/* Left Column - Info Section (smaller) */}
            <div className="w-[300px] flex-shrink-0 mr-10">
              <div className="space-y-6">
                <Typography variant="lg" weight={600} className="text-stone-200">
                  How does this work?
                </Typography>

                {/* Feature boxes - Now narrower */}
                <div className="space-y-4">
                  <div className="p-4 bg-stone-800/50 rounded-xl">
                    <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                      1. Equal HTR Matching
                    </Typography>
                    <Typography variant="sm" className="text-stone-400">
                      For every $1 worth of tokens you provide, Oasis will match with $1 worth of HTR, doubling the
                      effective liquidity you provide to the pool.
                    </Typography>
                  </div>

                  <div className="p-4 bg-stone-800/50 rounded-xl">
                    <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                      2. Instant Bonus
                    </Typography>
                    <Typography variant="sm" className="text-stone-400">
                      Get an immediate upfront payment of up to 20% of your deposit value in HTR, depending on your
                      chosen lock period.
                    </Typography>
                  </div>

                  <div className="p-4 bg-stone-800/50 rounded-xl">
                    <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                      3. IL Protection
                    </Typography>
                    <Typography variant="sm" className="text-stone-400">
                      Your deposit is protected against impermanent loss up to a 4x price difference between HTR and
                      your deposited token.
                    </Typography>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button variant="outlined" className="text-yellow hover:text-yellow-600">
                    <Typography variant="sm" weight={500}>
                      Learn More
                    </Typography>
                    <ArrowTopRightOnSquareIcon width={16} height={16} className="ml-2 text-yellow" />
                  </Button>
                  <Button variant="outlined" className="text-yellow hover:text-yellow-600">
                    <Typography variant="sm" weight={500}>
                      Simulate Gains
                    </Typography>
                    <ArrowTopRightOnSquareIcon width={16} height={16} className="ml-2 text-yellow" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Center Column - Widget (wider) */}
            <div className="w-[600px]">
              <Widget id="oasisInput" maxWidth="full" className="py-5 mb-10">
                <Widget.Content>
                  <div className="grid ">
                    <div className="flex flex-col gap-2">
                      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                        <div>
                          <div className="flex items-center gap-4 mb-6 ml-4 sm:gap-6 sm:ml-8">
                            <Tab
                              className={({ selected }) =>
                                classNames(
                                  'transition-colors duration-200 font-medium !outline-none text-sm sm:text-base',
                                  selected
                                    ? 'text-yellow border-b-2 border-yellow'
                                    : 'text-stone-500 hover:text-stone-200'
                                )
                              }
                            >
                              Deposit Now
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                classNames(
                                  'transition-colors duration-200 font-medium !outline-none',
                                  selected
                                    ? 'text-yellow border-b-2 border-yellow'
                                    : 'text-stone-500 hover:text-stone-200'
                                )
                              }
                            >
                              My Position
                            </Tab>
                          </div>

                          <Tab.Panels>
                            <Tab.Panel>
                              <div className="flex flex-col gap-4 px-4 sm:px-8">
                                <div className="flex flex-col gap-4 sm:flex-row sm:gap-2 justify-items-end">
                                  <div className="flex flex-col flex-1 gap-2">
                                    <Typography variant="sm" className="text-stone-400">
                                      Amount to lock up
                                    </Typography>
                                    <div className="h-[51px]">
                                      {' '}
                                      <Input.Numeric
                                        value={amount}
                                        onUserInput={(val) => setAmount(val)}
                                        className="h-full"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col w-full sm:w-[180px] gap-2">
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
                                        <Select.Option disabled value="hETH">
                                          <TokenOption disabled token="hETH" />
                                        </Select.Option>
                                        <Select.Option disabled value="hBTC">
                                          <TokenOption disabled token="hBTC" />
                                        </Select.Option>
                                      </Select.Options>
                                    </Select>
                                  </div>
                                </div>

                                {/* <div
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
                                </div> */}

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

                                <div className="p-4 mt-2 sm:mt-4 bg-stone-800 rounded-xl">
                                  {fetchLoading ? (
                                    <div className="flex flex-col gap-4">
                                      <div className="flex justify-between">
                                        <Typography variant="sm" className="text-stone-400">
                                          Bonus you'll get now:
                                        </Typography>
                                        <Typography variant="sm" className="text-stone-600">
                                          Calculating...
                                        </Typography>
                                      </div>
                                      <div className="flex justify-between">
                                        <Typography variant="sm" className="text-stone-400">
                                          HTR matched:
                                        </Typography>
                                        <Typography variant="sm" className="text-stone-600">
                                          Calculating...
                                        </Typography>
                                      </div>
                                      <div className="flex justify-between">
                                        <Typography variant="sm" className="text-stone-400">
                                          Unlock date:
                                        </Typography>
                                        <Typography variant="sm" className="text-stone-600">
                                          Calculating...
                                        </Typography>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-4">
                                      <div className="flex justify-between">
                                        <Typography variant="sm" className="text-stone-400">
                                          Bonus you'll get now:
                                        </Typography>
                                        <Typography variant="sm" className="text-yellow">
                                          {amount ? `${bonus.toFixed(2)} HTR` : '-'}
                                        </Typography>
                                      </div>
                                      <div className="flex justify-between">
                                        <Typography variant="sm" className="text-stone-400">
                                          HTR Match:
                                        </Typography>
                                        <Typography variant="sm" className="text-yellow">
                                          {amount ? `${htrMatch.toFixed(2)} HTR` : '-'}
                                        </Typography>
                                      </div>
                                      <div className="flex justify-between">
                                        <div className="flex flex-col gap-1">
                                          <Typography variant="sm" className="text-stone-400">
                                            Unlock date:
                                          </Typography>
                                          {hasPosition && (
                                            <Typography variant="xs" className="text-stone-600">
                                              User already have a position in Oasis, unlock date is calculated based on
                                              the last deposit and time remaining
                                            </Typography>
                                          )}
                                        </div>
                                        <Typography variant="sm" className="text-yellow">
                                          {amount ? unlockDate.toLocaleDateString() : '-'}
                                        </Typography>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <Checker.Amounts
                                  fullWidth
                                  size="md"
                                  // chainId={chainId}
                                  // fundSource={FundSource.WALLET}
                                  amount={Number(amount)}
                                  token={new Token({ chainId: ChainId.HATHOR, uuid: tokenUuid, decimals: 2 })}
                                >
                                  <Connected fullWidth size="md">
                                    <div className="flex flex-col justify-between gap-2">
                                      <Button
                                        size="md"
                                        disabled={isRpcRequestPending}
                                        fullWidth
                                        onClick={() => setAddModalOpen(true)}
                                      >
                                        {isRpcRequestPending ? (
                                          <Dots>Confirm transaction in your wallet</Dots>
                                        ) : (
                                          <>Add Liquidity</>
                                        )}
                                      </Button>
                                    </div>
                                  </Connected>
                                </Checker.Amounts>

                                <div className="w-full mt-4">
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
                                      {usedHTR.toLocaleString()} / {maxHTR.toLocaleString()} HTR
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

                                  {allUserOasis?.length == 0 ? (
                                    <div className="py-8 text-center">
                                      <Typography variant="sm" className="text-stone-500">
                                        No active positions found.
                                        <br />
                                        Start by making a deposit!
                                      </Typography>
                                    </div>
                                  ) : (
                                    allUserOasis?.map((oasis) => {
                                      return (
                                        <UserOasisPosition
                                          oasis={oasis}
                                          key={oasis.id}
                                          buttonWithdraw={
                                            <div className="flex flex-col justify-between gap-2 px-4">
                                              <Button
                                                size="sm"
                                                disabled={isRpcRequestPending}
                                                onClick={() => {
                                                  setSelectedOasisForRemove(oasis)
                                                  setRemoveModalOpen(true)
                                                }}
                                              >
                                                {isRpcRequestPending ? (
                                                  <Dots>Confirm transaction in your wallet</Dots>
                                                ) : (
                                                  <>Remove Liquidity</>
                                                )}
                                              </Button>
                                              {isRpcRequestPending && (
                                                <Button
                                                  size="md"
                                                  testdata-id="swap-review-reset-button"
                                                  fullWidth
                                                  variant="outlined"
                                                  color="red"
                                                  onClick={() => reset()}
                                                >
                                                  Cancel Transaction
                                                </Button>
                                              )}
                                            </div>
                                          }
                                          buttonWithdrawBonus={
                                            <div className="flex flex-col justify-between gap-2 p-4">
                                              <Button
                                                size="sm"
                                                variant="empty"
                                                disabled={isRpcRequestPending}
                                                onClick={() => {
                                                  onClickWithdrawBonus(oasis.id)
                                                }}
                                              >
                                                {isRpcRequestPending ? (
                                                  <Dots>Confirm transaction in your wallet</Dots>
                                                ) : (
                                                  <>Withdraw Bonus</>
                                                )}
                                              </Button>
                                              {isRpcRequestPending && (
                                                <Button
                                                  size="md"
                                                  testdata-id="swap-review-reset-button"
                                                  fullWidth
                                                  variant="outlined"
                                                  color="red"
                                                  onClick={() => reset()}
                                                >
                                                  Cancel Transaction
                                                </Button>
                                              )}
                                            </div>
                                          }
                                        />
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            </Tab.Panel>
                          </Tab.Panels>
                        </div>
                      </Tab.Group>
                    </div>
                  </div>
                </Widget.Content>
              </Widget>
            </div>
          </div>
        </div>
      </div>
      <OasisAddModal
        open={addModalOpen}
        setOpen={setAddModalOpen}
        amount={amount}
        token={currency}
        bonus={bonus}
        htrMatch={htrMatch}
        unlockDate={unlockDate}
        onConfirm={handleAddLiquidity}
        isRpcRequestPending={isRpcRequestPending}
        onReset={reset}
      />

      <OasisRemoveModal
        open={removeModalOpen}
        setOpen={setRemoveModalOpen}
        oasis={selectedOasisForRemove}
        onConfirm={handleRemoveLiquidity}
        isRpcRequestPending={isRpcRequestPending}
        onReset={reset}
      />
    </div>
  )
}

export default OasisProgram
