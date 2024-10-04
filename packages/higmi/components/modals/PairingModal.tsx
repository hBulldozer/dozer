import { PairingTypes } from '@walletconnect/types'
import Client from '@walletconnect/sign-client'

import { Button, LoadingOverlayApproval, Typography } from '@dozer/ui'
import Pairing from './Pairing'

interface PairingModalProps {
  pairings: PairingTypes.Struct[]
  connect: (pairing?: { topic: string }) => Promise<void>
  client: Client
  isWaitingApproval: boolean
}

const PairingModal = (props: PairingModalProps) => {
  const { pairings, connect, client, isWaitingApproval } = props

  const deletePairingsAndConnect = async () => {
    // 1. Create an array to hold all the disconnect promises
    const disconnectPromises = pairings.map(async (pairing) => {
      return client.core.pairing.disconnect({ topic: pairing.topic })
    })

    // 2. Wait for all promises to resolve using Promise.all
    await Promise.all(disconnectPromises)

    // 3. All deletions are complete, now connect safely
    connect()
  }

  return (
    <>
      <LoadingOverlayApproval show={isWaitingApproval} />
      <div className="relative w-full break-words">
        <Typography variant="sm" weight={600}>
          {'Select available pairing or create new one'}
        </Typography>
        <div className="flex flex-col my-4 text-left">
          {pairings.map((pairing) => (
            <Pairing key={pairing.topic} pairing={pairing} onClick={() => connect({ topic: pairing.topic })} />
          ))}
        </div>
        <Button onClick={async () => deletePairingsAndConnect()}>{`New Pairing`}</Button>
      </div>
    </>
  )
}

export default PairingModal
