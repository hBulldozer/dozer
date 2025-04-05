'use client'

import React, { useEffect, useState } from 'react'
import { Disclosure } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography } from '@dozer/ui'
import { ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Collapsible } from '@dozer/ui/animation/Collapsible'

interface FAQItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  data: FAQItem[]
  className?: string
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ data, className }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  // Simple load animation without scroll-based triggers
  useEffect(() => {
    // Short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.4, delay: index * 0.07 }}
          className="rounded-xl border border-yellow-500/30 bg-black/20 backdrop-blur-[2px] overflow-hidden hover:border-yellow-500/40 transition-all duration-300"
        >
          <Disclosure as="div">
            {({ open }) => (
              <>
                <Disclosure.Button className="w-full px-5 py-4 text-left transition-colors flex items-start justify-between group hover:bg-yellow-500/10">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center mr-3 group-hover:bg-yellow-500/20 transition-colors duration-300 flex-shrink-0 mt-0.5">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    </div>
                    <Typography
                      variant="base"
                      weight={700}
                      className="text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300"
                    >
                      {item.question}
                    </Typography>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-yellow-500 transition-transform duration-200 flex-shrink-0 ${
                      open ? 'transform rotate-180' : ''
                    }`}
                  />
                </Disclosure.Button>

                <Collapsible open={open} className="px-5 pb-6">
                  <div className="pt-4 pr-4 pb-2">
                    <Typography
                      variant="base"
                      className="leading-relaxed text-neutral-300 ml-11"
                      style={{ lineHeight: '1.7' }}
                    >
                      {item.answer}
                    </Typography>
                  </div>
                </Collapsible>
              </>
            )}
          </Disclosure>
        </motion.div>
      ))}
    </div>
  )
}

export default FaqAccordion
