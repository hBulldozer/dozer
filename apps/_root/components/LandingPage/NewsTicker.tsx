'use client'
import React from 'react'

const NewsTicker: React.FC = () => {
  return (
    <div className="w-full overflow-hidden border-b border-yellow-500/30">
      <div className="py-2 bg-yellow-500/10">
        <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite]">
          <span className="mx-4 text-sm text-yellow-400 font-bold">ZERO-FEE TRANSACTIONS</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">INSTANT FINALITY</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">BUILT-IN MEV PROTECTION</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">COMPREHENSIVE DEFI ECOSYSTEM</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">ZERO-FEE TRANSACTIONS</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">INSTANT FINALITY</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">BUILT-IN MEV PROTECTION</span>
          <span className="mx-4 text-sm text-yellow-400 font-bold">COMPREHENSIVE DEFI ECOSYSTEM</span>
        </div>
      </div>
    </div>
  )
}

export default NewsTicker
