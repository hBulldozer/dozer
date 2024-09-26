import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CanvasRevealEffect } from '@dozer/ui'

export default function Features() {
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full gap-4 px-8 py-20 mx-auto bg-white lg:flex-row dark:bg-black">
        <Card title="Sheetal is Nisha" icon={<AceternityIcon />}>
          <CanvasRevealEffect animationSpeed={5.1} containerClassName="bg-emerald-900" />
        </Card>
        <Card title="Nisha is Munni" icon={<AceternityIcon />}>
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-black"
            colors={[
              [236, 72, 153],
              [232, 121, 249],
            ]}
            dotSize={2}
          />
          {/* Radial gradient for the cute fade */}
          <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50 dark:bg-black/90" />
        </Card>
        <Card title="Munni is Aditi" icon={<AceternityIcon />}>
          <CanvasRevealEffect animationSpeed={3} containerClassName="bg-sky-600" colors={[[125, 211, 252]]} />
        </Card>
      </div>
    </>
  )
}

const Card = ({ title, icon, children }: { title: string; icon: React.ReactNode; children?: React.ReactNode }) => {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-black/[0.2] group/canvas-card flex items-center justify-center dark:border-white/[0.2]  max-w-sm w-full mx-auto p-4 relative h-[30rem] relative"
    >
      <Icon className="absolute w-6 h-6 text-black -top-3 -left-3 dark:text-white" />
      <Icon className="absolute w-6 h-6 text-black -bottom-3 -left-3 dark:text-white" />
      <Icon className="absolute w-6 h-6 text-black -top-3 -right-3 dark:text-white" />
      <Icon className="absolute w-6 h-6 text-black -bottom-3 -right-3 dark:text-white" />

      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 w-full h-full">
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <div className="flex items-center justify-center w-full mx-auto text-center transition duration-200 group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0">
          {icon}
        </div>
        <h2 className="relative z-10 mt-4 text-xl font-bold text-black transition duration-200 opacity-0 dark:text-white group-hover/canvas-card:opacity-100 group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2">
          {title}
        </h2>
      </div>
    </div>
  )
}

const AceternityIcon = () => {
  return (
    <svg
      width="66"
      height="65"
      viewBox="0 0 66 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 text-black dark:text-white group-hover/canvas-card:text-white "
    >
      <path
        d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
        stroke="currentColor"
        strokeWidth="15"
        strokeMiterlimit="3.86874"
        strokeLinecap="round"
        style={{ mixBlendMode: 'darken' }}
      />
    </svg>
  )
}

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  )
}
