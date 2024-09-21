'use client'
import { Container, Typography } from '@dozer/ui'
import Image from 'next/image'
import React from 'react'
import { WavyBackground } from '@dozer/ui/aceternity/ui/wavy-background'

const Background = () => {
  return (
    <header className="relative w-full h-screen -mt-24 overflow-hidden">
      <WavyBackground
        colors={['#713f12', '#eab308', '#fde047', '#78716c', '#44403c']}
        className="absolute top-0 left-0 w-full h-full"
        containerClassName="w-full h-full"
      >
        <Container maxWidth="5xl" className="relative z-10 flex items-center h-full px-4 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_400px] justify-between gap-[100px]">
            <div className="flex flex-col">
              <div className="absolute w-[210px] h-[210px] bg-black rounded-full blur-[200px]" />
              <Typography
                variant="hero"
                weight={900}
                className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)] leading-[3.5rem]"
              >
                Overcoming the DeFi challenges
              </Typography>
              <Typography variant="lg" className="mt-3 drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)]">
                Safe, fast and easy.
              </Typography>
              <div className="flex items-center">
                <Typography variant="xxs" className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)]">
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
      </WavyBackground>
    </header>
  )
}

export default Background
