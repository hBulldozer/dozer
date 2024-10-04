import * as React from 'react'

import { PairingTypes } from '@walletconnect/types'

import Peer from './Peer'

interface PairingProps {
  pairing: PairingTypes.Struct
  onClick?: any
}

const Pairing = (props: PairingProps) => {
  const { peerMetadata } = props.pairing
  return (
    <div className="w-full py-1 cursor-pointer" onClick={props.onClick}>
      {typeof peerMetadata !== 'undefined' ? <Peer oneLiner metadata={peerMetadata} /> : <div>{`Unknown Wallet`}</div>}
    </div>
  )
}

export default Pairing
