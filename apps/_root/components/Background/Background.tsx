'use client'
import { Container, Typography } from '@dozer/ui'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'

const DynamicWavyBackground = dynamic(
  () => import('@dozer/ui/aceternity/wavy-background').then((mod) => mod.WavyBackground),
  {
    ssr: false,
  }
)

const Background = () => {
  // Default to true (mobile/safe) - only show heavy effects after confirming desktop
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Check if desktop: screen width >= 640px (sm breakpoint) AND not a mobile user agent
    const checkDesktop = () => {
      const isLargeScreen = window.innerWidth >= 640
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        (navigator.userAgent || '').toLowerCase()
      )
      return isLargeScreen && !isMobileUA
    }
    setIsDesktop(checkDesktop())
  }, [])

  const textContent = (
    <>
      <Typography
        variant="hero"
        weight={900}
        className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)] leading-[3rem] lg:leading-[3.5rem] text-3xl lg:text-5xl"
      >
        Easy, Fast and Safe.
      </Typography>
      <Typography variant="lg" className="mt-3 text-white drop-shadow-md lg:text-lg" weight={500}>
        Overcoming the DeFi challenges.
      </Typography>
      <div className="flex items-center">
        <Typography variant="xxs" className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)] text-xs lg:text-sm">
          Powered by
        </Typography>
        <Image
          className="ml-1 drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)]"
          width={45}
          height={15}
          alt="Hathor logo"
          src="/logos/Logo White.svg"
        />
      </div>
    </>
  )

  // Default to simple black background (mobile-safe) - no blur effects
  if (!isDesktop) {
    return (
      <header className="relative w-full min-h-screen -mt-24 overflow-hidden bg-black flex items-center">
        <Container maxWidth="5xl" className="relative z-10 flex items-center h-full px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 z-10">
            <div className="flex flex-col">{textContent}</div>
          </div>
        </Container>
      </header>
    )
  }

  return (
    <header className="relative w-full min-h-screen -mt-24 overflow-hidden">
      <DynamicWavyBackground
        colors={['#eab308', '#f59e0b', '#fde047', '#facc15', '#fef9c3']}
        className="absolute top-0 left-0 w-full h-full"
        containerClassName="w-full h-full"
      >
        <Container maxWidth="5xl" className="relative z-10 flex items-center h-full px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[auto_400px] lg:justify-between lg:gap-[50px] z-10">
            <div className="flex flex-col">
              {/* Heavy blur only on desktop */}
              <div className="absolute w-[210px] h-[210px] bg-black rounded-full blur-[200px]" />
              {textContent}
            </div>
          </div>
        </Container>
      </DynamicWavyBackground>
    </header>
  )
}

export default Background
