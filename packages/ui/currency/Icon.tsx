// components/Currency/Icon.tsx
import { FC, memo } from 'react'
import Image from 'next/image'
import { DefaultTokenIcon } from './DefaultTokenIcon'
import type { Currency } from '@dozer/currency' // Make sure to import the Currency type

export interface IconProps {
  currency: Currency
  width: number
  height: number
  priority?: boolean
  loading?: 'eager' | 'lazy'
}

export const Icon: FC<IconProps> = memo(({ currency, width, height, priority, loading }) => {
  const iconUrl = currency.imageUrl || ''

  if (iconUrl == '') {
    const logoURI = currency.logoURI?.()
    const isLocalSvg = logoURI && !logoURI.startsWith('http')

    if (isLocalSvg) {
      return (
        <div className="relative overflow-hidden rounded-full bg-stone-800">
          <img src={logoURI} alt={`${currency.symbol} icon`} width={width} height={height} className="object-contain" />
        </div>
      )
    }

    return <DefaultTokenIcon symbol={currency.symbol || 'TK'} size={width} />
  }

  return (
    <div className="relative overflow-hidden rounded-full bg-stone-800" style={{ width, height }}>
      <Image
        src={iconUrl}
        alt={`${currency.symbol} icon`}
        fill
        className="object-contain w-full h-full"
        priority={priority}
        loading={loading}
        sizes={`${width}px`}
        quality={75}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            const defaultIcon = document.createElement('div')
            defaultIcon.style.width = `${width}px`
            defaultIcon.style.height = `${height}px`
            defaultIcon.className = 'flex items-center justify-center'
            parent.appendChild(defaultIcon)

            defaultIcon.innerHTML = `<div class="rounded-full flex items-center justify-center bg-stone-800 text-stone-300" style="width: ${width}px; height: ${height}px; font-size: ${
              width * 0.4
            }px">${currency.symbol?.slice(0, 2).toUpperCase()}</div>`
          }
        }}
      />
    </div>
  )
})

Icon.displayName = 'CurrencyIcon'

// Add both default and named exports
export default Icon
