import { AppearOnMount, Typography } from '@dozer/ui'
import { BackgroundGradientAnimation } from '@dozer/ui/aceternity/ui/background-gradient-animation'
import { LampContainer } from '@dozer/ui/aceternity/ui/lamp'
import { motion } from 'framer-motion'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from '@dozer/ui/aceternity/ui/animated-modal'

export default function DonationProgress() {
  const totalDonations = 50000
  const maxSupply = 100000
  const progress = Math.min(Math.max((totalDonations / maxSupply) * 100, 0), 100)

  return (
    <AppearOnMount className="w-full">
      <LampContainer className="-mt-12 pt-80">
        <motion.div
          initial={{ opacity: 0.5, y: 350 }}
          whileInView={{ opacity: 1, y: 250 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="flex flex-col items-center justify-center gap-20"
        >
          <div className="flex flex-col items-center justify-center gap-10">
            <Typography
              variant="h1"
              weight={600}
              className="text-4xl font-medium tracking-tight text-center text-transparent bg-gradient-to-br from-stone-100 to-stone-200 bg-clip-text md:text-7xl"
            >
              Contribute with Dozer <br /> to build the future of DeFi
            </Typography>
            <Typography variant="sm" className="max-w-2xl text-center text-neutral-500">
              We are proud to be a community-driven project, and we are always looking for new contributors to join our
              mission. DZD Token was created to support the growth of Dozer and its community. DZD is a utility token
              that will be used to reward contributors and incentivize the development of Dozer.
            </Typography>
          </div>
          <div className="w-full max-w-[600px]">
            <div className="relative h-[23px] w-full">
              {/* Background */}
              <div className="absolute inset-0 rounded-md bg-[rgba(255,255,255,0.12)]"></div>
              {/* Progress */}
              <div className="absolute inset-y-0 left-0 overflow-hidden rounded-md" style={{ width: `${progress}%` }}>
                <BackgroundGradientAnimation
                  gradientBackgroundStart="rgb(146, 64, 14)"
                  gradientBackgroundEnd="rgb(202, 138, 4)"
                  pointerColor="253, 224, 71"
                  containerClassName="rounded-md h-full"
                  className="h-full"
                  interactive={false}
                />
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
          <AnimatedModal />
        </motion.div>
      </LampContainer>
    </AppearOnMount>
  )
}

function AnimatedModal() {
  return (
    <div className="flex items-center justify-center -mt-10">
      <Modal>
        <ModalTrigger className="flex justify-center text-white bg-black dark:bg-white dark:text-black group/modal-btn">
          <span className="text-center transition duration-500 group-hover/modal-btn:translate-x-40">
            Learn about DZD
          </span>
          <div className="absolute inset-0 z-20 flex items-center justify-center text-white transition duration-500 -translate-x-40 group-hover/modal-btn:translate-x-0">
            🚀
          </div>
        </ModalTrigger>
        <ModalBody>
          <ModalContent>
            <h4 className="mb-8 text-lg font-bold text-center md:text-2xl text-neutral-600 dark:text-neutral-100">
              Book your trip to{' '}
              <span className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 border border-gray-200">
                Bali
              </span>{' '}
              now! ✈️
            </h4>
            <div className="flex items-center justify-center"></div>
          </ModalContent>
          <ModalFooter className="gap-4">
            <button className="px-2 py-1 text-sm text-black bg-gray-200 border border-gray-300 rounded-md dark:bg-black dark:border-black dark:text-white w-28">
              Cancel
            </button>
            <button className="px-2 py-1 text-sm text-white bg-black border border-black rounded-md dark:bg-white dark:text-black w-28">
              Book Now
            </button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </div>
  )
}
