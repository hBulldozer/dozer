import { Button, NotificationData, createFailedToast, createInfoToast } from '@dozer/ui'
import { Layout } from '../../components/Layout'
import React from 'react'
import { createErrorToast, createSuccessToast, createInlineToast, createToast } from '@dozer/ui'

const getRandomType = (): NotificationData['type'] => {
  const types: NotificationData['type'][] = [
    'send',
    'stargate',
    'swap',
    'mint',
    'burn',
    'approval',
    'enterBar',
    'leaveBar',
    'claimRewards',
    'withdrawStream',
    'cancelStream',
    'transferStream',
    'transferVesting',
    'updateStream',
    'withdrawVesting',
    'createStream',
    'createMultipleStream',
    'createVesting',
    'createMultipleVesting',
  ]
  const randomIndex = Math.floor(Math.random() * types.length)
  return types[randomIndex]
}

const genDummy = (omit?: boolean): NotificationData => {
  const dummyData: NotificationData = {
    type: getRandomType(),
    summary: {
      pending: 'Pending summary',
      completed: 'Completed summary',
      failed: 'Failed summary',
      info: 'Info summary',
    },
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    groupTimestamp: Math.floor(Date.now() / 1000),
    timestamp: Math.floor(Date.now() / 1000),
    promise: new Promise((resolve) => {
      setTimeout(resolve, Math.floor(Math.random() * 30000) + 1000) // Resolve the promise after a random duration between 1 and 30 seconds
    }),
  }

  return dummyData
}

const generateRandomDummyData = (): Omit<NotificationData, 'promise'> => {
  const dummyData: Omit<NotificationData, 'promise'> = {
    type: getRandomType(),
    summary: {
      pending: 'Pending summary',
      completed: 'Completed summary',
      failed: 'Failed summary',
      info: 'Info summary',
    },
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    groupTimestamp: Math.floor(Date.now() / 1000),
    timestamp: Math.floor(Date.now() / 1000),
  }

  return dummyData
}

const test = () => {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-[80vh] max-w-2xl mx-auto">
          <div className="p-6 text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-400">🚫 Development Only</h1>
            <p className="text-gray-400">This debug page is only available in development mode.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="grid grid-flow-col gap-5 min-h-[400px]">
        <Button onClick={() => createToast(genDummy())}>Toast</Button>
        <Button onClick={() => createInlineToast(genDummy())}>Inline</Button>
        <Button onClick={() => createErrorToast('deu pau', true)}>Error</Button>
        <Button onClick={() => createSuccessToast(generateRandomDummyData())}>Sucess</Button>
        <Button onClick={() => createFailedToast(generateRandomDummyData())}>Failed</Button>
        <Button onClick={() => createInfoToast(generateRandomDummyData())}>Info</Button>
      </div>
    </Layout>
  )
}

export default test
