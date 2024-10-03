'use client'

import dynamic from 'next/dynamic'
import { BuildWealth } from 'components/BuildWealth/BuildWealth'
import { Custody } from 'components/Story/Section1/Custody'
import { Hero } from 'components/Hero/Hero'
const Background = dynamic(() => import('components/Background/Background'), { ssr: false })
const DonationProgress = dynamic(() => import('components/DonationProgress/DonationProgress'), { ssr: false })
const Features = dynamic(() => import('components/Features/Features'), { ssr: false })
// const Custody = dynamic(() => import('components/Story/Section1/Custody'), { ssr: false })
// const Hero = dynamic(() => import('components/Hero/Hero'), { ssr: false })
// const BuildWealth = dynamic(() => import('components/BuildWealth/BuildWealth'), { ssr: false })
const Home = () => {
  return (
    <>
      <Background />
      <Hero />
      <BuildWealth />
      <Custody />
      <Features />
      <DonationProgress />
    </>
  )
}

export default Home
