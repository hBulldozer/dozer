import { PairingTypes } from '@walletconnect/types'

import { Button, Typography } from '@dozer/ui'
import Pairing from './Pairing'

interface PairingModalProps {
  pairings: PairingTypes.Struct[]
  connect: (pairing?: { topic: string }) => Promise<void>
}

const PairingModal = (props: PairingModalProps) => {
  const { pairings, connect } = props
  return (
    <div className="relative w-full break-words">
      <Typography variant="sm" weight={600}>
        {'Select available pairing or create new one'}
      </Typography>
      <div className="flex flex-col my-4 text-left">
        {pairings.map((pairing) => (
          <Pairing key={pairing.topic} pairing={pairing} onClick={() => connect({ topic: pairing.topic })} />
        ))}
      </div>
      <Button onClick={() => connect()}>{`New Pairing`}</Button>
    </div>
  )
}

export default PairingModal
