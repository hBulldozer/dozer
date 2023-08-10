import { useIsSmScreen } from '@dozer/hooks'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/legacy/image'
import { useRef, useState } from 'react'

import how from './How.png'

export const HowImage = () => {
  const isSmallScreen = useIsSmScreen()
  const scrollRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    axis: 'y',
    offset: ['end end', 'start end'],
  })
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.5])

  return (
    <motion.div
      className="z-[1] relative sm:w-[420px] h-[420px]"
      ref={scrollRef}
      {...(!isSmallScreen && { ...{ style: { opacity, scale } } })}
    >
      <Image alt="stellar" objectFit="contain" src={how} layout="fill" />
    </motion.div>
  )
}
