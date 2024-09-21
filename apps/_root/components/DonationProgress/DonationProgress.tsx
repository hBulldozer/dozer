import { ProgressBar, ProgressColor } from '@dozer/ui'
import { BackgroundGradient } from '@dozer/ui/aceternity/ui/background-gradient'

export default function DonationProgress() {
  const totalDonations = 75000
  const maxSupply = 100000
  const progress = (totalDonations / maxSupply) * 100
  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <ProgressBar progress={progress} color={ProgressColor.YELLOW} />
        <BackgroundGradient className="object-cover object-left-top w-full h-full" />
      </div>
    </div>
  )
}
