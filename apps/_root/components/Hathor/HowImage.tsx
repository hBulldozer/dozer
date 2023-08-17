import { useIsSmScreen } from '@dozer/hooks'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/legacy/image'
import { useRef } from 'react'

import how_bg from './How-bg.png'
import how_front from './How-front.png'

function transformTemplate(transformProps: any) {
  return `perspective(${transformProps.y.toString()}) rotateX(${transformProps.rotateX.toString()}) scale(${transformProps.scale.toString()})`
}
export const HowImage = () => {
  const isSmallScreen = useIsSmScreen()
  const scrollRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: scrollRef, axis: 'y' })
  const opacity = useTransform(scrollYProgress, [0.7, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0.7, 1], [1, 1.5])
  const perspective = useTransform(scrollYProgress, [0.7, 1], [200, 1200])
  const rotateX = useTransform(scrollYProgress, [0.7, 1], [0, 60])

  return (
    <div className="z-[1] relative sm:w-[420px] h-[420px]">
      <Image alt="how-we-make-it-hathor-bg" objectFit="contain" src={how_bg} layout="fill" />
      <motion.div
        className="z-[2] relative sm:w-[420px] h-[420px]"
        ref={scrollRef}
        {...(!isSmallScreen && {
          ...{
            transformTemplate,
            style: { opacity, scale, y: perspective, rotateX },
          },
        })}
      >
        <Image alt="dozer-icon" objectFit="contain" src={how_front} layout="fill" />
      </motion.div>
    </div>
  )
}
