'use client'

import React, { useState, useEffect } from 'react'
import { Button, Link, Typography, Dialog } from '@dozer/ui'
import { ArrowRightIcon, ClipboardDocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

const Home = () => {
  // FAQ items based on the tokenomics document
  const faqItems = [
    {
      question: "What are Dozer Donor Tokens (DZD)?",
      answer: "DZD are unique tokens designed for Dozer's prelaunch phase. They serve as an innovative alternative to traditional SAFE documents, enabling community-driven fundraising while maintaining contributor anonymity."
    },
    {
      question: "What is the value of 1 DZD?",
      answer: "1 DZD represents 1 USD worth of DZR at our token generation event, with most-favored nation terms for Dozer valuation."
    },
    {
      question: "What happens to my DZD tokens after the presale?",
      answer: "At the DZR (main project token) generation event, DZD holders can exchange their tokens for DZR through a smart contract without vesting or lock-up periods, becoming the first DZR holders."
    },
    {
      question: "Is there a limit to how many DZD I can purchase?",
      answer: "Yes, there is a maximum cap of 5,000 DZD per backer to ensure fair distribution."
    },
    {
      question: "What benefits do DZD holders receive?",
      answer: "Donors holding more than 100 DZD gain DAO membership, access to private Discord channels, real-time development updates, early access to nano contracts, beta testing participation, and voting rights on protocol decisions."
    },
    {
      question: "Which cryptocurrencies can I use to purchase DZD?",
      answer: "We accept USDT and USDC on the Polygon Network, as well as HTR on the Hathor Network."
    }
  ];

  // State initialization with proper SSR handling
  const [mounted, setMounted] = useState(false)
  
  // Countdown Timer Implementation
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Token Counter Implementation
  const [totalDonations, setTotalDonations] = useState(57294) // Default fallback value
  const [isLoading, setIsLoading] = useState(false)
  
  // Payment Section Implementation
  const [selectedNetwork, setSelectedNetwork] = useState('solana')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Only run client-side code after the component is mounted
  useEffect(() => {
    setMounted(true)
    
    // Countdown Timer
    const endDate = new Date('April 30, 2025 23:59:59').getTime()

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = endDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
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

  const addresses = {
    solana: 'BK6Yh1aQnX3fPNTbXmzvAFB12fwGYkEqLXq4JYbNrRjG',
    evm: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  }

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ]

  const priceStages = [
    { date: 'Apr 1-10', price: '$1.00', active: true },
    { date: 'Apr 11-20', price: '$1.10', active: false },
    { date: 'Apr 21-30', price: '$1.25', active: false },
  ]

  // Handle clipboard copy function
  const handleCopyAddress = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(addresses[selectedNetwork])
        .then(() => {
          console.log('Address copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy address: ', err);
        });
    }
  };

  // Return null during SSR or before hydration to prevent mismatches
  if (!mounted) {
    return null;
  }
  
  // Styled Button Component for Dialog
  const StyledDialogButton = ({ children, href }: { children: React.ReactNode; href: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    
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
    );
  };

  return (
    <div className="relative bg-black text-white">
      {/* Subtle grid background with floating particles */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.97),rgba(0,0,0,0.97)),linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:44px_44px]" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {mounted && Array(20).fill(0).map((_, i) => (
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
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      </div>

      {/* Content - main container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-2 flex flex-col">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8 mt-10 md:mt-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Typography
              variant="h1"
              weight={900}
              className="relative text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 to-amber-700"
            >
              FINAL PRESALE PHASE
            </Typography>
          </motion.div>

          <Typography variant="base" className="max-w-xl text-neutral-300 mb-3 mt-1">
            Join the revolution in DeFi. Don't miss your chance to be part of Dozer's journey from the beginning.
          </Typography>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link.Internal href="/product" passHref>
              <Button
                as="a"
                size="md"
                variant="outlined"
                className="whitespace-nowrap border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
              >
                Learn About Dozer
              </Button>
            </Link.Internal>
            <Link.External href="https://forms.gle/8cEKvsaNrTP4c8Ef6" passHref>
              <Button
                as="a"
                size="md"
                className="whitespace-nowrap bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                endIcon={<ArrowRightIcon width={16} height={16} />}
              >
                Buy DZD Tokens
              </Button>
            </Link.External>
          </div>
        </div>

        {/* Main content grid - 3 columns on desktop, 1 column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Countdown & Token Counter */}
          <motion.div
            whileHover={{ 
              y: -5, 
              boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.2)",
              borderColor: "rgba(234, 179, 8, 0.5)" 
            }}
            className="flex flex-col bg-black/30 p-4 rounded-xl border border-yellow-500/20 shadow-lg justify-between"
          >
            {/* Countdown Section */}
            <div>
              <Typography
                variant="h5"
                weight={600}
                className="mb-3 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
              >
                FINAL PHASE ENDS IN
              </Typography>
              <div className="flex items-center justify-center gap-4">
                {timeUnits.map((unit, index) => (
                  <div key={unit.label} className="flex flex-col items-center">
                    <motion.div
                      animate={{ boxShadow: ['0 0 10px rgba(234, 179, 8, 0.3)', '0 0 20px rgba(234, 179, 8, 0.6)', '0 0 10px rgba(234, 179, 8, 0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-black bg-opacity-80 rounded-lg border border-yellow-500/30 shadow-xl shadow-yellow-500/20"
                    >
                      <Typography variant="h2" weight={700} className="text-yellow-500">
                        {String(unit.value).padStart(2, '0')}
                      </Typography>
                    </motion.div>
                    <Typography variant="xs" className="mt-1 text-neutral-400">
                      {unit.label}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Counter Section */}
            <div>
              <Typography variant="h5" weight={600} className="mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                DZD TOKEN SALE
              </Typography>
              <Typography variant="base" className="mb-1 text-center text-neutral-300">
                {`${tokensRemaining.toLocaleString()} DZD tokens remaining`}
              </Typography>
              <Typography variant="sm" className="text-center text-neutral-400 mb-3">
                Price: 1 DZD = 1 USDT
              </Typography>

              <div className="relative h-5 w-full overflow-hidden rounded-md bg-stone-950 border border-yellow-500/40">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Typography variant="sm" weight={600} className="text-white">
                    {`${progress.toFixed(1)}% sold`}
                  </Typography>
                </div>
              </div>

              <div className="flex justify-between text-sm text-neutral-400 mt-1">
                <span>0 DZD</span>
                <span>{maxSupply.toLocaleString()} DZD</span>
              </div>
            </div>
          </motion.div>

          {/* Middle Column - Price Increase */}
          <motion.div
            whileHover={{ 
              y: -5, 
              boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.2)",
              borderColor: "rgba(234, 179, 8, 0.5)" 
            }}
            className="bg-black/30 p-4 rounded-xl border border-yellow-500/20 shadow-lg flex flex-col"
          >
            <Typography
              variant="h5"
              weight={600}
              className="mb-3 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
            >
              PRICE INCREASE SCHEDULE
            </Typography>
            <Typography variant="sm" className="mb-4 text-center text-neutral-300">
              DZD token price increases as the presale progresses
            </Typography>

            <div className="space-y-3 flex-grow mt-1">
              {priceStages.map((stage, index) => (
                <div 
                  key={index} 
                  className={`px-3 py-2 rounded-lg ${
                    stage.active 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/50' 
                      : 'bg-black/60 border border-stone-700/50'
                  } flex justify-between items-center`}
                >
                  <Typography variant="sm" weight={500} className="text-white">
                    {stage.date}
                  </Typography>
                  <div className="flex items-center">
                    <Typography variant="md" weight={700} className={stage.active ? 'text-yellow-400' : 'text-gray-400'}>
                      {stage.price}
                    </Typography>
                    {stage.active && (
                      <Typography variant="xs" className="text-green-400 ml-2 px-2 py-0.5 bg-green-900/30 rounded">
                        Active
                      </Typography>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-2 flex items-center justify-between">
              <Typography variant="xs" className="text-neutral-300 whitespace-nowrap">
                Early buyers get the best price!
              </Typography>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="empty"
                size="sm"
                className="text-yellow-500 hover:text-yellow-400"
                endIcon={<ChevronRightIcon width={16} height={16} />}
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Payment Section */}
          <motion.div
            whileHover={{ 
              y: -5, 
              boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.2)",
              borderColor: "rgba(234, 179, 8, 0.5)" 
            }}
            className="bg-black/30 p-4 rounded-xl border border-yellow-500/20 shadow-lg flex flex-col"
          >
            <Typography variant="h5" weight={600} className="mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
              PAYMENT DETAILS
            </Typography>
            <Typography variant="sm" className="mb-4 text-center text-neutral-300">
              Send USDT to receive your DZD tokens
            </Typography>

            <div className="flex flex-col space-y-4 flex-grow">
              <div className="flex justify-center gap-4 mb-1">
                <Button 
                  size="sm"
                  variant={selectedNetwork === 'solana' ? 'filled' : 'outlined'}
                  onClick={() => setSelectedNetwork('solana')}
                  className={selectedNetwork === 'solana' ? 'bg-yellow-500 text-black' : 'border-yellow-500/50 text-yellow-500'}
                >
                  Solana
                </Button>
                <Button 
                  size="sm"
                  variant={selectedNetwork === 'evm' ? 'filled' : 'outlined'}
                  onClick={() => setSelectedNetwork('evm')}
                  className={selectedNetwork === 'evm' ? 'bg-yellow-500 text-black' : 'border-yellow-500/50 text-yellow-500'}
                >
                  EVM (ETH, BSC, etc.)
                </Button>
              </div>

              <div className="mt-1">
                <Typography variant="sm" className="mb-2 text-neutral-300">
                  Send USDT to this address:
                </Typography>
                
                <div className="flex items-center p-2 bg-stone-900 rounded-lg overflow-hidden border border-stone-700/50">
                  <Typography variant="xs" className="flex-1 font-mono text-yellow-300 truncate">
                    {addresses[selectedNetwork]}
                  </Typography>
                  <button
                    type="button"
                    className="flex-shrink-0 ml-2 cursor-pointer bg-transparent border-0 p-0"
                    onClick={handleCopyAddress}
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 text-yellow-500 hover:text-yellow-400" />
                  </button>
                </div>
                
                <Typography variant="xs" className="text-red-400 mt-1">
                  Only send USDT on the {selectedNetwork === 'solana' ? 'Solana' : 'EVM'} network!
                </Typography>
              </div>

              <div className="flex flex-col mt-auto">
                <Typography variant="sm" weight={500} className="mb-2 text-neutral-300">
                  After sending payment:
                </Typography>
                <Button
                  href="https://forms.gle/8cEKvsaNrTP4c8Ef6"
                  target="_blank"
                  size="lg"
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                >
                  Fill Out Form
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="w-full mt-16 pt-8 border-t border-yellow-500/20">
          <Typography
            variant="h4"
            weight={600}
            className="mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
          >
            FREQUENTLY ASKED QUESTIONS
          </Typography>
          
          <motion.div
            variants={{
              container: {
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  show: { y: 0, opacity: 1 }
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.15)",
                  borderColor: "rgba(234, 179, 8, 0.4)" 
                }}
                className="bg-black/30 p-4 rounded-lg border border-yellow-500/20"
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
                Dozer Donor Token (DZD) is a unique solution designed for the Dozer project's prelaunch phase. They serve as an innovative alternative to traditional SAFE documents, enabling a community-driven fundraising approach while maintaining contributor anonymity.
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
    </div>
  )
}

export default Home