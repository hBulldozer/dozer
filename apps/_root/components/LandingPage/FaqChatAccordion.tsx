'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Disclosure } from '@headlessui/react'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import { Typography } from '@dozer/ui/typography'
import { classNames } from '@dozer/ui'

interface FAQItem {
  id?: number
  question: string
  answer: string
}

interface FaqChatAccordionProps {
  data: FAQItem[]
  className?: string
  questionClassName?: string
  answerClassName?: string
}

export function FaqChatAccordion({ data, className, questionClassName, answerClassName }: FaqChatAccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(null)

  // Function to handle click on a disclosure item
  const handleDisclosureClick = (itemId: string) => {
    setOpenItem(openItem === itemId ? null : itemId)
  }

  return (
    <div className={classNames('p-4', className)}>
      <div className="space-y-2">
        {data.map((item, index) => {
          const itemId = item.id?.toString() || index.toString()
          const isOpen = openItem === itemId

          return (
            <div key={itemId} className="mb-2">
              <div className="flex items-center justify-start w-full gap-x-4">
                <button
                  type="button"
                  onClick={() => handleDisclosureClick(itemId)}
                  className="flex items-center justify-start w-full gap-x-4 focus:outline-none"
                >
                  <div
                    className={classNames(
                      'relative flex items-center space-x-2 rounded-xl p-2 transition-colors',
                      isOpen ? 'bg-yellow-500/20 text-yellow-400' : 'bg-black/40 hover:bg-yellow-500/10',
                      questionClassName
                    )}
                  >
                    <Typography variant="base" weight={600} className="font-medium">
                      {item.question}
                    </Typography>
                  </div>

                  <span className={classNames('text-stone-500', isOpen && 'text-yellow-400')}>
                    {isOpen ? <MinusIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                  </span>
                </button>
              </div>

              {isOpen && (
                <motion.div
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto' },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 ml-7 md:ml-16">
                    <div
                      className={classNames(
                        'relative rounded-2xl bg-yellow-500/10 px-4 py-2 text-stone-200 max-w-full md:max-w-2xl lg:max-w-3xl',
                        answerClassName
                      )}
                    >
                      <Typography variant="base">{item.answer}</Typography>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FaqChatAccordion
