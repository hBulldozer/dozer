'use client'

import dynamic from 'next/dynamic'
import { BuildWealth } from 'components/BuildWealth/BuildWealth'
import { Custody } from 'components/Story/Section1/Custody'
import { Hero } from 'components/Hero/Hero'
const Background = dynamic(() => import('components/Background/Background'), { ssr: false })
const DonationProgress = dynamic(() => import('components/DonationProgress/DonationProgress'), { ssr: false })
const Features = dynamic(() => import('components/Features/Features'), { ssr: false })

const Product = () => {
  return (
    <>
      <Background />
      {/* <DonationProgress /> */}
      <Hero />
      <BuildWealth />
      <Custody />
      <Features />
    </>
  )
}

export default Product
