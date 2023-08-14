import { useIsSmScreen } from '@dozer/hooks'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/legacy/image'
import { useRef } from 'react'

import how_bg from './How-bg.png'
import how_front from './How-front.png'

export const HowImage = () => {
  const isSmallScreen = useIsSmScreen()
  const scrollRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    axis: 'y',
    offset: ['end end', 'start end'],
  })
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.8])

  return (
    <div className="z-[1] relative sm:w-[420px] h-[420px]">
      <Image alt="how-we-make-it-hathor-bg" objectFit="contain" src={how_bg} layout="fill" />
      <motion.div
        className="z-[2] relative sm:w-[420px] h-[420px]"
        ref={scrollRef}
        {...(!isSmallScreen && { ...{ style: { opacity, scale } } })}
      >
        <Image alt="dozer-icon" objectFit="contain" src={how_front} layout="fill" />
      </motion.div>
    </div>
  )
}
