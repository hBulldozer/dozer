'use client'
import React from 'react'
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

interface TabContentWithAssetsProps {
  activeTab: 'home' | 'ecosystem' | 'trading' | 'blueprints' | null
}

const TabContentWithAssets: React.FC<TabContentWithAssetsProps> = ({ activeTab }) => {
  const renderIcon = (icon: JSX.Element) => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border rounded-full bg-yellow-500/20 border-yellow-500/40">
      <div className="w-10 h-10 text-yellow-500">{icon}</div>
    </div>
  )

  if (activeTab === 'home' || activeTab === null) {
    return (
      <div className="max-w-4xl">
        <Typography
          variant="h3"
          weight={700}
          className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
        >
          REVOLUTIONIZING DEFI
        </Typography>
        
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-center w-full p-2 mb-4 border rounded-lg aspect-square bg-gradient-to-br from-yellow-500/5 to-amber-600/5 border-yellow-500/20">
              <div className="relative flex items-center justify-center">
                {/* Glow effect behind the mascot */}
                <div className="absolute w-48 h-48 rounded-full bg-primary-500 opacity-30 blur-xl"></div>

                {/* Rotating border effect */}
                <div className="absolute border-2 border-dashed rounded-full w-56 h-56 border-primary-500 animate-spin-slow"></div>

                {/* Mascot image with container */}
                <div className="relative z-10 w-48 h-48 p-2 overflow-hidden transition-all duration-300 rounded-full backdrop-blur-sm bg-black/30 hover:scale-105">
                  <img src="/dozer_backer_mascot.png" alt="Dozer Mascot" className="object-contain w-full h-full" />
                </div>
              </div>
            </div>

            <Typography variant="base" className="text-neutral-300">
              Dozer Finance is bringing innovation to DeFi with lightning-fast transactions and minimal fees. Join us
              in shaping the future of decentralized finance.
            </Typography>
          </div>

          <div className="space-y-4">
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <CurrencyDollarIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Zero-Fee Transactions
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Trade and transact without any gas fees
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <ClockIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Instant Finality
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Real-time settlement without waiting for confirmations
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <ShieldCheckIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  MEV Protection
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Trade securely without value extraction
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <UserGroupIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  User-Friendly Interface
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Simple design for all experience levels
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'ecosystem') {
    return (
      <div className="max-w-4xl">
        <Typography
          variant="h3"
          weight={700}
          className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
        >
          THE DOZER FINANCE ECOSYSTEM
        </Typography>

        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
          <div>
            {/* Image description: System architecture illustration */}
            <div className="flex items-center justify-center w-full p-4 mb-4 border rounded-lg aspect-video bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/40">
              <Typography variant="base" className="text-center text-neutral-400">
                [ECOSYSTEM DIAGRAM: Interconnected nodes showing Dozer's DeFi components]
              </Typography>
            </div>

            <Typography variant="base" className="text-neutral-300">
              A comprehensive DeFi ecosystem optimized for efficient markets, with revolutionary core innovations.
            </Typography>
          </div>

          <div className="space-y-4">
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <BanknotesIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Zero-Gas Trading Platform
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Trade and lend without fees
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <DocumentTextIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Dozer Tools
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  No-code Web3 development framework
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <ShieldCheckIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Enhanced Security
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Built on Hathor's hybrid architecture
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <UserGroupIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Decentralized Governance
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Democratic and inclusive ecosystem
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'trading') {
    return (
      <div className="max-w-4xl">
        <Typography
          variant="h3"
          weight={700}
          className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
        >
          ZERO-GAS TRADING PLATFORM
        </Typography>

        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
          <div>
            {/* Image description: Trading interface */}
            <div className="flex items-center justify-center w-full p-4 mb-4 border rounded-lg aspect-video bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/40">
              <Typography variant="base" className="text-center text-neutral-400">
                [TRADING INTERFACE: Screenshot of the Dozer trading dashboard]
              </Typography>
            </div>

            <Typography variant="base" className="text-neutral-300">
              Our platform eliminates transaction fees while providing instant settlement, creating a more accessible
              trading environment.
            </Typography>
          </div>

          <div className="space-y-4">
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <CurrencyDollarIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Zero-Fee Transactions
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  No gas costs for any operation
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <ClockIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Instant Finality
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Real-time settlement without delays
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <ShieldCheckIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  MEV Protection
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Built-in safeguards against value extraction
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <UserGroupIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  User-Friendly Interface
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Simple design for all experience levels
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'blueprints') {
    return (
      <div className="max-w-4xl">
        <Typography
          variant="h3"
          weight={700}
          className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
        >
          DOZER TOOLS: NO-CODE WEB3 FRAMEWORK
        </Typography>

        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
          <div>
            {/* Image description: Blueprint interface */}
            <div className="flex items-center justify-center w-full p-4 mb-4 border rounded-lg aspect-video bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/40">
              <Typography variant="base" className="text-center text-neutral-400">
                [BLUEPRINT INTERFACE: Visual builder for Web3 applications]
              </Typography>
            </div>

            <Typography variant="base" className="text-neutral-300">
              Dozer Tools empowers builders with a no-code framework to rapidly develop secure Web3 applications
              without specialized knowledge.
            </Typography>
          </div>

          <div className="space-y-4">
            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <CodeBracketIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  No-Code Development
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Build without programming knowledge
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <CheckCircleIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Pre-audited Components
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Security-vetted building blocks
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <WrenchScrewdriverIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Customizable Templates
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Ready-made designs for quick deployment
                </Typography>
              </div>
            </div>

            <div className="flex p-3 border rounded-lg bg-black/40 border-yellow-500/20">
              <LightBulbIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Democratizing Development
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Lower barriers to Web3 innovation
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default TabContentWithAssets
