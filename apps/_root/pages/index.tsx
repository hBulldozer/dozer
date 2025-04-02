'use client'

import React, { useState, useEffect } from 'react'
import { Button, Link, Typography, Dialog } from '@dozer/ui'
import { ArrowRightIcon, ClipboardDocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { motion, Variants } from 'framer-motion'
import { AuroraBackground } from '@dozer/ui/aceternity/aurora-background'
import PresaleModal from '../components/PresaleModal/PresaleModal'

const Home = () => {
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

  // Only run client-side code after the component is mounted
  useEffect(() => {
    setMounted(true)

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

    return () => clearInterval(timer)
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

  const priceStages = [
    { date: 'Apr 1-10', price: '$1.00', active: true },
    { date: 'Apr 11-20', price: '$1.10', active: false },
    { date: 'Apr 21-30', price: '$1.25', active: false },
  ]

  // No longer needed since we replaced the payment section

  // Return null during SSR or before hydration to prevent mismatches
  if (!mounted) {
    return null
  }

  // Styled Button Component for Dialog
  const StyledDialogButton = ({ children, href }: { children: React.ReactNode; href: string }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <Link.External
        href={href}
        className="relative w-full px-4 py-2 text-sm font-medium text-left text-neutral-300 hover:text-white bg-stone-800 hover:bg-white hover:bg-opacity-[0.06] rounded-xl cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
        <motion.div
          className="absolute top-0 right-0 flex items-center justify-center h-full pr-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRightIcon className="w-3 h-3 text-yellow-500" />
        </motion.div>
      </Link.External>
    )
  }

  return (
    <div className="relative text-white bg-black">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.97),rgba(0,0,0,0.97)),linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:44px_44px]" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {mounted &&
            Array(20)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  initial={{ x: `${Math.random() * 100}%`, y: -10, opacity: 0 }}
                  animate={{
                    y: `${100 + Math.random() * 20}vh`,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 8 + Math.random() * 10,
                    delay: Math.random() * 5,
                  }}
                />
              ))}
        </div>
      </div>

      {/* Content - main container */}
      <div className="relative z-10 flex flex-col px-4 py-2 mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center mt-10 mb-12 text-center md:mt-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8"
          >
            <Typography
              variant="h1"
              weight={900}
              className="relative text-5xl text-transparent md:text-7xl bg-clip-text bg-gradient-to-br from-yellow-500 to-amber-700"
            >
              FINAL PRESALE PHASE
            </Typography>
          </motion.div>

          {/* Large Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-3xl mx-auto mb-4"
          >
            <Typography
              variant="h2"
              weight={700}
              className="mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
            >
              NEXT PRICE INCREASE IN
            </Typography>
            <div className="flex items-center justify-center gap-4 md:gap-8">
              {priceChangeTimeUnits.map((unit, index) => (
                <motion.div
                  key={unit.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(234, 179, 8, 0.3)',
                        '0 0 20px rgba(234, 179, 8, 0.6)',
                        '0 0 10px rgba(234, 179, 8, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center w-16 h-16 bg-black border rounded-lg shadow-xl md:w-24 md:h-24 bg-opacity-80 border-yellow-500/30 shadow-yellow-500/20"
                  >
                    <Typography variant="h1" weight={700} className="text-yellow-500 text-3xl md:text-4xl">
                      {String(unit.value).padStart(2, '0')}
                    </Typography>
                  </motion.div>
                  <Typography variant="sm" className="mt-2 text-neutral-400">
                    {unit.label}
                  </Typography>
                </motion.div>
              ))}
            </div>
            <Typography variant="base" className="mt-4 text-center text-neutral-300">
              Entire presale ends April 30, 2025 - Act now for the best price!
            </Typography>
          </motion.div>

          {/* Large Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-3xl mx-auto mb-10"
          >
            <Typography
              variant="h2"
              weight={700}
              className="mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
            >
              USDT RAISED
            </Typography>
            <Typography variant="lg" className="mb-4 text-center text-neutral-300">
              {`${tokensRemaining.toLocaleString()} of ${maxSupply.toLocaleString()} USDT target remaining`}
            </Typography>

            <div className="relative w-full h-8 overflow-hidden border rounded-lg md:h-10 bg-stone-950 border-yellow-500/40">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              ></motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Typography variant="lg" weight={700} className="text-white drop-shadow-md">
                  {`${progress.toFixed(1)}% raised`}
                </Typography>
              </div>
            </div>

            <div className="flex justify-between mt-2 text-sm text-neutral-400">
              <span>0 USDT</span>
              <span>{maxSupply.toLocaleString()} USDT</span>
            </div>
          </motion.div>

          {/* Join Presale Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="w-full max-w-md mx-auto mb-12"
          >
            <Button
              size="lg"
              onClick={() => setIsPresaleModalOpen(true)}
              className="w-full py-6 text-xl font-bold text-black bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-300"
            >
              JOIN THE PRE-SALE
            </Button>
          </motion.div>
        </div>

        {/* Price Stages */}
        <div className="w-full max-w-3xl mx-auto my-8">
          <Typography
            variant="h3"
            weight={600}
            className="mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
          >
            PRICE SCHEDULE
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priceStages.map((stage, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className={`p-4 rounded-lg border ${
                  stage.active
                    ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-yellow-500/50'
                    : 'bg-black/60 border-gray-700/30'
                } shadow-md`}
              >
                <Typography variant="base" weight={600} className="text-white text-center">
                  {stage.date}
                </Typography>
                <Typography
                  variant="h3"
                  weight={700}
                  className={`text-center ${stage.active ? 'text-yellow-400' : 'text-gray-400'}`}
                >
                  {stage.price}
                </Typography>
                {stage.active && (
                  <Typography variant="xs" className="text-green-400 mt-1 text-center">
                    Current Phase
                  </Typography>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full pt-8 mt-16 border-t border-yellow-500/20">
          <Typography
            variant="h3"
            weight={600}
            className="mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
          >
            FREQUENTLY ASKED QUESTIONS
          </Typography>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2"
          >
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 10px 25px -5px rgba(234, 179, 8, 0.15)',
                  borderColor: 'rgba(234, 179, 8, 0.4)',
                }}
                className="p-4 border rounded-lg bg-black/30 border-yellow-500/20"
              >
                <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
                  {item.question}
                </Typography>
                <Typography variant="sm" className="text-neutral-300">
                  {item.answer}
                </Typography>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Custom Dialog */}
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <Dialog.Content className="w-screen max-w-md !pb-4 bg-stone-950">
            <Dialog.Header title="Become a Dozer Backer!  🚀" onClose={() => setIsDialogOpen(false)} />
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
      </div>

      {/* Presale Modal */}
      <PresaleModal isOpen={isPresaleModalOpen} onClose={() => setIsPresaleModalOpen(false)} />
    </div>
  )
}

export default Home
