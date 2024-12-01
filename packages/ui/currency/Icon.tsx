// components/Currency/Icon.tsx
import { FC, memo } from 'react'
import Image, { ImageProps } from 'next/image'
import { DefaultTokenIcon } from './DefaultTokenIcon'
import type { Currency } from '@dozer/currency'
export interface IconProps extends Omit<ImageProps, 'src' | 'alt'> {
  currency: Currency
  priority?: boolean
  loading?: 'eager' | 'lazy'
}

export const Icon: FC<IconProps> = memo(({ currency, priority, loading, ...rest }) => {
  const width = rest.width || 24
  const height = rest.height || 24
  const iconUrl = currency.imageUrl || ''

  if (iconUrl == '') {
    const logoURI = currency.logoURI?.()
    const isLocalSvg = logoURI && !logoURI.startsWith('http')

    if (isLocalSvg) {
      return (
        <div className="relative overflow-hidden rounded-full bg-stone-800">
          <img
            src={logoURI}
            alt={`${currency.symbol} icon`}
            width={rest.width}
            height={rest.height}
            className="object-contain"
          />
        </div>
      )
    }

    return <DefaultTokenIcon symbol={currency.symbol || 'TK'} alt={`${currency.symbol} icon`} />
  }

  return (
    <div className="relative overflow-hidden rounded-full bg-stone-800" style={{ width, height }}>
      <Image
        {...rest}
        src={iconUrl}
        alt={`${currency.symbol} icon`}
        fill
        className="object-contain w-full h-full"
        priority={priority}
        loading={loading}
        sizes={`${rest.width}px`}
        quality={75}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            const defaultIcon = document.createElement('div')
            defaultIcon.style.width = `${rest.width}px`
            defaultIcon.style.height = `${rest.height}px`
            defaultIcon.className = 'flex items-center justify-center'
            parent.appendChild(defaultIcon)

            defaultIcon.innerHTML = `<div class="rounded-full flex items-center justify-center bg-stone-800 text-stone-300" style="width: ${width}px; height: ${height}px; font-size: ${
              rest.width || 24 * 0.4
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
