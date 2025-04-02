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
    <div className="w-full p-4 md:p-6 border-t border-yellow-500/30 mt-8">
      <Typography
        variant="h3"
        weight={700}
        className="mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
      >
        FREQUENTLY ASKED QUESTIONS
      </Typography>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto">
        {faqItems.slice(0, 4).map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -3 }}
            className="p-4 rounded-lg border border-yellow-500/20 bg-black/50"
          >
            <div className="flex items-start mb-2">
              <QuestionMarkCircleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <Typography variant="base" weight={600} className="text-yellow-400">
                {item.question}
              </Typography>
            </div>
            <Typography variant="sm" className="text-neutral-300 ml-7">
              {item.answer}
            </Typography>
          </motion.div>
        ))}
      </div>
      
      {faqItems.length > 4 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outlined"
            size="sm"
            className="border-yellow-500/50 text-yellow-500"
            onClick={onViewMoreClick}
          >
            View More Questions
          </Button>
        </div>
      )}
    </div>
  )
}

export default FAQSection
