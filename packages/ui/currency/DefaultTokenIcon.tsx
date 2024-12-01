import { FC, useMemo } from 'react'

interface DefaultTokenIconProps {
  symbol: string
  size: number
}

export const DefaultTokenIcon: FC<DefaultTokenIconProps> = ({ symbol, size }) => {
  const letters = useMemo(() => symbol.slice(0, 2).toUpperCase(), [symbol])

  return (
    <div
      className="flex items-center justify-center rounded-full bg-stone-800 text-stone-300"
      style={{
        width: size,
        height: size,
        fontSize: `${size * 0.4}px`,
      }}
    >
      {letters}
    </div>
  )
}

export default DefaultTokenIcon
