'use client'
import React from 'react'
import { motion } from 'framer-motion'
import classnames from 'classnames'
import { useBreakpoint } from '@dozer/hooks'

export default function LampDemo() {
  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: 'easeInOut',
        }}
        className="py-4 mt-8 text-4xl font-medium tracking-tight text-center text-transparent bg-gradient-to-br from-stone-300 to-stone-500 bg-clip-text md:text-7xl"
      >
        Build lamps <br /> the right way
      </motion.h1>
    </LampContainer>
  )
}

export const LampContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { isSm } = useBreakpoint('sm')
  return (
    <div
      className={classnames(
        ' relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black w-full rounded-md z-0',
        className
      )}
    >
      <div className="relative z-0 flex items-center justify-center flex-1 w-full scale-y-125 isolate ">
        <motion.div
          initial={{ opacity: 0.5, width: `${!isSm ? '7rem' : '15rem'}` }}
          whileInView={{ opacity: 1, width: `${!isSm ? '15rem' : '30rem'}` }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-yellow-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute  w-[100%] left-0 bg-black h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute  w-40 h-[100%] left-0 bg-black  bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: `${!isSm ? '7rem' : '15rem'}` }}
          whileInView={{ opacity: 1, width: `${!isSm ? '15rem' : '30rem'}` }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-yellow-500 text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute  w-40 h-[100%] right-0 bg-black  bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute  w-[100%] right-0 bg-black h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute w-full h-48 scale-x-150 translate-y-12 bg-black top-1/2 blur-2xl"></div>
        <div className="absolute z-50 w-full h-48 bg-transparent top-1/2 opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-yellow-500 opacity-50 blur-3xl"></div>
        <motion.div
          initial={{ width: `${!isSm ? '4rem' : '8rem'}` }}
          whileInView={{ width: `${!isSm ? '8rem' : '16rem'}` }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-yellow-500 blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: `${!isSm ? '7rem' : '15rem'}` }}
          whileInView={{ width: `${!isSm ? '15rem' : '30rem'}` }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-yellow-500 "
        ></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-black "></div>
      </div>

      <div className="relative z-50 flex flex-col items-center px-5 -translate-y-80">{children}</div>
    </div>
  )
}
