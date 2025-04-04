'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Dialog } from '@dozer/ui/dialog'
import { Typography } from '@dozer/ui/typography'
import { Link } from '@dozer/ui/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import PresaleModal from '../components/PresaleModal/PresaleModal'
import { PresaleSidebar, TabContentWithAssets, TabNavigation, FAQSection } from '../components/LandingPage'
import { Meteors, ShootingStars } from '@dozer/ui/aceternity'

interface StyledDialogButtonProps {
  children: React.ReactNode
  href: string
}

interface PresaleModalProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface PriceChangeTimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const Home: React.FC = () => {
  // FAQ items based on the tokenomics document
  const faqItems = [
    {
      question: 'What are Dozer Donor Tokens (DZD)?',
      answer:
        'DZD tokens represent early contributions to Dozer Finance. At the DZR token generation event, each DZD converts 1:1 into $1 worth of DZR tokens, ensuring fair, equal terms for all early supporters without any VC involvement.',
    },
    {
      question: 'How do I participate in the pre-sale?',
      answer:
        'Contribute using USDT or USDC on Polygon, or HTR on Hathor. After donating, contact our team via Telegram to receive your DZD tokens. Pre-sale ends May 5, 2025.',
    },
    {
      question: 'Is there any vesting or lock-up for DZR tokens from DZD?',
      answer: 'No. All DZR tokens converted from DZD at launch will be fully unlocked and immediately usable.',
    },
    {
      question: 'What benefits do DZD holders receive?',
      answer:
        'Holders of 100+ DZD gain DAO membership, private Discord access, early platform features, beta-testing opportunities, and voting rights in protocol decisions.',
    },
    {
      question: 'Are there transaction fees on Dozer Finance?',
      answer:
        'Transactions on Dozer incur zero blockchain gas fees. Trades include only a minimal liquidity provider fee (0.3%), significantly lower than typical Ethereum-based DEX costs.',
    },
    {
      question: 'Is Dozer Finance secure and audited?',
      answer:
        "Yes. Dozer's smart contracts undergo external audits, and the platform leverages Hathor's security via Bitcoin merged mining. Users always retain full custody of their tokens.",
    },
  ]

