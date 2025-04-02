'use client'
import React, { memo } from 'react'
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

// Memoize the component to prevent unnecessary re-renders
const TabContentWithAssets: React.FC<TabContentWithAssetsProps> = memo(({ activeTab }) => {
  const renderIcon = (icon: JSX.Element) => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border rounded-full bg-yellow-500/20 border-yellow-500/40">
      <div className="w-10 h-10 text-yellow-500">{icon}</div>
    </div>
  )

  if (activeTab === 'home' || activeTab === null) {
    return (
      <div className="max-w-4xl">
        <div className="flex flex-col w-full gap-6 md:flex-row">
          <div className="flex w-full justify-center items-center md:max-w-[360px]">
            <div className="relative flex items-center justify-center">
              {/* Glow effect behind the mascot */}
              <div className="absolute w-64 h-64 rounded-full bg-primary-500 opacity-30 blur-xl animate-pulse"></div>

              {/* Rotating border effect */}
              <div className="absolute border-2 border-dashed rounded-full w-72 h-72 border-primary-500 animate-spin-slow"></div>

              {/* Mascot image with container */}
              <div className="relative z-10 w-64 h-64 p-2 overflow-hidden transition-all duration-300 rounded-full backdrop-blur-sm bg-black/30 hover:scale-105">
                <img src="/dozer_backer_mascot.png" alt="Dozer Mascot" className="object-contain w-full h-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 sm:justify-center">
            <div className="flex flex-col gap-2">
              <Typography variant="h1" weight={800} className="pt-6">
                REVOLUTIONIZING DEFI
              </Typography>
              <Typography variant="lg" weight={400} className="mb-4 opacity-60">
                Dozer Finance is bringing innovation to DeFi with lightning-fast transactions and minimal fees. Join us
                in shaping the future of decentralized finance.
              </Typography>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3">
              <div className="p-6 text-center border rounded-lg border-yellow-500/30 bg-black/50">
                {renderIcon(<CurrencyDollarIcon />)}
                <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
                  Zero-Fee Transactions
                </Typography>
                <Typography variant="sm" className="text-neutral-300">
                  Trade and transact without any gas fees
                </Typography>
              </div>

              <div className="p-6 text-center border rounded-lg border-yellow-500/30 bg-black/50">
                {renderIcon(<ClockIcon />)}
                <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
                  Instant Finality
                </Typography>
                <Typography variant="sm" className="text-neutral-300">
                  Real-time settlement without waiting for confirmations
                </Typography>
              </div>

              <div className="p-6 text-center border rounded-lg border-yellow-500/30 bg-black/50">
                {renderIcon(<ShieldCheckIcon />)}
                <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
                  MEV Protection
                </Typography>
                <Typography variant="sm" className="text-neutral-300">
                  Trade securely without value extraction
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

        <div className="flex flex-col items-center gap-8 mb-8 md:flex-row">
          <div className="w-full md:w-1/3">
            {/* Image description: System architecture illustration */}
            <div className="flex items-center justify-center w-full p-4 border rounded-lg aspect-square bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/40">
              <Typography variant="base" className="text-center text-neutral-400">
                [ECOSYSTEM DIAGRAM: Interconnected nodes showing Dozer's DeFi components]
              </Typography>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <Typography variant="lg" className="mb-4 text-neutral-300">
              A comprehensive DeFi ecosystem optimized for efficient markets, with two core innovations:
            </Typography>

            <div className="space-y-3">
              <div className="flex items-center p-3 border rounded-lg bg-black/40 border-yellow-500/20">
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

              <div className="flex items-center p-3 border rounded-lg bg-black/40 border-yellow-500/20">
                <DocumentTextIcon className="flex-shrink-0 w-8 h-8 mr-3 text-yellow-500" />
                <div>
                  <Typography variant="base" weight={600} className="text-yellow-400">
                    Dozer Blueprints
                  </Typography>
                  <Typography variant="xs" className="text-neutral-300">
                    No-code Web3 development framework
                  </Typography>
                </div>
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
          DOZER BLUEPRINTS: NO-CODE WEB3 FRAMEWORK
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
              Dozer Blueprints empowers builders with a no-code framework to rapidly develop secure Web3 applications
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
})

export default TabContentWithAssets
