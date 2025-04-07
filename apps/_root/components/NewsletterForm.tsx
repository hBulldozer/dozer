'use client'

import React, { useState } from 'react'
import { Typography } from '@dozer/ui/typography'
import { api } from '../utils/api'

interface NewsletterFormProps {
  className?: string
  isMobile?: boolean
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({ className, isMobile = false }) => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const subscribeToNewsletter = api.getNewsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setMessage(data.message)
      setMessageType('success')
      setEmail('')
    },
    onError: (error) => {
      setMessage(error.message || 'Failed to subscribe. Please try again.')
      setMessageType('error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Please enter your email address')
      setMessageType('error')
      return
    }

    subscribeToNewsletter.mutate({ email })
  }

  return (
    <div className={className}>
      <Typography
        variant={isMobile ? 'sm' : 'xs'}
        weight={isMobile ? 600 : 500}
        className={`${isMobile ? 'mb-2 text-yellow-400' : 'mb-2 text-sm text-yellow-400 sm:text-xs'}`}
      >
        {isMobile ? 'JOIN OUR NEWSLETTER' : 'Newsletter'}
      </Typography>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 text-sm text-white border rounded-lg bg-stone-900 border-yellow-500/30 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
        />

        <button
          type="submit"
          disabled={subscribeToNewsletter.isLoading}
          className="px-4 py-2 text-sm font-semibold text-black transition-opacity rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {subscribeToNewsletter.isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>

        {message && (
          <Typography variant="xs" className={`mt-1 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </Typography>
        )}
      </form>
    </div>
  )
}
