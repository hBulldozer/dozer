'use client'
import { Container, Typography, WavyBackground } from '@dozer/ui'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import React from 'react'

const DynamicWavyBackground = dynamic(
  () => import('@dozer/ui/aceternity/wavy-background').then((mod) => mod.WavyBackground),
  {
    ssr: false,
  }
)

const Background = () => {
  return (
    <header className="relative w-full min-h-screen -mt-24 overflow-hidden">
      <DynamicWavyBackground
        colors={['#713f12', '#eab308', '#fde047', '#78716c', '#44403c']}
        className="absolute top-0 left-0 w-full h-full"
        containerClassName="w-full h-full"
      >
        <Container maxWidth="5xl" className="relative z-10 flex items-center h-full px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[auto_400px] lg:justify-between lg:gap-[100px]">
            <div className="flex flex-col">
              <div className="absolute w-[210px] h-[210px] bg-black rounded-full blur-[200px]" />
              <Typography
                variant="hero"
                weight={900}
                className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)] leading-[3rem] lg:leading-[3.5rem] text-3xl lg:text-5xl"
              >
                Overcoming the DeFi challenges
              </Typography>
              <Typography variant="lg" className="mt-3 drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)] text-base lg:text-lg">
                Safe, fast and easy.
              </Typography>
              <div className="flex items-center mt-4">
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
            </div>
          </div>
        </Container>
      </DynamicWavyBackground>
    </header>
  )
}

export default Background