  // State initialization with proper typing
  const [mounted, setMounted] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'home' | 'ecosystem' | 'trading' | 'blueprints' | null>('home')
  const [totalDonations, setTotalDonations] = useState<number>(60000)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [priceChangeTimeLeft, setPriceChangeTimeLeft] = useState<PriceChangeTimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isPresaleModalOpen, setIsPresaleModalOpen] = useState<boolean>(false)

  // Only run client-side code after the component is mounted
  useEffect(() => {
    setMounted(true)

    // Next price change date - April 10, 2025
    const nextPriceChangeDate = new Date('2025-04-10T23:59:59')

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const priceChangeDifference = nextPriceChangeDate.getTime() - now

      if (priceChangeDifference > 0) {
        setPriceChangeTimeLeft({
          days: Math.floor(priceChangeDifference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((priceChangeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((priceChangeDifference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((priceChangeDifference % (1000 * 60)) / 1000),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    // Fetch donation data
    async function fetchDonationData() {
      try {
        // Don't set loading to true to avoid "Loading..." text
        const response = await fetch(
          'explorer-service/node_api/token?id=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'
        )
        const data = await response.json()
        if (data.success) {
          setTotalDonations(Math.floor(data.total / 100))
        }
      } catch (error) {
        console.error('Error fetching donation data:', error)
      }
    }

    fetchDonationData()

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Constants
  const maxSupply = 100000
  const tokensRemaining = maxSupply - totalDonations
  const progress = Math.min(Math.max((totalDonations / maxSupply) * 100, 0), 100)

  const priceChangeTimeUnits = [
    { label: 'DAYS', value: priceChangeTimeLeft.days },
    { label: 'HOURS', value: priceChangeTimeLeft.hours },
    { label: 'MINUTES', value: priceChangeTimeLeft.minutes },
    { label: 'SECONDS', value: priceChangeTimeLeft.seconds },
  ]

  // Return null during SSR or before hydration to prevent mismatches
  if (!mounted) {
    return null
  }

  // Update the StyledDialogButton component with proper typing
  const StyledDialogButton: React.FC<StyledDialogButtonProps> = ({ children, href }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <Link.External
        href={href}
        className="relative w-full px-6 py-3 text-base font-medium text-left text-yellow-400 transition-all duration-200 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl cursor-pointer select-none border border-yellow-500/30 hover:border-yellow-500/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
        <motion.div
          className="absolute top-0 right-0 flex items-center justify-center h-full pr-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRightIcon className="w-4 h-4 text-yellow-500" />
        </motion.div>
      </Link.External>
    )
  }

  return (
    <div className="relative min-h-screen text-white bg-black">
      {/* Space background with animations */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.97),rgba(0,0,0,0.95)),url('/background.jpg')] bg-cover overflow-hidden">
        <ShootingStars className="w-full h-full" />
        <Meteors number={10} className="!absolute" />
      </div>

      {/* Main layout container */}
      <div className="relative z-10 flex flex-col mx-auto max-w-7xl">
        {/* Title section - Updated styling */}
        <div className="p-6 md:p-8 border-b border-yellow-500/30">
          <Typography
            variant="h1"
            weight={800}
            className="text-4xl md:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 mb-2"
          >
            THE FUTURE OF DEFI IS HERE
          </Typography>
          <Typography
            variant="h3"
            weight={700}
            className="text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-amber-400 animate-pulse"
          >
            FINAL PHASE - ENDS MAY 5, 2025
          </Typography>
        </div>

        {/* Main content area with adjusted column ratios */}
        <div className="flex flex-col lg:flex-row">
          {/* Mobile-first: Presale info appears first on mobile with enhanced styling */}
          <div className="w-full px-4 py-6 lg:hidden">
            <div className="transform hover:scale-102 transition-transform duration-300">
              <PresaleSidebar
                totalDonations={totalDonations}
                maxSupply={maxSupply}
                progress={progress}
                priceChangeTimeUnits={priceChangeTimeUnits}
                onBuyClick={() => setIsPresaleModalOpen(true)}
              />
            </div>
          </div>

          {/* Left column - Tab content (reduced to 3/5 width) */}
          <div className="w-full p-4 lg:w-[60%] md:p-6">
            {/* Tab navigation */}
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Tab content */}
            <div className="mb-8">
              <TabContentWithAssets activeTab={activeTab} />
            </div>
          </div>

          {/* Right column - Presale info (increased to 2/5 width) - Enhanced for desktop */}
          <div className="hidden lg:block lg:w-[40%] lg:sticky lg:top-6 py-6 pr-6 mt-24">
            <div className="transform hover:scale-[1.01] transition-all duration-300 bg-black/10 backdrop-blur-md rounded-xl border border-yellow-500/30 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <PresaleSidebar
                totalDonations={totalDonations}
                maxSupply={maxSupply}
                progress={progress}
                priceChangeTimeUnits={priceChangeTimeUnits}
                onBuyClick={() => setIsPresaleModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* FAQ section - Updated styling */}
        <div className="px-6 py-8 md:px-8 bg-gradient-to-b from-transparent via-yellow-900/5 to-yellow-900/10">
          <FAQSection faqItems={faqItems} onViewMoreClick={() => setIsDialogOpen(true)} />
        </div>

        {/* Custom Dialog - Enhanced styling */}
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <Dialog.Content className="w-screen max-w-xl !pb-4 bg-stone-950 border border-yellow-500/30">
            <Dialog.Header
              title={
                <Typography
                  variant="h2"
                  className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600"
                >
                  Join the Dozer Presale! 🚀
                </Typography>
              }
              onClose={() => setIsDialogOpen(false)}
            />
            <div className="flex flex-col p-8">
              <Typography variant="xl" weight={600} className="mb-3 text-left text-yellow-400">
                Summary
              </Typography>
              <Typography variant="base" className="mb-6 text-left text-neutral-200">
                Dozer Donor Token (DZD) is a unique solution designed for the Dozer project's prelaunch phase. They
                serve as an innovative alternative to traditional SAFE documents, enabling a community-driven
                fundraising approach while maintaining contributor anonymity.
              </Typography>

              <Typography variant="xl" weight={600} className="mb-3 text-left text-yellow-400">
                Token Overview
              </Typography>
              <Typography variant="base" className="mb-6 text-left text-neutral-200">
                <b>Name</b>: Dozer Donor Tokens (DZD)
                <br />
                <b>Representation</b>: 1 DZD represents 1 USD worth of DZR at our token generation event
                <br />
                <b>Maximum Supply</b>: 100,000 DZD
                <br />
                <b>Holder Cap</b>: Maximum 10,000 DZD per backer
              </Typography>

              <Typography variant="xl" weight={600} className="mb-3 text-left text-yellow-400">
                Benefits
              </Typography>
              <Typography variant="base" className="text-left text-neutral-200">
                Donors holding more than 100 DZD gain exclusive privileges:
                <br />• Membership in our DAO and Private Discord Channel
                <br />• Real-time updates on development progress
                <br />• Access to nano contracts releases
                <br />• Participation in Protocol beta testing
                <br />• Voting rights on the future of the protocol
              </Typography>
            </div>
            <div className="flex flex-col gap-3 p-6 pt-4 border-t lg:flex-row border-stone-700 bg-stone-900/50">
              <StyledDialogButton href="https://explorer.hathor.network/token_balances?sortBy=total&order=desc&token=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d">
                Token Holders
              </StyledDialogButton>
              <StyledDialogButton href="https://explorer.hathor.network/token_detail/0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d">
                Token Info
              </StyledDialogButton>
              <StyledDialogButton href="https://supabase.dozer.finance/storage/v1/object/public/PDF/DZD%20Tokenomics.pdf">
                Tokenomics
              </StyledDialogButton>
            </div>
          </Dialog.Content>
        </Dialog>

        {/* Presale Modal - Make it larger */}
        <PresaleModal
          isOpen={isPresaleModalOpen}
          onClose={() => setIsPresaleModalOpen(false)}
          className="max-w-2xl" // Increased size
        />
      </div>
    </div>
  )
}

export default Home
