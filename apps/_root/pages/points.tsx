import { FC, useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Typography, Button, Widget, classNames } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { api } from '../utils/api'
import { PointsCard, PointsCounter } from '../components/xp'
import { Layout } from '../components/Layout'
import { useAccount } from '@dozer/zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { TrophyIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid'
import { useRealtimePoints } from '../hooks/useRealtimePoints'

interface PointsPageProps {
  userAddress?: string
}

const PointsPage: FC<PointsPageProps> = () => {
  const router = useRouter()
  const { hathorAddress, walletType } = useAccount()
  const { accounts } = useWalletConnectClient()
  const [showCelebration, setShowCelebration] = useState(false)
  const [cachedPointsData, setCachedPointsData] = useState<any>(null)

  // Get the appropriate address based on wallet type
  const userAddress =
    walletType === 'walletconnect'
      ? accounts && accounts.length > 0
        ? accounts[0].split(':')[2]
        : ''
      : hathorAddress || ''

  // Check enrollment status
  const { data: enrollmentData, isLoading: enrollmentLoading } = api.getPoints.checkEnrollment.useQuery(
    { userAddress },
    { enabled: !!userAddress }
  )

  // Fetch user points data
  const { data: pointsData, isLoading: pointsLoading } = api.getPoints.getUserPoints.useQuery(
    { userAddress },
    {
      enabled: !!userAddress && enrollmentData?.isEnrolled,
      onSuccess: (data) => {
        setCachedPointsData(data)
      },
    }
  )

  // Use cached data if available while loading
  const displayPointsData = pointsLoading ? cachedPointsData : pointsData

  // Fetch user rank
  const { data: rankData } = api.getPoints.getUserRank.useQuery(
    { userAddress },
    { enabled: !!userAddress && enrollmentData?.isEnrolled }
  )

  // Enable real-time updates
  const { triggerManualRefresh } = useRealtimePoints(userAddress)

  const calculateTotalPoints = () => {
    if (!displayPointsData) return 0
    return (displayPointsData.volumePoints + displayPointsData.liquidityPoints) * displayPointsData.multiplier // Removed referralPoints
  }

  const totalPoints = calculateTotalPoints()

  // Redirect to onboarding if not enrolled
  useEffect(() => {
    if (userAddress && enrollmentData && !enrollmentData.isEnrolled && !enrollmentLoading) {
      router.push('/onboarding')
    }
  }, [userAddress, enrollmentData, enrollmentLoading, router])

  // Show celebration animation when points increase
  useEffect(() => {
    if (totalPoints > 0) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [totalPoints])

  return (
    <>
      <Head>
        <title>XP Points Dashboard - Dozer Finance</title>
        <meta name="description" content="Track your Dozer Finance XP points and level up your trading experience" />
      </Head>

      <Layout>
        <div className="space-y-12">
          {/* Animated Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block"
            >
              <Typography
                variant="h1"
                className="text-white font-bold text-5xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent"
              >
                XP Points Dashboard
              </Typography>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Typography variant="lg" className="text-gray-400">
                Track your trading performance and level up your Dozer experience
              </Typography>
            </motion.div>
          </motion.div>

          {/* Wallet Connection Status */}
          {!userAddress ? (
            <div className="max-w-md mx-auto text-center">
              <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                <Typography variant="lg" className="text-white font-semibold mb-2">
                  Connect Your Wallet
                </Typography>
                <Typography variant="sm" className="text-gray-400 mb-4">
                  Connect your wallet to view your XP points and start earning rewards
                </Typography>
                <Typography variant="xs" className="text-gray-500">
                  Use the connect button in the header to get started
                </Typography>
              </div>
            </div>
          ) : enrollmentLoading ? (
            <div className="max-w-md mx-auto text-center">
              <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                <Typography variant="lg" className="text-white font-semibold mb-2">
                  Checking Enrollment...
                </Typography>
                <Typography variant="sm" className="text-gray-400">
                  Please wait while we verify your campaign enrollment
                </Typography>
              </div>
            </div>
          ) : null}

          {/* Main Stats Section - Only show when wallet is connected */}
          {userAddress && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                <motion.div
                  className="lg:col-span-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Widget id="total-points" maxWidth="full" className="h-full relative overflow-hidden">
                    {/* Celebration animation overlay */}
                    <AnimatePresence>
                      {showCelebration && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-600/20 z-10"
                        />
                      )}
                    </AnimatePresence>

                    <Widget.Header title="Total XP Points" />
                    <Widget.Content>
                      <div className="flex items-center justify-center py-8 relative z-20">
                        <div className="text-center space-y-6">
                          <motion.div
                            animate={showCelebration ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5 }}
                            className="relative"
                          >
                            <PointsCounter
                              value={totalPoints}
                              size="xl"
                              className={classNames(
                                "transition-opacity duration-300",
                                pointsLoading && cachedPointsData ? "text-gray-400" : "text-yellow-400"
                              )}
                            />
                            {pointsLoading && cachedPointsData && (
                              <div className="absolute top-2 right-2">
                                <div className="w-6 h-6 border-2 border-gray-500 border-t-yellow-400 rounded-full animate-spin"></div>
                              </div>
                            )}
                          </motion.div>
                          <Typography variant="lg" className="text-gray-400">
                            Total Points Earned
                          </Typography>
                          {rankData && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 1.0 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <TrophyIcon className="w-5 h-5 text-yellow-400" />
                                <Typography variant="base" className="text-white font-semibold">
                                  Rank #{rankData.rank?.toLocaleString() || 'N/A'}
                                </Typography>
                              </div>
                              <Typography variant="sm" className="text-gray-500">
                                out of {rankData.totalUsers?.toLocaleString() || 0} users
                              </Typography>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </Widget.Content>
                  </Widget>
                </motion.div>

                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ duration: 0.2 }}>
                    <PointsCard
                      title="Volume Points"
                      points={pointsData?.volumePoints || 0}
                      icon={<span>📊</span>}
                      color="blue"
                      subtitle="From trading volume"
                      isLoading={pointsLoading}
                      cachedPoints={cachedPointsData?.volumePoints}
                    />
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ duration: 0.2 }}>
                    <PointsCard
                      title="Liquidity Points"
                      points={pointsData?.liquidityPoints || 0}
                      icon={<span>💧</span>}
                      color="green"
                      subtitle="From providing liquidity"
                      isLoading={pointsLoading}
                      cachedPoints={cachedPointsData?.liquidityPoints}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <motion.div
                    className="p-8 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-2xl border border-yellow-500/20 backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center space-y-4">
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="text-4xl"
                      >
                        ⚡
                      </motion.div>
                      <Typography variant="h3" className="text-white font-bold">
                        Current Multiplier
                      </Typography>
                      <motion.div
                        className="relative"
                        animate={showCelebration ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <div
                          className={classNames(
                            "text-4xl font-bold transition-opacity duration-300",
                            pointsLoading && cachedPointsData ? "text-gray-400" : "text-yellow-400"
                          )}
                        >
                          {(pointsLoading && cachedPointsData ? cachedPointsData?.multiplier : pointsData?.multiplier) || 1.0}x
                        </div>
                        {pointsLoading && cachedPointsData && (
                          <div className="absolute top-1 right-1">
                            <div className="w-4 h-4 border-2 border-gray-500 border-t-yellow-400 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </motion.div>
                      <Typography variant="sm" className="text-gray-400">
                        Base multiplier for all points
                      </Typography>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Recent Activity */}
              <Widget id="recent-activity" maxWidth="full">
                <Widget.Header title="Recent Trading Activity" />
                <Widget.Content>
                  {pointsData?.recentTransactions && pointsData.recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {pointsData.recentTransactions.map(
                        (
                          tx: {
                            transactionHash: string
                            pointsAwarded: number
                            volumeUSD: number
                            transactionType: string
                          },
                          _index: number
                        ) => {
                          const getTransactionLabel = (type: string) => {
                            switch (type) {
                              case 'swap':
                                return 'Swap Transaction'
                              case 'add_liquidity':
                                return 'Add Liquidity'
                              case 'remove_liquidity':
                                return 'Remove Liquidity'
                              case 'bridge':
                                return 'Bridge Transaction'
                              default:
                                return 'Transaction'
                            }
                          }

                          const isBridge = tx.transactionType === 'bridge'

                          return (
                            <div
                              key={tx.transactionHash}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isBridge
                                  ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30'
                                  : 'bg-gray-800/30 border-gray-700'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Typography variant="sm" className="text-white font-medium">
                                    {getTransactionLabel(tx.transactionType)}
                                  </Typography>
                                </div>
                                <Typography variant="xs" className="text-gray-400 font-mono">
                                  {tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-8)}
                                </Typography>
                              </div>
                              <div className="text-right">
                                <Typography
                                  variant="sm"
                                  className={`font-medium ${isBridge ? 'text-blue-300' : 'text-blue-300'}`}
                                >
                                  +{tx.pointsAwarded.toLocaleString()} points
                                </Typography>
                                <Typography variant="xs" className="text-gray-500">
                                  ${tx.volumeUSD.toFixed(2)} volume
                                </Typography>
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Typography variant="sm" className="text-gray-400">
                        No trading activity yet
                      </Typography>
                      <Typography variant="xs" className="text-gray-500 mt-1">
                        Start trading to earn volume points!
                      </Typography>
                    </div>
                  )}
                </Widget.Content>
              </Widget>

              {/* Animated Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.6 }}
              >
                <Widget id="points-info" maxWidth="full">
                  <Widget.Header title="How to Earn Points" />
                  <Widget.Content>
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div
                          className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            animate={{
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="text-4xl"
                          >
                            📊
                          </motion.div>
                          <Typography variant="h3" className="text-white font-bold">
                            Trading Volume
                          </Typography>
                          <Typography variant="base" className="text-gray-300">
                            Earn 1 point for every $1 traded
                          </Typography>
                        </motion.div>
                        <motion.div
                          className="text-center space-y-4 p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            animate={{
                              rotate: [0, -5, 5, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 1.5,
                            }}
                            className="text-4xl"
                          >
                            💧
                          </motion.div>
                          <Typography variant="h3" className="text-white font-bold">
                            Providing Liquidity
                          </Typography>
                          <Typography variant="base" className="text-gray-300">
                            Earn 1 point per $10 liquidity per day
                          </Typography>
                        </motion.div>
                        <motion.div
                          className="text-center space-y-4 p-6 bg-gradient-to-br from-purple-500/10 to-blue-600/10 rounded-xl border border-purple-500/20"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            animate={{
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.15, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 3.0,
                            }}
                            className="text-4xl"
                          >
                            🌉
                          </motion.div>
                          <Typography variant="h3" className="text-white font-bold">
                            Bridge
                          </Typography>
                          <Typography variant="base" className="text-gray-300">
                            Earn 2 points for every $1 bridged
                          </Typography>
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 2.0 }}
                        className="border-t border-gray-700 pt-6"
                      >
                        <Typography variant="base" className="text-center text-gray-300">
                          Start trading and providing liquidity to earn XP points and climb the leaderboard!
                        </Typography>
                      </motion.div>
                    </div>
                  </Widget.Content>
                </Widget>
              </motion.div>
            </>
          )}

          {/* Animated Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                as="a"
                href="/leaderboard"
                variant="filled"
                color="yellow"
                className="text-stone-800 px-8 py-4 text-lg font-semibold"
              >
                <TrophyIcon className="w-5 h-5 mr-2" />
                View Leaderboard
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                as="a"
                href="/swap"
                variant="filled"
                color="yellow"
                className="text-stone-800 px-8 py-4 text-lg font-semibold"
              >
                <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                Start Trading
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // In a real implementation, you would get the user address from:
  // - Wallet connection state
  // - URL parameters
  // - Authentication context

  const userAddress = context.query.address as string

  return {
    props: {
      userAddress: userAddress || null,
    },
  }
}

export default PointsPage
