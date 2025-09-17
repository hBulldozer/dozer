import { FC, memo, useState, SyntheticEvent } from 'react'
import Image, { ImageProps } from 'next/image'
import { DefaultTokenIcon } from './DefaultTokenIcon'
import type { Currency } from '@dozer/currency'

// Type assertion to fix React version compatibility issues with Next.js Image
const NextImage = Image as React.ComponentType<ImageProps>
export interface IconProps extends Omit<ImageProps, 'src' | 'alt'> {
  currency: Currency
  priority?: boolean
  loading?: 'eager' | 'lazy'
}

export const Icon: FC<IconProps> = memo(({ currency, priority, loading, ...rest }) => {
  const width = rest.width || 24
  const height = rest.height || 24
  const [imageLoadError, setImageLoadError] = useState(false)

  // Check existing imageUrl (now includes DozerTools URLs) and logoURI
  const iconUrl = currency.imageUrl || ''
  const logoURI = currency.logoURI?.()
  const isLocalSvg = logoURI && !logoURI.startsWith('http')

  // Priority order: existing imageUrl (includes DozerTools) → logoURI → default
  if (iconUrl !== '') {
    // Use existing imageUrl
    return (
      <div className="overflow-hidden relative rounded-full bg-stone-800" style={{ width, height }}>
        <NextImage
          {...rest}
          src={iconUrl}
          alt={`${currency.symbol} icon`}
          width={width}
          height={height}
          className="object-contain w-full h-full"
          priority={priority}
          loading={loading}
          sizes={`${width}px`}
          quality={75}
          blurDataURL={`data:image/svg+xml;base64,${btoa(
            `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1c1917"/></svg>`
          )}`}
          onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              const defaultIcon = document.createElement('div')
              defaultIcon.style.width = `${width}px`
              defaultIcon.style.height = `${height}px`
              defaultIcon.className = 'flex justify-center items-center'
              parent.appendChild(defaultIcon)

              defaultIcon.innerHTML = `<div class="flex justify-center items-center rounded-full bg-stone-800 text-stone-300" style="width: ${width}px; height: ${height}px; font-size: ${
                width || 24 * 0.4
              }px">${currency.symbol?.slice(0, 2).toUpperCase()}</div>`
            }
          }}
        />
      </div>
    )
  }

  if (isLocalSvg) {
    // Use local SVG
    return (
      <div className="overflow-hidden relative rounded-full bg-stone-800">
        <NextImage
          src={logoURI}
          alt={`${currency.symbol} icon`}
          width={width}
          height={height}
          className="object-contain"
          unoptimized
        />
      </div>
    )
  }

  if (logoURI) {
    // Use remote logoURI
    return (
      <div className="overflow-hidden relative rounded-full bg-stone-800" style={{ width, height }}>
        <NextImage
          {...rest}
          src={logoURI}
          alt={`${currency.symbol} icon`}
          width={width}
          height={height}
          className="object-contain w-full h-full"
          priority={priority}
          loading={loading}
          sizes={`${width}px`}
          quality={75}
          blurDataURL={`data:image/svg+xml;base64,${btoa(
            `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1c1917"/></svg>`
          )}`}
          onError={() => setImageLoadError(true)}
        />
      </div>
    )
  }

  // Final fallback: default icon
  return <DefaultTokenIcon alt={`${currency.symbol} icon`} symbol={currency.symbol || 'TK'} {...rest} />
})

Icon.displayName = 'CurrencyIcon'

export default Icon
