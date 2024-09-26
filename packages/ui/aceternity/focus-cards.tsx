'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import classnames from 'classnames'

export const FocusCard = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: any
    index: number
    hovered: number | null
    setHovered: React.Dispatch<React.SetStateAction<number | null>>
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={classnames(
        'rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out',
        hovered !== null && hovered !== index && 'blur-sm scale-[0.98]'
      )}
    >
      <Image src={card.src} alt={card.title} fill className="absolute inset-0 object-cover" />
      <div
        className={classnames(
          'absolute inset-0 bg-black/50 flex items-end py-8 px-4 transition-opacity duration-300',
          hovered === index ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="text-xl font-medium text-transparent md:text-2xl bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-200">
          {card.title}
        </div>
      </div>
    </div>
  )
)

FocusCard.displayName = 'Card'

type Card = {
  title: string
  src: string
}

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-10 mx-auto md:grid-cols-3 md:px-8">
      {cards.map((card, index) => (
        <FocusCard key={card.title} card={card} index={index} hovered={hovered} setHovered={setHovered} />
      ))}
    </div>
  )
}
