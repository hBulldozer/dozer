import React from 'react'
import Image from 'next/image'

interface CustomToken {
  id: number
  uuid: string
  chainId: number
  name: string
  symbol: string
  imageUrl: string
  // Add other fields as needed
}

interface CustomTokenIconProps {
  token?: CustomToken
  isHtr?: boolean
  size?: number
}

const HathorLogo = '/logos/HTR.svg'

export const CustomTokenIcon: React.FC<CustomTokenIconProps> = ({ token, isHtr = false, size = 24 }) => {
  if (isHtr) {
    return <Image src={HathorLogo} alt={'HTR'} width={size} height={size} className="object-cover" />
  }

  if (!token) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <Image src={token.imageUrl} alt={token.name} width={size} height={size} className="object-cover" />
    </div>
  )
}
