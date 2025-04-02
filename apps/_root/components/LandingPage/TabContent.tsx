'use client'
import React from 'react'
import { Typography } from '@dozer/ui'

interface TabContentProps {
  activeTab: 'home' | 'ecosystem' | 'trading' | 'blueprints' | null
}

const TabContent: React.FC<TabContentProps> = ({ activeTab }) => {
  if (activeTab === 'home' || activeTab === null) {
    return (
      <div className="max-w-4xl">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="w-full md:w-1/3 flex justify-center mb-6 md:mb-0">
            {/* Placeholder for Dozer mascot image */}
            <div className="w-56 h-56 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border border-yellow-500/50 flex items-center justify-center">
              <Typography variant="lg" className="text-neutral-400">
                [DOZER MASCOT]
              </Typography>
            </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <Typography variant="h1" weight={800} className="text-3xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
              FINAL PRESALE PHASE
            </Typography>
            
            <Typography variant="lg" className="mb-6 text-neutral-300">
              Dozer Finance is a comprehensive DeFi ecosystem optimized for efficient markets. Experience zero-fee transactions, instant finality, and built-in MEV protection on our trading and lending platform.
            </Typography>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="px-4 py-2 rounded-full border border-yellow-500/50 bg-black/30">
                <Typography variant="sm" weight={600} className="text-yellow-400">
                  ZERO-FEE TRANSACTIONS
                </Typography>
              </div>
              <div className="px-4 py-2 rounded-full border border-yellow-500/50 bg-black/30">
                <Typography variant="sm" weight={600} className="text-yellow-400">
                  INSTANT FINALITY
                </Typography>
              </div>
              <div className="px-4 py-2 rounded-full border border-yellow-500/50 bg-black/30">
                <Typography variant="sm" weight={600} className="text-yellow-400">
                  BUILT-IN MEV PROTECTION
                </Typography>
              </div>
            </div>
          </div>
        </div>
        
        <Typography variant="h3" weight={700} className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          KEY FEATURES
        </Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 rounded-lg border border-yellow-500/30 bg-black/50">
            <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
              Zero-Fee Transactions
            </Typography>
            <Typography variant="sm" className="text-neutral-300">
              Eliminating cost barriers for users with fee-less transactions, enabling more accessible DeFi for everyone.
            </Typography>
          </div>
          
          <div className="p-4 rounded-lg border border-yellow-500/30 bg-black/50">
            <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
              Intent-Based Architecture
            </Typography>
            <Typography variant="sm" className="text-neutral-300">
              Simplifying complex DeFi operations with intuitive interfaces that focus on user intent rather than technical execution.
            </Typography>
          </div>
          
          <div className="p-4 rounded-lg border border-yellow-500/30 bg-black/50">
            <Typography variant="base" weight={600} className="mb-2 text-yellow-400">
              No-Code Framework
            </Typography>
            <Typography variant="sm" className="text-neutral-300">
              Empowering Web3 builders with customizable templates and pre-audited components for rapid, secure development.
            </Typography>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'ecosystem') {
    return (
      <div className="max-w-4xl">
        <Typography variant="h3" weight={700} className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          THE DOZER FINANCE ECOSYSTEM
        </Typography>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Typography variant="lg" className="mb-4 text-neutral-300">
              Dozer Finance is a comprehensive DeFi ecosystem, optimized for efficient markets by delivering zero-fee transactions and instant finality.
            </Typography>
            
            <Typography variant="base" className="mb-6 text-neutral-400">
              Our platform addresses core challenges in traditional DeFi through two key innovations:
            </Typography>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Zero-Gas Trading and Lending Platform
              </Typography>
              <Typography variant="sm" className="text-neutral-300">
                A DeFi marketplace leveraging Hathor Network's unique architecture
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Dozer Blueprints
              </Typography>
              <Typography variant="sm" className="text-neutral-300">
                A no-code framework for Web3 builders with pre-audited components
              </Typography>
            </div>
          </div>
          
          <div>
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Zero-fee transactions
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Eliminating cost barriers for users
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Intent-Based Architecture
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Simplifying complex DeFi operations with friendly interfaces
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Instant finality
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Enabling real-time settlement of trades and loans
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Built-in MEV protection
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Ensuring fair and efficient markets
              </Typography>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'trading') {
    return (
      <div className="max-w-4xl">
        <Typography variant="h3" weight={700} className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          ZERO-GAS TRADING & LENDING PLATFORM
        </Typography>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Typography variant="lg" className="mb-4 text-neutral-300">
              Our platform eliminates transaction fees while providing instant transaction finality, creating a more accessible and efficient trading environment.
            </Typography>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Eliminating Transaction Fees
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                By leveraging Hathor Network's fee-less architecture, we remove one of the biggest barriers to DeFi adoption: high gas costs.
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Instant Finality
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Trades and lending transactions are settled in real-time, eliminating the uncertainty and delays common in traditional blockchain systems.
              </Typography>
            </div>
          </div>
          
          <div>
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Built-in MEV Protection
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Our platform includes sophisticated mechanisms to protect users from Maximal Extractable Value (MEV) exploitation, ensuring fair and efficient markets.
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                User-Friendly Interface
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Designed for both novice and experienced users, our platform simplifies complex DeFi operations into intuitive workflows.
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Innovative Lending Protocols
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Our lending systems optimize capital efficiency while maintaining robust security and risk management.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'blueprints') {
    return (
      <div className="max-w-4xl">
        <Typography variant="h3" weight={700} className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          DOZER BLUEPRINTS: NO-CODE WEB3 FRAMEWORK
        </Typography>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Typography variant="lg" className="mb-4 text-neutral-300">
              Dozer Blueprints empowers Web3 builders with a no-code framework that dramatically reduces development time and complexity.
            </Typography>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Customizable Templates
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Pre-built smart contract templates that can be easily customized to meet specific project requirements.
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Pre-audited Components
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Security-vetted building blocks that significantly reduce vulnerabilities and audit costs.
              </Typography>
            </div>
          </div>
          
          <div>
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Streamlined Implementation
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Easy implementation of key DeFi features such as token creation, launchpads, liquidity deployment, staking, and DAO/voting structures.
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20 mb-3">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Composable Nanocontracts
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Flexible and powerful DApp creation through composable nanocontract architecture.
              </Typography>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/20">
              <Typography variant="sm" weight={600} className="text-yellow-400 mb-1">
                Democratizing Development
              </Typography>
              <Typography variant="xs" className="text-neutral-300">
                Lowering technical barriers to enable more entrepreneurs to build in the Web3 space.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default TabContent
