import React from 'react'
import classnames from 'classnames'
import Image from 'next/image'
import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconBrandYoutubeFilled } from '@tabler/icons-react'
import { Highlight, HeroHighlight } from '@dozer/ui/aceternity/ui/hero-highlight'
import Link from 'next/link'
import { BackgroundBeams } from '@dozer/ui/aceternity/ui/background-beams'

export default function Features() {
  const features = [
    {
      title: 'How we make it',
      description:
        'Leveraging Hathor BlockDag architecture, innovating with Nano Contracts and building on the shoulders of DeFi giants',
      skeleton: <SkeletonOne />,
      className: 'col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800',
    },
    {
      title: 'Create your own token in minutes',
      description: 'Our launchpad platoform allows the token creation and liquidity pool deployment.',
      skeleton: <SkeletonTwo />,
      className: 'border-b col-span-1 lg:col-span-2 dark:border-neutral-800',
    },
    {
      title: 'EVM Bridge',
      description: 'Bring your assets to Hathor Network, enjoy zero fess and blasting speed on your transactions.   ',
      skeleton: <SkeletonThree />,
      className: 'col-span-1 lg:col-span-3 lg:border-r  dark:border-neutral-800',
    },
    {
      title: 'Your keys, your coins',
      description:
        'Own your own crypto, just like cash in your wallet. Fully decentralized & self custody of your funds means your money in your wallet, as it should be.',
      skeleton: <SkeletonFour />,
      className: 'col-span-1 lg:col-span-3 border-b lg:border-none',
    },
  ]
  return (
    <div className="relative z-20 mx-auto -mt-48 lg:py-40 max-w-7xl">
      <HeroHighlight>
        <motion.h1
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: [20, -5, 0],
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0.0, 0.2, 1],
          }}
          className="max-w-4xl px-4 mx-auto text-2xl font-bold leading-relaxed text-center md:text-4xl lg:text-5xl text-neutral-700 dark:text-white lg:leading-snug "
        >
          Dozer brings <Highlight className="text-black dark:text-white">the power of DeFi</Highlight> to everyone.
        </motion.h1>
      </HeroHighlight>

      <div className="relative ">
        <div className="grid grid-cols-1 rounded-md lg:grid-cols-6 xl:border dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="w-full h-full ">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  )
}

const FeatureCard = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  return <div className={classnames(`p-4 sm:p-8 relative overflow-hidden`, className)}>{children}</div>
}

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="max-w-5xl mx-auto text-xl tracking-tight text-left text-black dark:text-white md:text-2xl md:leading-snug">
      {children}
    </p>
  )
}

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={classnames(
        'text-sm md:text-base  max-w-4xl text-left mx-auto',
        'text-neutral-500 text-center font-normal dark:text-neutral-300',
        'text-left max-w-sm mx-0 md:text-sm my-2'
      )}
    >
      {children}
    </p>
  )
}

export const SkeletonOne = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full antialiased bg-black rounded-md">
      <BackgroundBeams />
    </div>
  )
}

export const SkeletonThree = () => {
  return (
    <Link
      href="https://www.youtube.com/watch?v=RPa3_AD1_Vs"
      target="__blank"
      className="relative flex h-full gap-10 group/image"
    >
      <div className="w-full h-full mx-auto bg-transparent dark:bg-transparent group">
        <div className="relative flex flex-col flex-1 w-full h-full space-y-2">
          {/* TODO */}
          <IconBrandYoutubeFilled className="absolute inset-0 z-10 w-20 h-20 m-auto text-red-500 " />
        </div>
      </div>
    </Link>
  )
}

export const SkeletonTwo = () => {
  const images = [
    'https://supabase.dozer.finance/storage/v1/object/public/memecoins/1.jpg',
    'https://supabase.dozer.finance/storage/v1/object/public/memecoins/2.jpg',
    'https://supabase.dozer.finance/storage/v1/object/public/memecoins/3.jpg',
    'https://supabase.dozer.finance/storage/v1/object/public/memecoins/4.jpg',
    'https://supabase.dozer.finance/storage/v1/object/public/memecoins/5.jpg',
  ]

  const imageVariants = {
    whileHover: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
    whileTap: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
  }
  return (
    <div className="relative flex flex-col items-start h-full gap-10 p-8 overflow-hidden">
      {/* TODO */}
      <div className="flex flex-row -ml-20">
        {images.map((image, idx) => (
          <motion.div
            variants={imageVariants}
            key={'images-first' + idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            whileHover="whileHover"
            whileTap="whileTap"
            className="flex-shrink-0 p-1 mt-4 -mr-4 overflow-hidden bg-white border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 border-neutral-100"
          >
            <Image
              src={image}
              alt="bali images"
              width="500"
              height="500"
              className="flex-shrink-0 object-cover w-20 h-20 rounded-lg md:h-40 md:w-40"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row">
        {images.map((image, idx) => (
          <motion.div
            key={'images-second' + idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="flex-shrink-0 p-1 mt-4 -mr-4 overflow-hidden bg-white border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 border-neutral-100"
          >
            <Image
              src={image}
              alt="bali images"
              width="500"
              height="500"
              className="flex-shrink-0 object-cover w-20 h-20 rounded-lg md:h-40 md:w-40"
            />
          </motion.div>
        ))}
      </div>

      <div className="absolute left-0 z-[100] inset-y-0 w-20 bg-gradient-to-r from-white dark:from-black to-transparent  h-full pointer-events-none" />
      <div className="absolute right-0 z-[100] inset-y-0 w-20 bg-gradient-to-l from-white dark:from-black  to-transparent h-full pointer-events-none" />
    </div>
  )
}

export const SkeletonFour = () => {
  return (
    <div className="relative flex flex-col items-center mt-10 bg-transparent h-60 md:h-60 dark:bg-transparent">
      <Globe className="absolute -right-10 md:-right-10 -bottom-80 md:-bottom-72" />
    </div>
  )
}

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let phi = 0

    if (!canvasRef.current) return

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi
        phi += 0.01
      },
    })

    return () => {
      globe.destroy()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: '100%', aspectRatio: 1 }}
      className={className}
    />
  )
}
