import React, { useState, useEffect } from 'react'
import { Link, Tooltip, Typography } from '@dozer/ui' // Assuming Dozer UI for text styling
import { useNetwork } from '@dozer/zustand'
import chains from '@dozer/chain'
import { client } from '@dozer/api'

interface Props {
  animationDuration?: number // Optional animation duration in milliseconds
  client: typeof client
}

const BlockTracker: React.FC<Props> = ({ client, animationDuration = 1000 }) => {
  const [number, setNumber] = useState<string | undefined>('')
  const [previousNumber, setPreviousNumber] = useState<string | undefined>()
  const { network } = useNetwork()

  const { data } = client.getNetwork.getBestBlock.useQuery(undefined, { refetchInterval: 30000 })
  const utils = client.useUtils()

  useEffect(() => {
    const fetchData = async () => {
      console.log('fetch frontend')
      try {
        const newNumber = await utils.getNetwork.getBestBlock.ensureData(undefined)
        if (newNumber !== previousNumber) {
          setPreviousNumber(number) // Update previous number after animation
          setNumber(newNumber)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    const intervalId = setInterval(fetchData, 5000) // Polling interval (5 seconds)

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, [data, previousNumber])

  const animationClasses =
    number !== previousNumber
      ? `animate-spin` // One-time animation
      : `animate-pulse ${animationDuration}ms ease-in-out infinite` // One-time animation

  return (
    <div className="fixed flex items-center bottom-10 right-10">
      <Link.External href={number ? chains[network].getTxUrl(number) : ''} className="!no-underline">
        <Tooltip
          placement="left"
          button={
            <span>
              <div className="flex items-center ">
                <div className={`bg-green-500 rounded-full p-1 ${animationClasses}`}></div>
                <Typography className="ml-2 text-green-500 text-bold" variant="sm">
                  {number?.slice(-6) || 'Loading...'}
                </Typography>
              </div>
            </span>
          }
          panel={
            <div className="text-xs rounded-2xl text-stone-300">
              The most recent block number on this network. Prices update on every block.
            </div>
          }
        />
      </Link.External>
    </div>
  )
}

export default BlockTracker
