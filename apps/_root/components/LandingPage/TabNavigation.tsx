'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@dozer/ui'
import { HomeIcon, CubeTransparentIcon, BanknotesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'

interface TabNavigationProps {
  activeTab: 'home' | 'ecosystem' | 'trading' | 'blueprints' | null
  setActiveTab: (tab: 'home' | 'ecosystem' | 'trading' | 'blueprints') => void
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'home',
      label: 'HOME',
      icon: <HomeIcon className="w-6 h-6" />,
    },
    {
      id: 'ecosystem',
      label: 'ECOSYSTEM',
      icon: <CubeTransparentIcon className="w-6 h-6" />,
    },
    {
      id: 'trading',
      label: 'TRADING PLATFORM',
      icon: <BanknotesIcon className="w-6 h-6" />,
    },
    {
      id: 'blueprints',
      label: 'TOOLS',
      icon: <RocketLaunchIcon className="w-6 h-6" />,
    },
  ]

  return (
    <div className="mb-8 overflow-hidden rounded-xl backdrop-blur-sm border border-yellow-500/20 p-1.5 bg-black/20 shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden group rounded-lg transition-all duration-300`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-yellow-600/10 border border-yellow-500/40"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center justify-center p-3">
                <div
                  className={`transition-all duration-300 ${
                    isActive ? 'text-yellow-500' : 'text-neutral-400 group-hover:text-neutral-300'
                  }`}
                >
                  {tab.icon}
                </div>
                <Typography
                  variant="xs"
                  weight={600}
                  className={`mt-1.5 transition-all duration-300 tracking-wider ${
                    isActive ? 'text-yellow-400' : 'text-neutral-400 group-hover:text-neutral-300'
                  }`}
                >
                  {tab.label}
                </Typography>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default TabNavigation
