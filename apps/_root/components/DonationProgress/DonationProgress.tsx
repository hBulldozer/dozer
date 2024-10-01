import { AppearOnMount, Typography, Dialog, Button } from '@dozer/ui'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DynamicLampContainer = dynamic(() => import('@dozer/ui/aceternity/lamp').then((mod) => mod.LampContainer), {
  ssr: false,
})

export default function DonationProgress() {
  const totalDonations = 50000
  const maxSupply = 100000
  const progress = Math.min(Math.max((totalDonations / maxSupply) * 100, 0), 100)

  return (
    <AppearOnMount className="w-full">
      <DynamicLampContainer className="-mt-12 pt-80">
        <motion.div
          initial={{ opacity: 0.5, y: 350 }}
          whileInView={{ opacity: 1, y: 250 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="flex flex-col items-center justify-center gap-10 px-4 lg:gap-20 lg:px-0"
        >
          <div className="flex flex-col items-center justify-center gap-6 lg:gap-10">
            <Typography
              variant="h1"
              weight={600}
              className="text-2xl font-medium tracking-tight text-center text-transparent lg:text-4xl bg-gradient-to-br from-stone-100 to-stone-200 bg-clip-text md:text-5xl"
            >
              Contribute with Dozer <br /> to build the future of DeFi
            </Typography>
            <Typography variant="sm" className="max-w-2xl text-sm text-center text-neutral-500 lg:text-base">
              We are proud to be a community-driven project, and we are always looking for new contributors to join our
              mission. DZD Token was created to support the growth of Dozer and its community. DZD is a utility token
              that will be used to reward contributors and incentivize the development of Dozer.
            </Typography>
          </div>
          <div className="w-full max-w-[600px]">
            <div className="relative h-[23px] w-full">
              <div className="absolute inset-0 rounded-md bg-[rgba(255,255,255,0.12)] ring-1 ring-yellow-500 "></div>
              <div className="absolute inset-y-0 left-0 overflow-hidden rounded-md" style={{ width: `${progress}%` }}>
                {/* <DynamicBackgroundGradientAnimation
                  gradientBackgroundStart="rgb(146, 64, 14)"
                  gradientBackgroundEnd="rgb(202, 138, 4)"
                  pointerColor="253, 224, 71"
                  containerClassName="rounded-md h-full"
                  className="h-full"
                  interactive={false}
                /> */}
                <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500" />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between mt-2">
              <Typography variant="xs" className="text-center text-neutral-500">
                DZD distributed
              </Typography>
              <Typography variant="xs" className="text-center text-neutral-500">
                {totalDonations.toLocaleString()} / {maxSupply.toLocaleString()}
              </Typography>
            </div>
          </div>
          <CustomDialog />
        </motion.div>
      </DynamicLampContainer>
    </AppearOnMount>
  )
}

function CustomDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const StyledButton = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <Link
      target="_blank"
      className="relative w-full px-4 py-2 text-sm font-medium text-left text-high-emphesis hover:text-white bg-stone-800 hover:bg-white hover:bg-opacity-[0.06] rounded-xl cursor-pointer select-none"
      href={href}
      onMouseEnter={() => setHoveredButton(children as string)}
      onMouseLeave={() => setHoveredButton(null)}
    >
      {children}
      <motion.div
        className="absolute top-0 right-0 flex items-center justify-center h-full pr-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: hoveredButton === children ? 1 : 0, x: hoveredButton === children ? 0 : -10 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRightIcon className="w-3 h-3" color="yellow" />
      </motion.div>
    </Link>
  )

  return (
    <>
      <Button variant="outlined" onClick={() => setIsOpen(true)}>
        Learn about DZD 🚀
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Content className="w-screen max-w-md !pb-4 bg-stone-950">
          <Dialog.Header title="Become one Dozer Backer!  🚀" onClose={() => setIsOpen(false)} />
          <div className="flex flex-col p-6">
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Summary
            </Typography>
            <Typography variant="sm" className="mb-6 text-left text-neutral-500">
              Dozer Donor Tokens (DZD) are a unique solution designed for the Dozer project's prelaunch phase. They
              serve as an innovative alternative to traditional SAFE (Simple Agreement for Future Equity) documents,
              enabling a community-driven fundraising approach while maintaining contributor anonymity.
            </Typography>
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Token Overview
            </Typography>
            <Typography variant="sm" className="text-left text-neutral-500">
              <b>Name</b>: Dozer Donor Tokens (DZD)
              <br />
              <b>Representation</b>: 1 DZD represents 1 USD worth of DZR at our token generation event with most-favored
              nation terms for Dozer valuation <br />
            </Typography>
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t lg:flex-row border-stone-700">
            <StyledButton href="https://explorer.hathor.network/token_balances?sortBy=total&order=desc&token=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d">
              Token Holders
            </StyledButton>
            <StyledButton href="https://explorer.hathor.network/token_detail/0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d">
              Token Info
            </StyledButton>
            <StyledButton href="https://cdn.discordapp.com/attachments/1224059313405034546/1278148160606310500/DZD_Tokenomics.pdf?ex=66f2af7c&is=66f15dfc&hm=0d81a182abf300c8b7d32fcb95d9fd8b202c17159cc244ceab80da37cd547922&">
              Tokenomics
            </StyledButton>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
