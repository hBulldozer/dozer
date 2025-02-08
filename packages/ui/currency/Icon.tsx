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
          <img src={logoURI} alt={`${currency.symbol} icon`} width={width} height={height} className="object-contain" />
        </div>
      )
    }

    return <DefaultTokenIcon alt={`${currency.symbol} icon`} symbol={currency.symbol || 'TK'} {...rest} />
  }

  return (
    <div className="relative overflow-hidden rounded-full bg-stone-800" style={{ width, height }}>
      <Image
        {...rest}
        src={iconUrl}
        alt={`${currency.symbol} icon`}
        // fill
        className="object-contain w-full h-full"
        priority={priority}
        loading={loading}
        sizes={`${width}px`}
        quality={75}
        // Add blur placeholder for better loading experience
        blurDataURL={`data:image/svg+xml;base64,${btoa(
          `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1c1917"/></svg>`
        )}`}
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
              width || 24 * 0.4
            }px">${currency.symbol?.slice(0, 2).toUpperCase()}</div>`
          }
        }}
      />
    </div>
  )
})

Icon.displayName = 'CurrencyIcon'

export default Icon
