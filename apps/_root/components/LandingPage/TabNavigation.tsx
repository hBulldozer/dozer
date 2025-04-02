'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@dozer/ui'
import {
  HomeIcon,
  CubeTransparentIcon,
  BanknotesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

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
      label: 'BLUEPRINTS',
      icon: <RocketLaunchIcon className="w-6 h-6" />,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-1 mb-6 bg-black/20 rounded-lg p-1">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          whileHover={{ y: -2 }}
          className={`flex flex-col items-center justify-center p-3 rounded-lg ${
            activeTab === tab.id
              ? 'bg-yellow-500/20 border border-yellow-500/50'
              : 'bg-black/40 border border-transparent hover:border-yellow-500/30'
          }`}
          onClick={() => setActiveTab(tab.id as any)}
        >
          <div className={`${activeTab === tab.id ? 'text-yellow-500' : 'text-neutral-400'}`}>
            {tab.icon}
          </div>
          <Typography
            variant="xs"
            weight={600}
            className={`mt-1 ${activeTab === tab.id ? 'text-yellow-400' : 'text-neutral-400'}`}
          >
            {tab.label}
          </Typography>
        </motion.button>
      ))}
    </div>
  )
}

export default TabNavigation
