'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Typography } from '@dozer/ui'
import {
  CubeTransparentIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  LightBulbIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import { motion, useAnimate, stagger } from 'framer-motion'

interface TabContentWithAssetsProps {
  activeTab: 'home' | 'ecosystem' | 'trading' | 'blueprints' | null
}

// Text generate effect component
const TextGenerateEffect = ({
  words,
  className = '',
  filter = true,
  duration = 0.5,
}: {
  words: string
  className?: string
  filter?: boolean
  duration?: number
}) => {
  const [scope, animate] = useAnimate()
  const wordsArray = words.split(' ')
  const wordsRef = useRef(words)

  // This effect handles animation initialization and reset when words change
  useEffect(() => {
    // Check if words have changed and reset animation
    if (wordsRef.current !== words) {
      wordsRef.current = words

      // Reset all spans to initial state first
      animate(
        'span',
        {
          opacity: 0,
          filter: filter ? 'blur(8px)' : 'none',
        },
        { duration: 0 } // Immediate reset
      )
    }

    // Start/restart the animation
    const animationControls = animate(
      'span',
      {
        opacity: 1,
        filter: filter ? 'blur(0px)' : 'none',
      },
      {
        duration: duration || 1,
        delay: stagger(0.2),
      }
    )

    return () => animationControls.stop()
  }, [words, animate, duration, filter])

  return (
    <div className={className}>
      <motion.div ref={scope} className="leading-relaxed tracking-wide text-neutral-200">
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={`${word}-${idx}`}
              className="opacity-0"
              style={{
                filter: filter ? 'blur(8px)' : 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontWeight: 600,
              }}
            >
              {word}{' '}
            </motion.span>
          )
        })}
      </motion.div>
    </div>
  )
}

// Animated text component with the new effect
const AnimatedText = ({ content }: { content: string }) => {
  // Adding a key based on content ensures component remounts
  // when content changes, forcing animation to reset
  return (
    <div style={{ fontSize: '1.125rem', lineHeight: '1.75' }} key={`text-animation-${content.substring(0, 20)}`}>
      <TextGenerateEffect words={content} filter={true} duration={0.3} />
    </div>
  )
}

