import { useIsSmScreen } from '@dozer/hooks'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/legacy/image'
import { useRef } from 'react'
import phone from './Phone with bg enhanced.jpg'

function transformTemplate(transformProps: any) {
  return `perspective(${transformProps.y.toString()}) rotateX(${transformProps.rotateX.toString()}) scale(${transformProps.scale.toString()})`
}

export const CustodyImage = () => {
  const isSmallScreen = useIsSmScreen()
  const scrollRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: scrollRef, axis: 'y' })
  const opacity = useTransform(scrollYProgress, [0.7, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0.7, 1], [1, 1.5])
  const perspective = useTransform(scrollYProgress, [0.7, 1], [200, 1200])
  const rotateX = useTransform(scrollYProgress, [0.7, 1], [0, 60])

  return (
    <motion.div
      ref={scrollRef}
      {...(!isSmallScreen && {
        ...{
          transformTemplate,
          style: { opacity, scale, y: perspective, rotateX },
        },
      })}
      className="relative w-[400px] h-[400px] -left-[84px] sm:left-0"
    >
      <Image alt="stellar" objectFit="contain" src={phone} layout="fill" />
    </motion.div>
  )
}
