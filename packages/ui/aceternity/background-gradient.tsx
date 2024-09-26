import classnames from 'classnames'
import React from 'react'
import { motion } from 'framer-motion'

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  animate?: boolean
}) => {
  const variants = {
    initial: {
      backgroundPosition: '0 50%',
    },
    animate: {
      backgroundPosition: ['0, 50%', '100% 50%', '0 50%'],
    },
  }
  return (
    <div className={classnames('relative p-[4px] group', containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: 'reverse',
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? '400% 400%' : undefined,
        }}
        className={classnames(
          'absolute inset-0 rounded-md z-[1] opacity-60 group-hover:opacity-100 blur-md  transition duration-500 will-change-transform',
          ' bg-[radial-gradient(circle_farthest-side_at_0_100%,#facc15,transparent),radial-gradient(circle_farthest-side_at_100%_0,#eab308,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#facc15,#141316)]'
        )}
      />
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: 'reverse',
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? '400% 400%' : undefined,
        }}
        className={classnames(
          'absolute inset-0 rounded-md z-[1] will-change-transform',
          'bg-[radial-gradient(circle_farthest-side_at_0_100%,#1c1c1c,transparent),radial-gradient(circle_farthest-side_at_100%_0,#1c1c1c,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#1c1c1c,transparent),radial-gradient(circle_farthest-side_at_0_0,#1c1c1c,#1c1c1c)]'
        )}
      />

      <div className={classnames('relative z-10', className)}>{children}</div>
    </div>
  )
}
