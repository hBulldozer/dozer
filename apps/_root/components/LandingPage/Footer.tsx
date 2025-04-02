'use client'
import React from 'react'
import { Link, Typography } from '@dozer/ui'

const Footer: React.FC = () => {
  return (
    <div className="w-full p-4 border-t border-yellow-500/30 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
        {/* Social icons */}
        <div className="flex gap-4 mb-4 md:mb-0">
          {['Twitter', 'Telegram', 'Discord', 'Medium'].map((platform) => (
            <Link.External 
              key={platform}
              href={`https://${platform.toLowerCase()}.com/dozerfinance`}
              className="w-10 h-10 flex items-center justify-center bg-black/60 rounded-full border border-yellow-500/30 hover:border-yellow-500/70 transition-colors"
            >
              <Typography variant="sm" weight={600} className="text-yellow-500">
                {platform[0]}
              </Typography>
            </Link.External>
          ))}
        </div>
        
        {/* Disclaimer */}
        <Typography variant="xs" className="text-right text-neutral-500">
          DISCLAIMER: THIS IS A COMMUNITY TOKEN
          <br />
          ALL RIGHTS RESERVED. © 2025 DOZER FINANCE
        </Typography>
      </div>
    </div>
  )
}

export default Footer
