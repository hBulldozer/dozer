import { ImageProps } from 'next/image'
import { FC, useMemo } from 'react'

interface DefaultTokenIconProps extends Omit<ImageProps, 'src'> {
  symbol: string
}

export const DefaultTokenIcon: FC<DefaultTokenIconProps> = ({ symbol, ...rest }) => {
  const letters = useMemo(() => symbol.slice(0, 2).toUpperCase(), [symbol])

  return (
    <div
      className="flex items-center justify-center rounded-full bg-stone-800 text-stone-300"
      {...rest}
      style={{
        width: rest.width,
        height: rest.height,
        fontSize: `${((rest.height as number) || 24) * 0.4}px`,
      }}
      title={symbol}
    >
      {letters}
    </div>
  )
}

export default DefaultTokenIcon
