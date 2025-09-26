import { FC, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@dozer/ui'

interface AnimatedCardProps {
  icon: string
  title: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  delay?: number
  className?: string
}

const colorVariants = {
  blue: {
    gradient: 'from-blue-500/10 to-blue-600/10',
    border: 'border-blue-500/20',
  },
  green: {
    gradient: 'from-green-500/10 to-green-600/10',
    border: 'border-green-500/20',
  },
  purple: {
    gradient: 'from-purple-500/10 to-blue-600/10',
    border: 'border-purple-500/20',
  },
  yellow: {
    gradient: 'from-yellow-500/10 to-yellow-600/10',
    border: 'border-yellow-500/20',
  },
  red: {
    gradient: 'from-red-500/10 to-red-600/10',
    border: 'border-red-500/20',
  },
}

export const AnimatedCard: FC<AnimatedCardProps> = ({
  icon,
  title,
  description,
  color,
  delay = 0,
  className = ''
}) => {
  const variants = colorVariants[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`text-center space-y-4 p-6 bg-gradient-to-br ${variants.gradient} rounded-xl border ${variants.border} ${className}`}
      whileHover={{ scale: 1.02 }}
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
          delay: delay + 1,
        }}
        className="text-4xl"
      >
        {icon}
      </motion.div>
      <Typography variant="h3" className="text-white font-bold">
        {title}
      </Typography>
      <Typography variant="base" className="text-gray-300">
        {description}
      </Typography>
    </motion.div>
  )
}