const TabContentWithAssets: React.FC<TabContentWithAssetsProps> = ({ activeTab }) => {
  // Content for each tab
  const tabContent = {
    home: {
      title: 'JOIN THE FUTURE OF DEFI',
      story: [
        'Secure your spot in the future of DeFi.',
        'Join our final pre-sale round before May 5, 2025.',
        'No VCs, no corporate backers—just community-driven innovation.',
      ].join(' '),
      mascotImage: '/maskot1.png', // Specific mascot for home tab
      features: [
        {
          icon: <CurrencyDollarIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Pre-Sale Benefits',
          description: 'Early access to governance and rewards',
        },
        {
          icon: <ShieldCheckIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Bitcoin-Level Security',
          description: 'Merged mining with Bitcoin',
        },
        {
          icon: <RocketLaunchIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Zero-Gas Innovation',
          description: 'Trade and build without blockchain fees',
        },
        {
          icon: <UserGroupIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Fair Launch Guarantee',
          description: '100% community-owned, no VC',
        },
      ],
    },
    ecosystem: {
      title: 'REVOLUTIONARY ARCHITECTURE',
      story: [
        "Built on Hathor's groundbreaking DAG-blockchain hybrid architecture.",
        'Unlimited scalability with Bitcoin-level security.',
        // 'Run full nodes on standard hardware and participate in true decentralization.',
      ].join(' '),
      mascotImage: '/maskot2.png', // Specific mascot for ecosystem tab
      features: [
        {
          icon: <CubeTransparentIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Hybrid DAG Architecture',
          description: 'Unlimited TPS with O(1) validation',
        },
        {
          icon: <ShieldCheckIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Accessible Node Operation',
          description: 'Run nodes on consumer grade hardware',
        },
        {
          icon: <BanknotesIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Built-in Spam Protection',
          description: 'Secure, fee-less transactions at scale',
        },
        {
          icon: <ClockIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Real-Time Processing',
          description: 'Instant finality with fast propagation',
        },
      ],
    },
    trading: {
      title: 'ZERO-GAS TRADING',
      story: [
        'Trade securely and instantly without blockchain gas fees.',
        'Our built-in MEV protection ensures every trade is fair and transparent.',
        // 'Experience a trading platform that puts users first with zero-gas innovation.',
      ].join(' '),
      mascotImage: '/maskot3.png', // Specific mascot for trading tab
      features: [
        {
          icon: <CurrencyDollarIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Zero Gas Fees for All Trades',
          description: 'Trade without any blockchain gas costs',
        },
        {
          icon: <ClockIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Instant Trade Finality',
          description: 'No waiting for confirmations',
        },
        {
          icon: <ShieldCheckIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'MEV & Front-Running Protection',
          description: 'Trade with confidence and security',
        },
        {
          icon: <UserGroupIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'User-Friendly Trading Experience',
          description: 'Intuitive interface for all skill levels',
        },
      ],
    },
    blueprints: {
      title: 'NO-CODE TOKEN UTILITIES',
      story: [
        // 'Launch your DeFi applications rapidly with secure, audited, no-code smart contracts.',
        'Deploy custom tokens, staking pools, and DAOs without writing a single line of code.',
        'Lower entry barriers and empower yourself in the new Web3 economy.',
      ].join(' '),
      mascotImage: '/maskot4.png', // Specific mascot for blueprints tab
      features: [
        {
          icon: <CodeBracketIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Create Fast No-Code Contracts',
          description: 'Deploy smart contracts without coding',
        },
        {
          icon: <CheckCircleIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Security Audited Templates',
          description: 'Pre-audited and secure building blocks',
        },
        {
          icon: <RocketLaunchIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Rapid Token & dApp Creation',
          description: 'Launch your project in minutes',
        },
        {
          icon: <LightBulbIcon className="flex-shrink-0 w-8 h-8 mr-4 text-yellow-500" />,
          title: 'Easy Web3 Development',
          description: 'Build dpps without technical barriers',
        },
      ],
    },
  }

  // Default to home if no tab or home selected
  const currentTab = activeTab || 'home'
  const content = tabContent[currentTab] || tabContent.home

  // Render the content for the active tab
  return (
    <div className="max-w-4xl">
      <Typography
        variant="h3"
        weight={700}
        className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
      >
        {content.title}
      </Typography>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr,1.2fr] h-full">
        {/* Left column with mascot and text */}
        <div className="flex flex-col h-full">
          {/* Mascot container */}
          <div className="flex items-center justify-center w-full aspect-[16/9] mb-2">
            <div className="relative flex items-center justify-center w-4/5">
              <img
                src={content.mascotImage}
                alt={`Dozer Mascot - ${currentTab}`}
                className="object-contain w-full h-full drop-shadow-[0_4px_8px_rgba(234,179,8,0.2)]"
              />
            </div>
          </div>

          {/* Animated text */}
          <div className="flex-grow mt-0" key={`tab-${currentTab}`}>
            <AnimatedText content={content.story} />
          </div>
        </div>

        {/* Right column with feature cards */}
        <div className="flex flex-col justify-between h-full">
          <div className="space-y-3.5">
            {content.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1.0],
                  delay: index * 0.1,
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className="group relative overflow-hidden p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-yellow-500/20 hover:border-yellow-500/40 transition-colors duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                {/* Subtle highlight effect */}
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent group-hover:opacity-100" />

                {/* Content */}
                <div className="relative z-10 flex">
                  <div className="flex items-center justify-center w-12 h-12 mr-4 transition-colors duration-300 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/15">
                    {React.cloneElement(feature.icon as React.ReactElement, {
                      className: 'w-6 h-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110',
                    })}
                  </div>
                  <div>
                    <Typography
                      variant="base"
                      weight={600}
                      className="mb-1 text-yellow-400 transition-colors duration-300 group-hover:text-yellow-300"
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="sm"
                      className="transition-colors duration-300 text-neutral-300 group-hover:text-neutral-200"
                    >
                      {feature.description}
                    </Typography>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TabContentWithAssets
