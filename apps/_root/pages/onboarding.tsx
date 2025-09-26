import { FC, useState } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Typography, Button, Widget, classNames } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { api } from '../utils/api'
import { PointsCard, AnimatedCard } from '../components/xp'
import { Layout } from '../components/Layout'
import { useAccount } from '@dozer/zustand'
import { motion } from 'framer-motion'
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/solid'

interface OnboardingPageProps {
  userAddress?: string
}

type OnboardingStep = 'welcome' | 'complete'

const OnboardingPage: FC<OnboardingPageProps> = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const { hathorAddress, walletType } = useAccount()
  const { accounts } = useWalletConnectClient()

  // Get the appropriate address based on wallet type
  const walletAddress =
    walletType === 'walletconnect'
      ? accounts && accounts.length > 0
        ? accounts[0].split(':')[2]
        : ''
      : hathorAddress || ''

  // Create user points record mutation using dedicated enrollment endpoint
  const enrollUserMutation = api.getPoints.enrollUser.useMutation({
    onSuccess: () => {
      setCurrentStep('complete')
    },
  })

  // Progress indicator
  const progressSteps = [
    { id: 'connect', label: 'Connect Wallet', completed: !!walletAddress },
    { id: 'join', label: 'Join Campaign', completed: currentStep === 'complete' },
    { id: 'start', label: 'Start Trading', completed: false },
  ]

  const handleJoinCampaign = async () => {
    if (!walletAddress) return

    try {
      // Enroll user using dedicated enrollment endpoint
      await enrollUserMutation.mutateAsync({
        userAddress: walletAddress,
      })
    } catch (error) {
      console.error('Failed to join campaign:', error)
    }
  }

  const handleStartTrading = () => {
    router.push('/swap')
  }

  const handleViewPoints = () => {
    router.push('/points')
  }

  if (!walletAddress) {
    return (
      <>
        <Head>
          <title>Connect Wallet - Dozer Finance XP Points</title>
          <meta name="description" content="Connect your wallet to join the Dozer Finance XP points campaign" />
        </Head>

        <Layout maxWidth="4xl">
          <div className="space-y-12">
            {/* Animated Header */}
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
                  Welcome to Dozer XP Points! 🎉
                </Typography>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
                <Typography variant="lg" className="text-gray-400">
                  Connect your wallet to start earning XP points for trading
                </Typography>
              </motion.div>
            </motion.div>

            {/* Animated Connect Wallet Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-lg mx-auto"
            >
              <div className="relative p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                {/* Animated background glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl"
                />

                <div className="relative z-10 text-center space-y-6">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-6xl"
                  >
                    🔗
                  </motion.div>

                  <div className="space-y-4">
                    <Typography variant="h3" className="text-white font-bold">
                      Connect Your Wallet
                    </Typography>
                    <Typography variant="base" className="text-gray-300">
                      Use the connect button in the header to connect your wallet and start earning XP points
                    </Typography>
                    <Typography variant="sm" className="text-gray-500">
                      Once connected, you'll be able to join the campaign and start earning points for trading
                    </Typography>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Layout>
      </>
    )
  }

  if (currentStep === 'complete') {
    return (
      <>
        <Head>
          <title>Welcome to Dozer Finance XP Points - Complete</title>
          <meta name="description" content="You've successfully joined the Dozer Finance XP points campaign" />
        </Head>

        <Layout maxWidth="4xl">
          <div className="space-y-12">
            {/* Animated Success Header with Confetti */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-8xl"
              >
                🎉
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Typography
                  variant="h1"
                  className="text-white font-bold text-5xl bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent"
                >
                  Welcome to the Campaign!
                </Typography>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
                <Typography variant="lg" className="text-gray-400">
                  You're now part of the Dozer Finance XP points system
                </Typography>
              </motion.div>
            </motion.div>

            {/* Animated Success Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="transform transition-all duration-300"
              >
                <PointsCard
                  title="Your Status"
                  points={0}
                  icon={<span>👤</span>}
                  color="blue"
                  subtitle="Registered and ready to earn"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="transform transition-all duration-300"
              >
                <PointsCard
                  title="Next Steps"
                  points={1}
                  icon={<span>🚀</span>}
                  color="green"
                  subtitle="Start trading to earn points"
                />
              </motion.div>
            </motion.div>

            {/* Animated Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleStartTrading}
                  variant="filled"
                  color="yellow"
                  className="text-stone-800 px-8 py-4 text-lg font-semibold"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Start Trading
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleViewPoints}
                  variant="filled"
                  color="gray"
                  className="px-8 py-4 text-lg font-semibold"
                >
                  View My Points
                </Button>
              </motion.div>
            </motion.div>

            {/* Animated Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              <Widget id="campaign-info" maxWidth="full">
                <Widget.Header title="How to Earn Points" />
                <Widget.Content>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <AnimatedCard
                        icon="📊"
                        title="Trading Volume"
                        description="Earn 1 point for every $1 traded"
                        color="blue"
                        delay={0.2}
                      />
                      <AnimatedCard
                        icon="💧"
                        title="Providing Liquidity"
                        description="Earn 1 point per $10 USD per day"
                        color="green"
                        delay={0.4}
                      />
                      <AnimatedCard
                        icon="🌉"
                        title="Bridge"
                        description="Earn 2 points for every $1 USD bridged"
                        color="purple"
                        delay={0.6}
                      />
                    </div>
                  </div>
                </Widget.Content>
              </Widget>
            </motion.div>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Welcome to Dozer Finance XP Points - Onboarding</title>
        <meta name="description" content="Get started with Dozer Finance XP points system and start earning rewards" />
      </Head>

      <Layout maxWidth="4xl">
        <div className="space-y-12">
          {/* Animated Header */}
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
                Welcome to Dozer XP Points! 🎉
              </Typography>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Typography variant="lg" className="text-gray-400">
                Join the campaign and start earning XP points for trading
              </Typography>
            </motion.div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between mb-4">
              {progressSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.2 }}
                    className={classNames(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                      step.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-400'
                    )}
                  >
                    {step.completed ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 + index * 0.2 }}
                    className="ml-3"
                  >
                    <Typography
                      variant="sm"
                      className={classNames('font-medium', step.completed ? 'text-green-400' : 'text-gray-400')}
                    >
                      {step.label}
                    </Typography>
                  </motion.div>
                  {index < progressSteps.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 + index * 0.2 }}
                      className={classNames(
                        'flex-1 h-0.5 mx-4 transition-colors duration-300',
                        step.completed ? 'bg-green-500' : 'bg-gray-600'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Animated Wallet Status */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-lg mx-auto"
          >
            <div className="relative p-8 bg-gradient-to-br from-green-800/20 to-green-900/20 rounded-2xl border border-green-700/50 backdrop-blur-sm">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl"
              />

              <div className="relative z-10 text-center space-y-4">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-5xl"
                >
                  ✅
                </motion.div>

                <Typography variant="h3" className="text-white font-bold">
                  Wallet Connected
                </Typography>
                <Typography variant="base" className="text-gray-300 font-mono">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </Typography>
              </div>
            </div>
          </motion.div>

          {/* Animated Join Campaign Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleJoinCampaign}
                variant="filled"
                color="yellow"
                className="text-stone-800 px-12 py-4 text-lg font-semibold"
                disabled={enrollUserMutation.isLoading}
              >
                {enrollUserMutation.isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 mr-2"
                  >
                    ⚡
                  </motion.div>
                ) : (
                  <SparklesIcon className="w-5 h-5 mr-2" />
                )}
                {enrollUserMutation.isLoading ? 'Joining Campaign...' : 'Join XP Points Campaign'}
              </Button>
            </motion.div>
          </motion.div>

          {/* Animated Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            <Widget id="campaign-info" maxWidth="full">
              <Widget.Header title="About XP Points" />
              <Widget.Content>
                <div className="space-y-8">
                  <Typography variant="base" className="text-gray-300 text-center">
                    XP Points are earned by trading and providing liquidity on Dozer Finance. The more you trade and
                    provide liquidity, the more points you earn!
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
                      description="Earn 1 point per $10 liquidity per day"
                      color="green"
                      delay={0.4}
                    />
                    <AnimatedCard
                      icon="🌉"
                      title="Bridge"
                      description="Earn 2 points for every $1 USD bridged"
                      color="purple"
                      delay={0.6}
                    />
                  </div>
                </div>
              </Widget.Content>
            </Widget>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userAddress = context.query.address as string

  return {
    props: {
      userAddress: userAddress || null,
    },
  }
}

export default OnboardingPage
