import { FC, useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Typography, Button, Widget } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { api } from '../utils/api'
import { LeaderboardTable, PointsCounter, AnimatedCard } from '../components/xp'
import { Layout } from '../components/Layout'
import { useAccount } from '@dozer/zustand'
import { motion } from 'framer-motion'

interface LeaderboardPageProps {
  userAddress?: string
}

type Period = 'weekly' | 'all'

const LeaderboardPage: FC<LeaderboardPageProps> = () => {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all')
  const [offset, setOffset] = useState(0)
  const [allData, setAllData] = useState<
    Array<{
      rank: number
      userAddress: string
      totalPoints: number
      volumePoints: number
      liquidityPoints: number
      multiplier: number
      updatedAt: Date
    }>
  >([])
  const { hathorAddress, walletType } = useAccount()
  const { accounts } = useWalletConnectClient()

  // Get the appropriate address based on wallet type
  const userAddress =
    walletType === 'walletconnect' ? (accounts && accounts.length > 0 ? accounts[0].split(':')[2] : '') : hathorAddress || ''

  const limit = 25

  // Check enrollment status
  const { data: enrollmentData, isLoading: enrollmentLoading } = api.getPoints.checkEnrollment.useQuery(
    { userAddress },
    { enabled: !!userAddress }
  )

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = api.getPoints.getLeaderboard.useQuery(
    {
      limit,
      offset,
      period: selectedPeriod,
    },
    {
      enabled: !!userAddress && enrollmentData?.isEnrolled,
      onSuccess: (newData) => {
        if (offset === 0) {
          setAllData(newData.leaderboard)
        } else {
          setAllData((prev) => [...prev, ...newData.leaderboard])
        }
      },
    }
  )

  // Redirect to onboarding if not enrolled
  useEffect(() => {
    if (userAddress && enrollmentData && !enrollmentData.isEnrolled && !enrollmentLoading) {
      router.push('/onboarding')
    }
  }, [userAddress, enrollmentData, enrollmentLoading, router])

  // Fetch user's rank if address is provided
  const { data: userRankData } = api.getPoints.getUserRank.useQuery({ userAddress }, { enabled: !!userAddress })

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period)
    setOffset(0)
    setAllData([])
  }

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit)
  }

  const periodLabels = {
    weekly: 'Last 7 Days',
    all: 'All Time',
  }

  // Add id field to data for table compatibility
  const processedData = allData.map((item) => ({
    ...item,
    id: `leaderboard-${item.rank}-${item.userAddress}`,
  }))

  const topThree = processedData.slice(0, 3)

  return (
    <>
      <Head>
        <title>Leaderboard - Dozer Finance XP Points</title>
        <meta name="description" content="View the top traders and liquidity providers on Dozer Finance" />
      </Head>

      <Layout maxWidth="6xl">
        <div className="space-y-8">
          {/* Animated Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Typography variant="h1" className="text-white font-bold">
                XP Points Leaderboard
              </Typography>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Typography variant="lg" className="text-gray-400">
                See how you rank against other traders and liquidity providers
              </Typography>
            </motion.div>
          </motion.div>

          {/* Animated Period Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {(Object.keys(periodLabels) as Period[]).map((period, index) => (
              <motion.div
                key={period}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant={selectedPeriod === period ? 'filled' : 'outlined'}
                  color={selectedPeriod === period ? 'yellow' : 'gray'}
                  onClick={() => handlePeriodChange(period)}
                  className={selectedPeriod === period ? 'text-stone-800' : ''}
                >
                  {periodLabels[period]}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated User's Rank Card (if logged in) */}
          {userAddress && userRankData && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <Widget id="user-rank" maxWidth="full">
                <Widget.Header title="Your Ranking" />
                <Widget.Content>
                  <div className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30"
                        >
                          <Typography variant="lg" className="text-blue-300 font-bold">
                            #{userRankData.rank}
                          </Typography>
                        </motion.div>
                        <div>
                          <Typography variant="base" className="text-white font-semibold">
                            Your Address
                          </Typography>
                          <Typography variant="sm" className="text-gray-400 font-mono">
                            {userAddress.slice(0, 8)}...{userAddress.slice(-8)}
                          </Typography>
                        </div>
                      </div>
                      <div className="text-right">
                        <PointsCounter value={userRankData.totalPoints || 0} size="lg" className="text-blue-400" />
                        <Typography variant="sm" className="text-gray-400">
                          Total Points
                        </Typography>
                      </div>
                    </div>
                  </div>
                </Widget.Content>
              </Widget>
            </motion.div>
          )}

          {/* Animated Top 3 Podium */}
          {topThree.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Second Place */}
              {topThree[1] && (
                <div className="order-1 md:order-1">
                  <Widget id="second-place" maxWidth="full" className="h-full">
                    <Widget.Content>
                      <div className="text-center py-8">
                        <div className="space-y-4">
                          <div className="text-4xl">🥈</div>
                          <Typography variant="h3" className="text-gray-300 font-bold">
                            #{topThree[1].rank}
                          </Typography>
                          <div className="w-16 h-16 mx-auto bg-gray-400/20 rounded-full flex items-center justify-center border border-gray-400/30">
                            <Typography variant="lg" className="text-gray-300 font-bold">
                              {topThree[1].userAddress.slice(0, 2).toUpperCase()}
                            </Typography>
                          </div>
                          <Typography variant="sm" className="text-gray-400 font-mono">
                            {topThree[1].userAddress.slice(0, 8)}...{topThree[1].userAddress.slice(-8)}
                          </Typography>
                          <PointsCounter value={topThree[1].totalPoints} size="lg" className="text-gray-300" />
                        </div>
                      </div>
                    </Widget.Content>
                  </Widget>
                </div>
              )}

              {/* First Place */}
              {topThree[0] && (
                <div className="order-2 md:order-2">
                  <Widget id="first-place" maxWidth="full" className="h-full transform scale-105">
                    <Widget.Content>
                      <div className="text-center py-8">
                        <div className="space-y-4">
                          <div className="text-5xl">🥇</div>
                          <Typography variant="h3" className="text-yellow-300 font-bold">
                            #{topThree[0].rank}
                          </Typography>
                          <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500/30">
                            <Typography variant="h3" className="text-yellow-300 font-bold">
                              {topThree[0].userAddress.slice(0, 2).toUpperCase()}
                            </Typography>
                          </div>
                          <Typography variant="sm" className="text-gray-400 font-mono">
                            {topThree[0].userAddress.slice(0, 8)}...{topThree[0].userAddress.slice(-8)}
                          </Typography>
                          <PointsCounter value={topThree[0].totalPoints} size="xl" className="text-yellow-400" />
                          <Typography variant="sm" className="text-yellow-400 font-semibold">
                            👑 Current Champion
                          </Typography>
                        </div>
                      </div>
                    </Widget.Content>
                  </Widget>
                </div>
              )}

              {/* Third Place */}
              {topThree[2] && (
                <div className="order-3 md:order-3">
                  <Widget id="third-place" maxWidth="full" className="h-full">
                    <Widget.Content>
                      <div className="text-center py-8">
                        <div className="space-y-4">
                          <div className="text-4xl">🥉</div>
                          <Typography variant="h3" className="text-amber-600 font-bold">
                            #{topThree[2].rank}
                          </Typography>
                          <div className="w-16 h-16 mx-auto bg-amber-600/20 rounded-full flex items-center justify-center border border-amber-600/30">
                            <Typography variant="lg" className="text-amber-600 font-bold">
                              {topThree[2].userAddress.slice(0, 2).toUpperCase()}
                            </Typography>
                          </div>
                          <Typography variant="sm" className="text-gray-400 font-mono">
                            {topThree[2].userAddress.slice(0, 8)}...{topThree[2].userAddress.slice(-8)}
                          </Typography>
                          <PointsCounter value={topThree[2].totalPoints} size="lg" className="text-amber-600" />
                        </div>
                      </div>
                    </Widget.Content>
                  </Widget>
                </div>
              )}
            </motion.div>
          )}

          {/* Animated Full Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <Widget id="full-leaderboard" maxWidth="full">
              <Widget.Header title={`Full Leaderboard - ${periodLabels[selectedPeriod]}`} />
              <Widget.Content>
                <LeaderboardTable
                  data={allData}
                  isLoading={isLoading}
                  currentUserAddress={userAddress}
                  onLoadMore={handleLoadMore}
                  hasMore={leaderboardData?.hasMore || false}
                />
              </Widget.Content>
            </Widget>
          </motion.div>

          {/* How to Earn Points Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <Widget id="how-to-earn" maxWidth="full">
              <Widget.Header title="How to Earn Points & Climb the Leaderboard" />
              <Widget.Content>
                <div className="space-y-8">
                  <Typography variant="base" className="text-gray-300 text-center">
                    Compete with other traders and liquidity providers to climb the rankings
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <AnimatedCard
                      icon="📊"
                      title="Trading Volume"
                      description="Earn 1 point for every $1 USD traded"
                      color="blue"
                      delay={0.2}
                    />
                    <AnimatedCard
                      icon="💧"
                      title="Providing Liquidity"
                      description="Earn 1 point per $10 USD liquidity per day"
                      color="green"
                      delay={0.4}
                    />
                    <AnimatedCard
                      icon="🌉"
                      title="Bridge Transactions"
                      description="Earn 2 points for every $1 USD bridged"
                      color="purple"
                      delay={0.6}
                    />
                  </div>
                </div>
              </Widget.Content>
            </Widget>
          </motion.div>

          {/* Animated Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-center space-y-4"
          >
            <Typography variant="h3" className="text-white font-semibold">
              Ready to Climb the Leaderboard?
            </Typography>
            <Typography variant="base" className="text-gray-400">
              Start trading and providing liquidity to earn XP points and move up the rankings!
            </Typography>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button as="a" href="/swap" variant="filled" color="yellow" className="text-stone-800">
                  Start Trading
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button as="a" href="/points" variant="filled" color="yellow" className="text-stone-800">
                  View My Points
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // In a real implementation, you would get the user address from:
  // - Wallet connection state
  // - Authentication context
  // - Session data

  const userAddress = context.query.address as string

  return {
    props: {
      userAddress: userAddress || null,
    },
  }
}

export default LeaderboardPage
