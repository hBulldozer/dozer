'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Dialog, Typography, Button } from '@dozer/ui'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Link } from '@dozer/ui'
import PresaleModal from '../components/PresaleModal/PresaleModal'
import { PresaleSidebar, TabContentWithAssets, TabNavigation, Footer, FAQSection } from '../components/LandingPage'
import { Meteors, ShootingStars } from '@dozer/ui/aceternity'

// Check if we're in production to provide a simpler version in production
const isProduction = process.env.NODE_ENV === 'production'

// Simple fallback component for production to prevent recursion
const ProductionHome = () => {
  const [isPresaleModalOpen, setIsPresaleModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">DOZER CRYPTO PRESALE</h1>
          <p className="text-xl text-yellow-200">FINAL PHASE - ENDS APRIL 30, 2025</p>
        </div>

        <div className="max-w-md mx-auto bg-black/40 border border-yellow-500/30 rounded-lg p-6 mb-10">
          <h2 className="text-2xl font-bold text-center text-yellow-400 mb-4">BUY $DZR PRESALE NOW!</h2>
          <div className="mb-6">
            <p className="text-sm text-center text-neutral-400 mb-2">TOKENS REMAINING</p>
            <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-yellow-500/30">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 w-[57%]"></div>
            </div>
            <div className="flex justify-between mt-1 text-sm text-neutral-400">
              <span>USDT RAISED: $57,294</span>
              <span>/100,000</span>
            </div>
          </div>

          <Button
            onClick={() => setIsPresaleModalOpen(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold hover:from-yellow-400 hover:to-amber-500"
          >
            BUY WITH CRYPTO
          </Button>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">ABOUT DOZER</h2>
          <p className="mb-4 text-neutral-300">
            Dozer Finance is bringing innovation to DeFi with lightning-fast transactions and minimal fees. Our platform
            eliminates transaction fees while providing instant settlement, creating a more accessible trading
            environment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 border rounded-lg border-yellow-500/30 bg-black/50 text-center">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Zero-Fee Transactions</h3>
              <p className="text-sm text-neutral-300">Trade and transact without any gas fees</p>
            </div>
            <div className="p-4 border rounded-lg border-yellow-500/30 bg-black/50 text-center">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Instant Finality</h3>
              <p className="text-sm text-neutral-300">Real-time settlement without waiting for confirmations</p>
            </div>
            <div className="p-4 border rounded-lg border-yellow-500/30 bg-black/50 text-center">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">MEV Protection</h3>
              <p className="text-sm text-neutral-300">Trade securely without value extraction</p>
            </div>
          </div>
        </div>

        <div className="border-t border-yellow-500/30 pt-4 text-center">
          <p className="text-sm text-neutral-400">© 2025 Dozer Finance. All rights reserved.</p>
        </div>
      </div>

      {isPresaleModalOpen && <PresaleModal isOpen={isPresaleModalOpen} onClose={() => setIsPresaleModalOpen(false)} />}
    </div>
  )
}

const Home = () => {
  // Use simplified version in production
  if (isProduction) {
    return <ProductionHome />
  }

  // FAQ items based on the tokenomics document
  const faqItems = [
    {
      question: 'What are Dozer Donor Tokens (DZD)?',
      answer:
        "DZD are unique tokens designed for Dozer's prelaunch phase. They serve as an innovative alternative to traditional SAFE documents, enabling community-driven fundraising while maintaining contributor anonymity.",
    },
    {
      question: 'What is the value of 1 DZD?',
      answer:
        '1 DZD represents 1 USD worth of DZR at our token generation event, with most-favored nation terms for Dozer valuation.',
    },
    {
      question: 'What happens to my DZD tokens after the presale?',
      answer:
        'At the DZR (main project token) generation event, DZD holders can exchange their tokens for DZR through a smart contract without vesting or lock-up periods, becoming the first DZR holders.',
    },
    {
      question: 'Is there a limit to how many DZD I can purchase?',
      answer: 'Yes, there is a maximum cap of 5,000 DZD per backer to ensure fair distribution.',
    },
    {
      question: 'What benefits do DZD holders receive?',
      answer:
        'Donors holding more than 100 DZD gain DAO membership, access to private Discord channels, real-time development updates, early access to nano contracts, beta testing participation, and voting rights on protocol decisions.',
    },
    {
      question: 'Which cryptocurrencies can I use to purchase DZD?',
      answer: 'We accept USDT and USDC on the Polygon Network, as well as HTR on the Hathor Network.',
    },
  ]

  // State initialization with proper SSR handling
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'ecosystem' | 'trading' | 'blueprints' | null>('home')

  // Token Counter Implementation
  const [totalDonations, setTotalDonations] = useState(57294) // Default fallback value
  const [isLoading, setIsLoading] = useState(false)

  // Price Change Countdown
  const [priceChangeTimeLeft, setPriceChangeTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPresaleModalOpen, setIsPresaleModalOpen] = useState(false)

  // Window width
  const [windowWidth, setWindowWidth] = useState(0)

  // Ensure all useCallback hooks are defined in the same place to maintain hook order
  // Memoize handler functions to prevent excessive renders
  const handleTabChange = useCallback((tab: 'home' | 'ecosystem' | 'trading' | 'blueprints'): void => {
    setActiveTab(tab)
  }, [])

  const handlePresaleClick = useCallback((): void => {
    setIsPresaleModalOpen(true)
  }, [])

  const handleFAQClick = useCallback((): void => {
    setIsDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback((): void => {
    setIsDialogOpen(false)
  }, [])

  const handlePresaleModalClose = useCallback((): void => {
    setIsPresaleModalOpen(false)
  }, [])

  // Generate meteor positions once when component mounts to avoid re-renders
  const meteorPositions = useMemo(() => {
    return Array(15) // Reduced from 25 to 15 to lower render complexity
      .fill(null)
      .map(() => ({
        size: Math.random() * 1 + 0.2, // Between 0.2 and 1.2
        trailLength: Math.floor(Math.random() * 150) + 80, // Between 80 and 230px
        topOffset: Math.random() * -100 - 50, // Start above the viewport
        leftOffset: Math.random(), // Store as 0-1 value to calculate with window width
        animDelay: Math.random() * 16,
        animDuration: Math.random() * 5 + 6,
        opacity: Math.random() * 0.8 + 0.2,
      }))
  }, [])

  // Constants calculated from state - memoize to prevent recalculation
  const priceChangeTimeUnits = useMemo(
    () => [
      { label: 'DAYS', value: priceChangeTimeLeft.days },
      { label: 'HOURS', value: priceChangeTimeLeft.hours },
      { label: 'MINUTES', value: priceChangeTimeLeft.minutes },
      { label: 'SECONDS', value: priceChangeTimeLeft.seconds },
    ],
    [priceChangeTimeLeft]
  )

  // Only run client-side code after the component is mounted
  useEffect(() => {
    setMounted(true)
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    // Next price change date
    const nextPriceChangeDate = new Date()
    nextPriceChangeDate.setDate(nextPriceChangeDate.getDate() + 7) // 7 days from now

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
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Constants
  const maxSupply = 100000
  const tokensRemaining = maxSupply - totalDonations
  const progress = Math.min(Math.max((totalDonations / maxSupply) * 100, 0), 100)

  // Return null during SSR or before hydration to prevent mismatches
  if (!mounted) {
    return null
  }

  // Styled Button Component for Dialog - Simplified to avoid motion animations
  const StyledDialogButton = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <Link.External
      href={href}
      className="relative w-full px-4 py-2 text-sm font-medium text-left text-neutral-300 hover:text-white bg-stone-800 hover:bg-white hover:bg-opacity-[0.06] rounded-xl cursor-pointer select-none group"
    >
      {children}
      <div className="absolute top-0 right-0 flex items-center justify-center h-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRightIcon className="w-3 h-3 text-yellow-500" />
      </div>
    </Link.External>
  )

  return (
    <div className="relative min-h-screen text-white bg-black">
      {/* Space background with subtle stars */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.97),rgba(0,0,0,0.95)),url('/background.jpg')] bg-cover" />

      {/* Animated background effects - simplified */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Meteors effect */}
        <div className="relative w-full h-full">
          {mounted &&
            meteorPositions.map((meteor, idx) => (
              <span
                key={`meteor-${idx}`}
                className="animate-meteor-effect absolute rounded-[9999px] bg-yellow-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]"
                style={{
                  height: `${meteor.size}px`,
                  width: `${meteor.size}px`,
                  top: `${meteor.topOffset}px`,
                  left: `${Math.floor(meteor.leftOffset * (windowWidth + 800) - 100)}px`,
                  animationDelay: `${meteor.animDelay}s`,
                  animationDuration: `${meteor.animDuration}s`,
                  opacity: meteor.opacity,
                  ...({ '--trail-length': `${meteor.trailLength}px` } as React.CSSProperties),
                  ...({ '--trail-height': `${Math.max(meteor.size * 0.8, 1)}px` } as React.CSSProperties),
                }}
              >
                <div className="absolute top-1/2 transform -translate-y-1/2 w-[var(--trail-length)] h-[var(--trail-height)] bg-gradient-to-r from-yellow-400 to-transparent" />
              </span>
            ))}
        </div>

        {/* Shooting stars effect */}
        {mounted && (
          <ShootingStars
            starColor="#FFB700"
            trailColor="#FFDA80"
            minSpeed={15}
            maxSpeed={30}
            minDelay={800}
            maxDelay={2500}
          />
        )}
      </div>

      {/* Main layout container */}
      <div className="relative z-10 flex flex-col mx-auto max-w-7xl">
        {/* Title section */}
        <div className="p-4 border-b md:p-6 border-yellow-500/30">
          <Typography
            variant="h1"
            weight={800}
            className="text-3xl text-transparent md:text-5xl bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
          >
            DOZER CRYPTO PRESALE
          </Typography>
          <Typography
            variant="h3"
            weight={700}
            className="text-lg text-transparent md:text-2xl bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400"
          >
            FINAL PHASE - ENDS APRIL 30, 2025
          </Typography>
        </div>

        {/* Main content area with two columns */}
        <div className="flex flex-col lg:flex-row">
          {/* Mobile-first: Presale info appears first on mobile */}
          <div className="w-full px-4 py-6 lg:hidden">
            <PresaleSidebar
              totalDonations={totalDonations}
              maxSupply={maxSupply}
              progress={progress}
              priceChangeTimeUnits={priceChangeTimeUnits}
              onBuyClick={handlePresaleClick}
            />
          </div>

          {/* Left column - Tab content (2/3 width) */}
          <div className="w-full p-4 lg:w-2/3 md:p-6">
            {/* Tab navigation */}
            <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />

            {/* Tab content */}
            <div className="min-h-[600px]">
              <TabContentWithAssets activeTab={activeTab} />
            </div>
          </div>

          {/* Right column - Presale info (1/3 width) - hidden on mobile */}
          <div className="hidden p-4 lg:block lg:w-1/3 md:p-6 lg:self-start lg:sticky lg:top-6">
            <PresaleSidebar
              totalDonations={totalDonations}
              maxSupply={maxSupply}
              progress={progress}
              priceChangeTimeUnits={priceChangeTimeUnits}
              onBuyClick={handlePresaleClick}
            />
          </div>
        </div>

        {/* FAQ section */}
        <FAQSection faqItems={faqItems} onViewMoreClick={handleFAQClick} />

        {/* Footer */}
        <Footer />

        {/* Custom Dialog */}
        <Dialog open={isDialogOpen} onClose={handleDialogClose}>
          <Dialog.Content className="w-screen max-w-md !pb-4 bg-stone-950">
            <Dialog.Header title="Become a Dozer Backer!  🚀" onClose={handleDialogClose} />
            <div className="flex flex-col p-6">
              <Typography variant="lg" className="mb-2 text-left text-neutral-300">
                Summary
              </Typography>
              <Typography variant="sm" className="mb-6 text-left text-neutral-300">
                Dozer Donor Token (DZD) is a unique solution designed for the Dozer project's prelaunch phase. They
                serve as an innovative alternative to traditional SAFE documents, enabling a community-driven
                fundraising approach while maintaining contributor anonymity.
              </Typography>

              <Typography variant="lg" className="mb-2 text-left text-neutral-300">
                Token Overview
              </Typography>
              <Typography variant="sm" className="mb-4 text-left text-neutral-300">
                <b>Name</b>: Dozer Donor Tokens (DZD)
                <br />
                <b>Representation</b>: 1 DZD represents 1 USD worth of DZR at our token generation event
                <br />
                <b>Maximum Supply</b>: 100,000 DZD
                <br />
                <b>Holder Cap</b>: Maximum 5,000 DZD per backer
              </Typography>

              <Typography variant="lg" className="mb-2 text-left text-neutral-300">
                Benefits
              </Typography>
              <Typography variant="sm" className="text-left text-neutral-300">
                Donors holding more than 100 DZD gain exclusive privileges:
                <br />• Membership in our DAO and Private Discord Channel
                <br />• Real-time updates on development progress
                <br />• Access to nano contracts releases
                <br />• Participation in Protocol beta testing
                <br />• Voting rights on the future of the protocol
              </Typography>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t lg:flex-row border-stone-700">
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

        {/* Presale Modal */}
        <PresaleModal isOpen={isPresaleModalOpen} onClose={handlePresaleModalClose} />
      </div>
    </div>
  )
}

export default React.memo(Home)
