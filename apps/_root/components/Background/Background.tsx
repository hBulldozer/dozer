'use client'
import { Container, DozerWithTextIcon, Typography, WavyBackground } from '@dozer/ui'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import React from 'react'
import { CountdownTimer } from 'components/NewLanding/CountdownTimer'
import { MAINNET_LAUNCH_DATE } from 'utils/launchDates'

const DynamicWavyBackground = dynamic(
  () => import('@dozer/ui/aceternity/wavy-background').then((mod) => mod.WavyBackground),
  {
    ssr: false,
  }
)

const Background = () => {
  return (
    <header className="relative w-full h-screen sm:h-[900px] md:h-[1000px] lg:h-[1100px] -mt-24 overflow-hidden">
      <DynamicWavyBackground
        // colors={['#eab308', '#facc15', '#f59e0b', '#fde68a', '#fef3c7']}
        colors={['#eab308', '#f59e0b', '#fde047', '#facc15', '#fef9c3']}
        className="absolute top-0 left-0 w-full h-full "
        containerClassName="w-full h-full"
      ></DynamicWavyBackground>
      {/* Countdown positioned on the waves */}
      <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
        <div className="px-6 py-8 backdrop-blur-sm rounded-2xl sm:px-8 sm:py-10 md:px-12 md:py-12">
          <CountdownTimer
            targetDate={MAINNET_LAUNCH_DATE}
            title="The wait is almost over. Dozer Mainnet is arriving."
          />
        </div>
      </div>
    </header>
  )
}

export default Background
