'use client'

import dynamic from 'next/dynamic'

const Background = dynamic(() => import('components/Background/Background'), { ssr: false })
const DonationProgress = dynamic(() => import('components/DonationProgress/DonationProgress'), { ssr: false })
const Features = dynamic(() => import('components/Features/Features'), { ssr: false })

const Home = () => {
  return (
    <>
      <Background />
      <DonationProgress />
      <Features />
    </>
  )
}

export default Home
