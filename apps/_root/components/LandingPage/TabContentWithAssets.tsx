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
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

interface TabContentWithAssetsProps {
  activeTab: 'home' | 'ecosystem' | 'trading' | 'blueprints' | null
}

const TabContentWithAssets: React.FC<TabContentWithAssetsProps> = ({ activeTab }) => {
  const renderIcon = (icon: JSX.Element) => (
    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500/40">
      <div className="w-10 h-10 text-yellow-500">
        {icon}
      </div>
    </div>
  )

  if (activeTab === 'home' || activeTab === null) {
    return (
      <div className="max-w-4xl">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="w-full md:w-1/3 flex justify-center mb-6 md:mb-0">
            {/* Image description: Bulldozer mascot with a cryptocurrency coin */}
            <div className="w-56 h-56 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border border-yellow-500/50 flex items-center justify-center">
              <Typography variant="lg" className="text-neutral-400 text-center px-4">
                [DOZER MASCOT: Bulldozer character holding a DZR coin]
              </Typography>
            </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <Typography variant="h1" weight={800} className="text-3xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
              REVOLUTIONIZING DEFI
            </Typography>
            
            <Typography variant="lg" className="mb-6 text-neutral-300">
              Dozer Finance is building a comprehensive DeFi ecosystem with zero-fee transactions, instant finality, and built-in MEV protection - eliminating barriers to financial inclusion.
            </Typography>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-6 rounded-lg border border-yellow-500/30 bg-black/50 text-center">
            {renderIcon(<CurrencyDollarIcon />)}
            <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
              Zero-Fee Transactions
            </Typography>
            <Typography variant="sm" className="text-neutral-300">
              Trade and transact without any gas fees
            </Typography>
          </div>
          
          <div className="p-6 rounded-lg border border-yellow-500/30 bg-black/50 text-center">
            {renderIcon(<ClockIcon />)}
            <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
              Instant Finality
            </Typography>
            <Typography variant="sm" className="text-neutral-300">
              Real-time settlement without waiting for confirmations
            </Typography>
          </div>
          
          <div className="p-6 rounded-lg border border-yellow-500/30 bg-black/50 text-center">
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
    )
  }

  if (activeTab === 'ecosystem') {
    return (
      <div className="max-w-4xl">
        <Typography variant="h3" weight={700} className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          THE DOZER FINANCE ECOSYSTEM
        </Typography>
        
        <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="w-full md:w-1/3">
            {/* Image description: System architecture illustration */}
            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 flex items-center justify-center p-4">
              <Typography variant="base" className="text-neutral-400 text-center">
                [ECOSYSTEM DIAGRAM: Interconnected nodes showing Dozer's DeFi components]
              </Typography>
            </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <Typography variant="lg" className="mb-4 text-neutral-300">
              A comprehensive DeFi ecosystem optimized for efficient markets, with two core innovations:
            </Typography>
            
            <div className="space-y-3">
              <div className="flex items-center p-3 rounded-lg bg-black/40 border border-yellow-500/20">
                <BanknotesIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
                <div>
                  <Typography variant="base" weight={600} className="text-yellow-400">
                    Zero-Gas Trading Platform
                  </Typography>
                  <Typography variant="xs" className="text-neutral-300">
                    Trade and lend without fees
                  </Typography>
                </div>
              </div>
              
              <div className="flex items-center p-3 rounded-lg bg-black/40 border border-yellow-500/20">
                <DocumentTextIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
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
        <Typography variant="h3" weight={700} className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          ZERO-GAS TRADING PLATFORM
        </Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            {/* Image description: Trading interface */}
            <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 flex items-center justify-center p-4 mb-4">
              <Typography variant="base" className="text-neutral-400 text-center">
                [TRADING INTERFACE: Screenshot of the Dozer trading dashboard]
              </Typography>
            </div>
            
            <Typography variant="base" className="text-neutral-300">
              Our platform eliminates transaction fees while providing instant settlement, creating a more accessible trading environment.
            </Typography>
          </div>
          
          <div className="space-y-4">
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Zero-Fee Transactions
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  No gas costs for any operation
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <ClockIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Instant Finality
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Real-time settlement without delays
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <ShieldCheckIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  MEV Protection
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Built-in safeguards against value extraction
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <UserGroupIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
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
        <Typography variant="h3" weight={700} className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          DOZER BLUEPRINTS: NO-CODE WEB3 FRAMEWORK
        </Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            {/* Image description: Blueprint interface */}
            <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 flex items-center justify-center p-4 mb-4">
              <Typography variant="base" className="text-neutral-400 text-center">
                [BLUEPRINT INTERFACE: Visual builder for Web3 applications]
              </Typography>
            </div>
            
            <Typography variant="base" className="text-neutral-300">
              Dozer Blueprints empowers builders with a no-code framework to rapidly develop secure Web3 applications without specialized knowledge.
            </Typography>
          </div>
          
          <div className="space-y-4">
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <CodeBracketIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  No-Code Development
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Build without programming knowledge
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <CheckCircleIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Pre-audited Components
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Security-vetted building blocks
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <WrenchScrewdriverIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <Typography variant="base" weight={600} className="text-yellow-400">
                  Customizable Templates
                </Typography>
                <Typography variant="xs" className="text-neutral-300">
                  Ready-made designs for quick deployment
                </Typography>
              </div>
            </div>
            
            <div className="flex p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <LightBulbIcon className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
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
