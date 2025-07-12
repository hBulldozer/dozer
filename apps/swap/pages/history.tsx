import React from 'react'
import type { GetStaticProps } from 'next'
import { Layout } from '../components/Layout'
import { HistoryPage } from '../components/HistoryPage'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'

export default function History() {
  return (
    <Layout maxWidth="7xl">
      <HistoryPage />
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  
  // Pre-fetch initial transaction history data
  try {
    await ssg.getPools.getAllTransactionHistory.prefetch({
      count: 50,
    })
  } catch (error) {
    console.error('Error prefetching transaction history:', error)
    // Don't fail the build if prefetch fails
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60, // Revalidate every minute for fresh transaction data
  }
}