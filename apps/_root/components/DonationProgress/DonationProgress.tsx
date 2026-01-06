import { AppearOnMount, Typography, Dialog, Button } from '@dozer/ui'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowRightIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DynamicLampContainer = dynamic(() => import('@dozer/ui/aceternity/lamp').then((mod) => mod.LampContainer), {
  ssr: false,
})

export default function DonationProgress() {
  const [totalDonations, setTotalDonations] = useState(0)
  const maxSupply = 100000
  const progress = Math.min(Math.max((totalDonations / maxSupply) * 100, 0), 100)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchDonationData() {
      try {
        const response = await fetch(
          'explorer-service/node_api/token?id=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'
        )
        const data = await response.json()
        if (data.success) {
          setTotalDonations(Math.floor(data.total / 100))
        }
      } catch (error) {
        setTotalDonations(17800)
        console.error('Error fetching donation data:', error)
      }
    }

    fetchDonationData()
  }, [])

  return (
    <AppearOnMount className="w-full">
      <DynamicLampContainer className=" pt-80">
        <motion.div
          initial={{ opacity: 0.5, y: 350 }}
          whileInView={{ opacity: 1, y: 250 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="flex flex-col items-center justify-center gap-3 px-4 lg:gap-8 lg:px-0"
        >
          <div className="flex flex-col items-center justify-center gap-1 lg:gap-1">
            <Typography
              variant="h1"
              weight={600}
              className="pb-2 text-2xl font-medium tracking-tight text-center text-transparent lg:text-5xl bg-gradient-to-br from-stone-100 to-stone-200 bg-clip-text md:text-5xl"
            >
              Contribute with Dozer <br /> building the future of DeFi
            </Typography>
          </div>
          <div className="w-full max-w-[600px] ">
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
                <div className="h-full bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500" />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between mt-2">
              <Typography variant="sm" className="text-center text-neutral-200">
                DZD distributed
              </Typography>
              <Typography variant="sm" className="text-center text-neutral-200">
                {totalDonations.toLocaleString()} / {maxSupply.toLocaleString()}
              </Typography>
            </div>
          </div>
          <Typography variant="sm" className="max-w-2xl text-sm text-center text-neutral-300 lg:text-base">
            We are proud to be a community-driven project. DZD Token was created to support the growth of Dozer and its
            community. DZD is a utility token that will be used to log contribututions and incentivize the development
            of Dozer. <LearnMoreButton onClick={() => setIsOpen(true)} />
          </Typography>
          <Link href="https://forms.gle/8cEKvsaNrTP4c8Ef6" target="_blank" className="p-[3px] relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-600 to-yellow-500" />
            <div className="px-8 py-2  bg-black rounded-[6px] text-xl  relative group transition duration-200 text-white hover:bg-transparent">
              JOIN NOW
            </div>
          </Link>

          <CustomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
        </motion.div>
      </DynamicLampContainer>
    </AppearOnMount>
  )
}

function LearnMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="inline-flex pl-2 -my-3"
      variant="empty"
      endIcon={<ChevronRightIcon width={16} height={16} />}
    >
      Learn More
    </Button>
  )
}

function CustomDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
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
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Content className="w-screen max-w-md !pb-4 bg-stone-950">
          <Dialog.Header title="Become a Dozer Backer!  🚀" onClose={() => setIsOpen(false)} />
          <div className="flex flex-col p-6">
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Summary
            </Typography>
            <Typography variant="sm" className="mb-6 text-left text-neutral-300">
              Dozer Donor Token (DZD) is an unique solution designed for the Dozer&apos;s prelaunch phase. They enable a
              community-driven funding approach before DZR TGE.
            </Typography>
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Token Overview
            </Typography>
            <Typography variant="sm" className="text-left text-neutral-300">
              <b>Name</b>: Dozer Donor Tokens (DZD)
              <br />
              <b>Representation</b>: 1 DZD represents 1 USD worth donated
              <br />
            </Typography>
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t lg:flex-row border-stone-700">
            <StyledButton href="https://explorer.hathor.network/token_balances?sortBy=total&order=desc&token=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d">
              Token Holders
            </StyledButton>
            <StyledButton href="https://explorer.hathor.network/token_detail/0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d">
              Token Info
            </StyledButton>
            <StyledButton href="https://supabase.dozer.finance/storage/v1/object/public/PDF/DZD%20Tokenomics.pdf">
              Tokenomics
            </StyledButton>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
