import { ImageProps } from 'next/image'
import { FC, useMemo } from 'react'

interface DefaultTokenIconProps extends Omit<ImageProps, 'src'> {
  symbol: string
}

export const DefaultTokenIcon: FC<DefaultTokenIconProps> = ({ symbol, width, height, ...rest }) => {
  const letters = useMemo(() => symbol.slice(0, 2).toUpperCase(), [symbol])

  return (
    <div className="overflow-hidden relative rounded-full bg-stone-800" style={{ width, height }}>
      <div
        className="flex items-center justify-center w-full h-full text-stone-300"
        style={{
          fontSize: `${((height as number) || 24) * 0.4}px`,
        }}
        title={symbol}
      >
        {letters}
      </div>
    </div>
  )
}

export default DefaultTokenIcon
