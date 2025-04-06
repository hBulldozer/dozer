'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Dialog } from '@dozer/ui/dialog'
import { Typography } from '@dozer/ui/typography'
import { Link } from '@dozer/ui/link'
import { Button } from '@dozer/ui/button'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import PresaleModal from '../components/PresaleModal/PresaleModal'
import { PresaleSidebar, TabContentWithAssets, TabNavigation, FaqChatAccordion } from '../components/LandingPage'
import { SpaceBackground, ShootingStars } from '../components/SpaceBackground'
import { Container } from '@dozer/ui/container'
import { DozerWithTextIcon, TwitterIcon, TelegramIcon, DiscordIcon, GithubIcon } from '@dozer/ui/icons'
import { calculatePresalePrice, TimeLeft, PRESALE_CONFIG, calculateNextPriceStep } from '../utils/presalePrice'
import { NewsletterForm } from '../components/NewsletterForm'

interface StyledDialogButtonProps {
  children: React.ReactNode
  href: string
}

interface PresaleModalProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  currentPrice: number
}

const Home: React.FC = () => {
  // FAQ items based on the tokenomics document
  const faqItems = [
    {
      id: 1,
      question: 'What is the DZR token?',
      answer:
        'DZR is the native token of the Dozer Finance protocol. It powers governance, liquidity incentives, and utility across the Dozer ecosystem. There are no VCs or corporate backers—only the community.',
    },
    {
      id: 2,
      question: 'How do I participate in the pre-sale?',
      answer:
        "To join the final pre-sale, send USDT or USDC on any EVM network, or use Solana. Follow the payment instructions provided on the website. After payment, you'll be prompted to enter your Hathor address to receive your allocation.",
    },
    {
      id: 3,
      question: 'Is there any vesting or lock-up on pre-sale DZR tokens?',
      answer:
        'No. All DZR tokens allocated during the pre-sale are fully unlocked at launch—no lock-ups, no vesting, no cliffs.',
    },
    {
      id: 4,
      question: 'Is there a maximum allocation per wallet?',
      answer:
        "Yes. There's a cap of $10,000 per backer to promote decentralization and fair community ownership. Our backers are not just investors—they are co-founders of the project.",
    },
    {
      id: 5,
      question: 'Are there gas fees on Dozer Finance?',
      answer:
        'No gas fees at the blockchain level. Dozer uses a zero-gas model powered by Hathor. The only fee is a minimal 0.3% LP trading fee—far lower than typical DEX platforms.',
    },
    {
      id: 6,
      question: 'Where can I get support or ask questions?',
      answer:
        'You can join our official Telegram group for help, updates, and direct communication with the core team and community.',
    },
    {
      id: 7,
      question: 'When is the DZR listing and TGE?',
      answer:
        'The token generation event (TGE) and exchange listings will be officially announced. Stay tuned on our Telegram and website for updates.',
    },
    {
      id: 8,
      question: 'What happens if Nano Contracts on Hathor are delayed?',
      answer:
        'Dozer Finance is tightly coupled to the Hathor Network, and the launch of our DEX depends on Nano Contracts going live on mainnet. If there are delays, we will continue to build and keep the community informed. Our focus remains on delivering a secure, no-gas DeFi platform with full transparency.',
    },
    {
      id: 9,
      question: 'When is Dozer Finance launching on mainnet?',
      answer:
        "Dozer DEX will be deployed on Hathor mainnet as soon as Nano Contracts (Hathor's smart contract infrastructure) are live on mainnet.",
    },
  ]

  // State initialization with proper typing
  const [mounted, setMounted] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'home' | 'ecosystem' | 'trading' | 'blueprints' | null>('home')
  const [totalDonations, setTotalDonations] = useState<number>(60000)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [priceChangeTimeLeft, setPriceChangeTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [currentPrice, setCurrentPrice] = useState<number>(1.0)
  const [nextPriceStep, setNextPriceStep] = useState<number | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isPresaleModalOpen, setIsPresaleModalOpen] = useState<boolean>(false)

  // Only run client-side code after the component is mounted
  useEffect(() => {
    setMounted(true)

    // Function to calculate and update price and countdown
    const updatePriceAndCountdown = () => {
      // Calculate current price and countdown in one function call
      const { currentPrice: newPrice, timeUntilNextStep } = calculatePresalePrice()

      // Update state
      setPriceChangeTimeLeft(timeUntilNextStep)
      setCurrentPrice(newPrice)

      // Calculate next price step only if price changed
      try {
        // Only calculate next price step when needed
        const nextPrice = calculateNextPriceStep(newPrice)
        setNextPriceStep(nextPrice)
      } catch (error) {
        console.error('Error calculating next price step:', error)
      }
    }

    // Initial calculation
    updatePriceAndCountdown()

    // Update once per second
    const timer = setInterval(updatePriceAndCountdown, 1000)

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
        className="relative w-full px-6 py-3 text-base font-medium text-left text-yellow-400 transition-all duration-200 border cursor-pointer select-none bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl border-yellow-500/30 hover:border-yellow-500/50"
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
      <div className="absolute inset-0 overflow-hidden">
        <SpaceBackground starCount={250} color="#FFFFFF" animate={true} />
        <ShootingStars count={30} color="#FFEB3B" frequency={500} className="z-0" />
        {/* Dark overlay to make space animation more subtle */}
        <div className="absolute inset-0 bg-black opacity-75 z-[1]"></div>
      </div>

      {/* Main layout container */}
      <div className="relative z-10 flex flex-col mx-auto max-w-7xl">
        {/* Title section - Updated styling */}
        <div className="p-6 border-b md:p-8 border-yellow-500/30">
          <Typography
            variant="h1"
            weight={800}
            className="mb-2 text-4xl text-transparent md:text-6xl lg:text-7xl bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600"
          >
            THE FUTURE OF DEFI IS HERE
          </Typography>
          <Typography
            variant="h3"
            weight={700}
            className="text-xl text-transparent md:text-3xl bg-clip-text bg-gradient-to-br from-red-500 to-amber-400 animate-pulse"
          >
            FINAL PHASE - ENDS MAY 5, 2025
          </Typography>
        </div>

        {/* Main content area with adjusted column ratios */}
        <div className="flex flex-col lg:flex-row">
          {/* Mobile-first: Presale info appears first on mobile with enhanced styling */}
          <div className="w-full px-4 py-6 lg:hidden">
            <PresaleSidebar
              totalDonations={totalDonations}
              maxSupply={maxSupply}
              progress={progress}
              priceChangeTimeUnits={priceChangeTimeUnits}
              onBuyClick={() => setIsPresaleModalOpen(true)}
              currentPrice={currentPrice}
              nextPriceStep={nextPriceStep}
            />
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
          <div className="hidden lg:block lg:w-[40%] pr-6 mt-[24px]">
            <div className=" bg-black/10 backdrop-blur-sm rounded-xl border border-yellow-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <div className="p-6 pb-[28px]">
                <PresaleSidebar
                  totalDonations={totalDonations}
                  maxSupply={maxSupply}
                  progress={progress}
                  priceChangeTimeUnits={priceChangeTimeUnits}
                  onBuyClick={() => setIsPresaleModalOpen(true)}
                  currentPrice={currentPrice}
                  nextPriceStep={nextPriceStep}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ section - Updated styling */}
        <div className="px-6 py-8 md:px-8 bg-gradient-to-b from-transparent via-yellow-900/5 to-yellow-900/10">
          <Typography
            variant="h3"
            weight={800}
            className="relative z-10 mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
          >
            FREQUENTLY ASKED QUESTIONS
          </Typography>

          <div className="max-w-5xl mx-auto">
            <FaqChatAccordion
              data={faqItems}
              className="p-4 border bg-black/20 backdrop-blur-sm rounded-xl border-yellow-500/30"
            />

            {/* {faqItems.length > 8 && (
              <div className="relative z-10 flex justify-center mt-8">
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="border-yellow-500/30 text-yellow-400 hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all duration-300 px-6 py-2 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                >
                  View More Information
                </Button>
              </div>
            )} */}
          </div>
        </div>

        {/* Custom Dialog - Enhanced styling */}
        {/* <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <Dialog.Content className="w-screen max-w-xl !pb-4 bg-stone-950/80 backdrop-blur-md border border-yellow-500/30">
            <Dialog.Header
              title={
                <Typography
                  variant="h2"
                  className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
                >
                  Frequently Asked Questions
                </Typography>
              }
              onClose={() => setIsDialogOpen(false)}
            />
            <div className="flex flex-col p-4 max-h-[70vh] overflow-y-auto">
              <FaqChatAccordion data={faqItems} className="mt-2 text-left" />
            </div>
            <div className="flex flex-col gap-3 p-6 pt-4 border-t lg:flex-row border-stone-700/50 bg-stone-900/30">
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
        </Dialog> */}

        {/* Presale Modal - Make it larger */}
        <PresaleModal
          isOpen={isPresaleModalOpen}
          onClose={() => setIsPresaleModalOpen(false)}
          className="max-w-2xl" // Increased size
          currentPrice={currentPrice}
        />
      </div>

      {/* Footer Section */}
      <footer className="relative z-10 mt-16 border-t border-yellow-500/30 bg-black/80 backdrop-blur-md">
        {/* Disclaimer Banner */}
        <div className="w-full py-2 bg-black/40 backdrop-blur-sm">
          <Typography variant="xs" className="text-center text-stone-400">
            ALWAYS DO YOUR OWN RESEARCH. NOTHING HERE IS FINANCIAL ADVICE.
          </Typography>
        </div>

        <Container maxWidth="5xl" className="grid grid-cols-1 md:grid-cols-[176px_auto] mx-auto px-4 gap-4 py-10">
          <div className="flex flex-col gap-3">
            <div className="items-center justify-start w-32">
              <DozerWithTextIcon />
            </div>
            <div className="text-sm sm:text-[0.8rem] leading-5 sm:leading-4 text-stone-300 pl-2">
              Easy, Fast and Safe.
            </div>
            <div className="flex items-center gap-4 pl-2">
              <a href="https://twitter.com/DozerProtocol" target="_blank" rel="noopener noreferrer">
                <TwitterIcon width={16} className="text-yellow-400 hover:text-yellow-300" />
              </a>
              <a href="https://t.me/DozerFinance" target="_blank" rel="noopener noreferrer">
                <TelegramIcon width={16} className="text-yellow-400 hover:text-yellow-300" />
              </a>
              <a href="https://forms.gle/8cEKvsaNrTP4c8Ef6" target="_blank" rel="noopener noreferrer">
                <DiscordIcon width={16} className="text-yellow-400 hover:text-yellow-300" />
              </a>
              <a href="https://github.com/Dozer-Protocol" target="_blank" rel="noopener noreferrer">
                <GithubIcon width={16} className="text-yellow-400 hover:text-yellow-300" />
              </a>
            </div>
            {/* Newsletter Section - Mobile */}
            <div className="mt-6 md:hidden">
              <NewsletterForm isMobile={true} />
            </div>
          </div>

          <div className="md:px-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-[40px] sm:mt-[10px]">
            {/* Features Column */}
            <div className="flex flex-col gap-[10px]">
              <Typography variant="xs" weight={500} className="text-sm text-yellow-400 sm:text-xs">
                Features
              </Typography>
              <a
                href="https://testnet.dozer.finance/swap"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:text-yellow-400 hover:underline"
              >
                Swap
              </a>
              <a
                href="https://testnet.dozer.finance/pool"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:text-yellow-400 hover:underline"
              >
                Earn
              </a>
              <a
                href="https://testnet.dozer.finance/pool/create_token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:text-yellow-400 hover:underline"
              >
                Launch
              </a>
            </div>

            {/* Help Column */}
            <div className="flex flex-col gap-[10px]">
              <Typography variant="xs" weight={500} className="text-sm text-yellow-400 sm:text-xs">
                Help
              </Typography>
              <a
                href="https://docs.dozer.finance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:text-yellow-400 hover:underline"
              >
                Docs
              </a>
              <a
                href="https://t.me/dozerfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:text-yellow-400 hover:underline"
              >
                Support
              </a>
            </div>

            {/* Partners Column */}
            <div className="flex flex-col gap-[10px]">
              <Typography variant="xs" weight={500} className="text-sm text-yellow-400 sm:text-xs">
                Partners
              </Typography>
              <a
                href="https://hathor.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:text-yellow-400 hover:underline"
              >
                Hathor Network
              </a>
            </div>

            {/* Newsletter - Desktop */}
            <div className="hidden md:flex flex-col gap-[10px]">
              <NewsletterForm />
            </div>
          </div>
        </Container>

        <Container maxWidth="5xl" className="mx-auto mb-2">
          <div className="flex flex-col items-center gap-2 py-4 mx-4 border-t md:flex-row md:justify-between border-yellow-500/20">
            <Typography variant="xs" className="text-stone-400">
              Copyright © {new Date().getFullYear()} Dozer. All rights reserved.
            </Typography>
            <div className="flex">
              <Link.Internal href="/terms" passHref={true}>
                <Typography as="a" variant="xs" weight={500} className="px-3 text-stone-300 hover:text-yellow-400">
                  Terms of Use
                </Typography>
              </Link.Internal>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}

export default Home
