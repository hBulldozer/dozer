import { Typography } from '@dozer/ui'
import { SignClientTypes } from '@walletconnect/types'
import * as React from 'react'

interface PeerProps {
  oneLiner?: boolean
  metadata: SignClientTypes.Metadata
}

const Peer = (props: PeerProps) =>
  props.oneLiner ? (
    <div className="flex items-center p-2 border-2 rounded-md hover:ring-1 border-opacity-20 ring-offset-2 ring-offset-neutral-600 rounded-xl">
      <img
        className="w-8 h-8 mr-2 rounded-full"
        src={'https://avatars.githubusercontent.com/u/40426718?s=200&v=4'}
        alt={props.metadata.name}
      />
      <div className="flex flex-col ">
        <Typography weight={500}>{props.metadata.name}</Typography>
        <Typography variant="xxs" className="text-neutral-400" weight={300}>
          {props.metadata.description}
        </Typography>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center w-full p-2 border-2 border-gray-400 rounded-md">
      <img className="w-24 mx-auto" src={props.metadata.icons[0]} alt={props.metadata.name} />
      <div className="font-bold text-center">{props.metadata.name}</div>
      <div className="text-center">{props.metadata.description}</div>
      <div className="text-sm text-center opacity-80">{props.metadata.url}</div>
    </div>
  )

export default Peer
