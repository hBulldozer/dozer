'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button, Typography } from '@dozer/ui'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  faqItems: FAQItem[]
  onViewMoreClick: () => void
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqItems, onViewMoreClick }) => {
  return (
    <div className="w-full p-6 md:p-8 border-t border-yellow-500/30 mt-8 relative">
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-yellow-500/10 pointer-events-none" />

      <Typography
        variant="h3"
        weight={800}
        className="mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 relative z-10"
      >
        FREQUENTLY ASKED QUESTIONS
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-7xl mx-auto relative z-10">
        {faqItems.slice(0, 4).map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-5 rounded-xl border border-yellow-500/20 bg-black/40 backdrop-blur-sm group hover:border-yellow-500/40 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-start mb-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center mr-3 group-hover:bg-yellow-500/20 transition-colors duration-300">
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
            <Typography
              variant="sm"
              className="text-neutral-300 ml-11 group-hover:text-neutral-200 transition-colors duration-300"
            >
              {item.answer}
            </Typography>
          </motion.div>
        ))}
      </div>

      {faqItems.length > 4 && (
        <div className="flex justify-center mt-8 relative z-10">
          <Button
            variant="outlined"
            size="sm"
            onClick={onViewMoreClick}
            className="border-yellow-500/30 text-yellow-400 hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all duration-300 px-6 py-2 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          >
            View More Information
          </Button>
        </div>
      )}
    </div>
  )
}

export default FAQSection
