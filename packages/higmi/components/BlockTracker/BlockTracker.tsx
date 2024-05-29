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
  const [number, setNumber] = useState<number | undefined>(0)
  const [previousNumber, setPreviousNumber] = useState<number | undefined>()
  const [hash, setHash] = useState<string | undefined>('')
  const { network } = useNetwork()

  const { data } = client.getNetwork.getBestBlock.useQuery(undefined, { refetchInterval: 30000 })
  const utils = client.useUtils()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { number: newNumber, hash } = await utils.getNetwork.getBestBlock.ensureData(undefined)
        if (newNumber !== previousNumber) {
          setPreviousNumber(number) // Update previous number after animation
          setNumber(newNumber)
          setHash(hash)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    const intervalId = setInterval(fetchData, 5000) // Polling interval (5 seconds)

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, [data, previousNumber])

  const animationClasses = `animate-pulse ${animationDuration}ms ease-in-out infinite` // One-time animation

  return (
    <div className="fixed flex items-center bottom-5 right-5">
      <Link.External href={hash ? chains[network].getTxUrl(hash) : ''} className="!no-underline">
        <Tooltip
          placement="left"
          button={
            <span>
              <div className="flex items-center ">
                <div className={`bg-green-500 rounded-full p-1 ${animationClasses}`}></div>
                <Typography className="ml-2 text-green-500 text-bold" variant="sm">
                  {number || 'Loading...'}
                </Typography>
              </div>
            </span>
          }
          panel={<div className="text-xs rounded-2xl text-stone-300">Latest synced block</div>}
        />
      </Link.External>
    </div>
  )
}

export default BlockTracker
