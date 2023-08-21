import { useIsSmScreen } from '@dozer/hooks'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/legacy/image'
import { useRef } from 'react'

import orbit from './orbit.png'
import orbit_enhanced from './orbit enhanced.jpg'

export const MoveImage = () => {
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
    // <div className="sm:relative sm:w-[420px] sm:h-[420px] sm:flex sm:justify-center sm:items-center">
    <motion.div
      className="z-[1] relative w-[380px] h-[380px]"
      ref={scrollRef}
      {...(!isSmallScreen && { ...{ style: { opacity, scale } } })}
    >
      <Image
        alt="stellar"
        objectFit="contain"
        // src={orbit}
        src={orbit_enhanced}
        layout="fill"
      />
    </motion.div>
    // </div>
  )
}
