import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Dialog, DozerIcon, Typography } from '@dozer/ui'

import { BoltIcon, ArrowsRightLeftIcon, CubeIcon } from '@heroicons/react/24/outline'
import DynamicCanvasRevealEffect from '@dozer/ui/aceternity/dynamic-canvas-reveal-effect'

export default function Features() {
  const [open1, setOpen1] = React.useState(false)
  const [open2, setOpen2] = React.useState(false)
  const [open3, setOpen3] = React.useState(false)

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl gap-4 px-8 py-20 mx-auto lg:flex-row dark:bg-black">
      <Card
        title="Lightning-Fast Transactions"
        onClick={() => setOpen1(true)}
        icon={<BoltIcon className="w-12 h-12" />}
      >
        <DynamicCanvasRevealEffect
          containerClassName="bg-emerald-950"
          animationSpeed={3}
          colors={[
            [16, 185, 129],
            [6, 78, 59],
            [4, 120, 87],
          ]}
          dotSize={2}
        />
      </Card>
      <Card title="EVM Bridge" onClick={() => setOpen2(true)} icon={<ArrowsRightLeftIcon className="w-12 h-12" />}>
        <DynamicCanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-indigo-950"
          colors={[
            [99, 102, 241],
            [67, 56, 202],
            [79, 70, 229],
          ]}
          dotSize={2}
        />
        {/* <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-indigo-950/50 dark:bg-indigo-950/90" /> */}
      </Card>
      <Card title="Custom Token Creation" onClick={() => setOpen3(true)} icon={<CubeIcon className="w-12 h-12" />}>
        <DynamicCanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-amber-950"
          colors={[
            [245, 158, 11],
            [180, 83, 9],
            [217, 119, 6],
          ]}
        />
      </Card>
      <Dialog open={open1} onClose={() => setOpen1(false)}>
        <Dialog.Content className="w-screen !pb-4 bg-stone-950">
          <Dialog.Header title="Lightning-Fast Transactions on Hathor" onClose={() => setOpen1(false)} />
          <div className="flex flex-col p-6">
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Unparalleled Speed and Scalability
            </Typography>
            <Typography variant="sm" className="mb-6 text-left text-neutral-500">
              Dozer leverages Hathor Network's novel DAG (Directed Acyclic Graph) structure to provide lightning-fast
              transactions with near-instant confirmations. This cutting-edge technology allows for unparalleled
              scalability, ensuring that the network can handle a high volume of transactions without compromising on
              speed or security.
            </Typography>
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Low Gas Fees
            </Typography>
            <Typography variant="sm" className="text-left text-neutral-500">
              Thanks to Hathor Network's efficient architecture, gas fees on Dozer are significantly lower compared to
              traditional blockchain networks. This makes Dozer an ideal platform for micropayments and frequent
              transactions, opening up new possibilities for DeFi applications and user interactions.
            </Typography>
          </div>
        </Dialog.Content>
      </Dialog>
      <Dialog open={open2} onClose={() => setOpen2(false)}>
        <Dialog.Content className="w-screen !pb-4 bg-stone-950">
          <Dialog.Header title="EVM Bridge: Connecting Worlds" onClose={() => setOpen2(false)} />
          <div className="flex flex-col p-6">
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Seamless Asset Transfer
            </Typography>
            <Typography variant="sm" className="mb-6 text-left text-neutral-500">
              Dozer's EVM Bridge enables users to easily transfer assets between Ethereum-compatible networks and the
              Hathor Network. This groundbreaking feature allows you to leverage the best of both worlds – the
              established ecosystem of Ethereum and the high-speed, low-cost advantages of Hathor.
            </Typography>
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Expanding DeFi Possibilities
            </Typography>
            <Typography variant="sm" className="text-left text-neutral-500">
              By bridging EVM-compatible assets to Hathor Network, Dozer opens up new opportunities for DeFi
              applications. Users can now access a wider range of assets and liquidity pools, creating a more diverse
              and robust DeFi ecosystem on the Hathor Network.
            </Typography>
          </div>
        </Dialog.Content>
      </Dialog>
      <Dialog open={open3} onClose={() => setOpen3(false)}>
        <Dialog.Content className="w-screen !pb-4 bg-stone-950">
          <Dialog.Header title="Custom Token Creation Made Easy" onClose={() => setOpen3(false)} />
          <div className="flex flex-col p-6">
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Create Your Own Token in Minutes
            </Typography>
            <Typography variant="sm" className="mb-6 text-left text-neutral-500">
              Dozer's intuitive interface allows you to create and deploy custom tokens on the Hathor Network in just
              minutes. Whether you're launching a new project, creating loyalty points, or tokenizing assets, our
              user-friendly tool simplifies the process, making token creation accessible to everyone.
            </Typography>
            <Typography variant="lg" className="mb-2 text-left text-neutral-300">
              Instant Liquidity
            </Typography>
            <Typography variant="sm" className="text-left text-neutral-500">
              Once your token is created, Dozer enables you to instantly deploy a liquidity pool for your new asset.
              This feature ensures that your token has immediate tradability and liquidity, crucial factors for the
              success of any new token in the DeFi space.
            </Typography>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  )
}

const Card = ({
  title,
  onClick,
  children,
  icon,
}: {
  title: string
  onClick: () => void
  children?: React.ReactNode
  icon: React.ReactNode
}) => {
  const [hovered, setHovered] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-black/[0.2] group/canvas-card flex flex-col items-center justify-between dark:border-white/[0.2] max-w-sm w-full mx-auto p-4 relative h-[30rem] overflow-hidden bg-gradient-to-br from-stone-950 to-stone-800"
    >
      <Icon className="absolute w-6 h-6 text-black -top-3 -left-3 dark:text-white" />
      <Icon className="absolute w-6 h-6 text-black -bottom-3 -left-3 dark:text-white" />
      <Icon className="absolute w-6 h-6 text-black -top-3 -right-3 dark:text-white" />
      <Icon className="absolute w-6 h-6 text-black -bottom-3 -right-3 dark:text-white" />

      <AnimatePresence>
        {isMounted && hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">
        {hovered ? (
          <>
            <AnimatedDozerIcon hovered={hovered} />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 text-2xl font-bold text-center text-white"
            >
              {title}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mt-4"
            >
              <FeatureButton onClick={onClick}>Learn More</FeatureButton>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 text-yellow-800">{icon}</div>
            <h2 className="mb-4 text-2xl font-bold text-neutral-500">{title}</h2>
          </motion.div>
        )}
      </div>
    </div>
  )
}

const AnimatedDozerIcon = ({ hovered }: { hovered: boolean }) => {
  return (
    <div className="relative w-24 h-24">
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: hovered ? 0 : 100, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-full h-full">
          <path
            id="path0"
            d="M115.167 107.417 L 115.167 143.167 127.333 143.167 L 139.500 143.167 139.500 107.417 L 139.500 71.667 127.333 71.667 L 115.167 71.667 115.167 107.417 M149.333 107.583 L 149.333 143.333 161.500 143.333 L 173.667 143.333 173.667 133.979 L 173.667 124.626 198.625 124.715 C 223.307 124.804,226.438 124.873,229.583 125.402 C 229.858 125.448,230.608 125.570,231.250 125.674 C 242.201 127.440,256.229 133.913,263.364 140.491 C 263.518 140.634,264.056 141.087,264.560 141.500 C 265.735 142.463,270.682 147.445,271.759 148.750 C 272.212 149.300,272.627 149.787,272.680 149.833 C 273.242 150.318,276.920 155.536,278.201 157.667 C 292.007 180.628,293.128 210.778,281.069 234.797 C 279.250 238.421,278.862 239.098,276.517 242.750 C 275.899 243.711,273.824 246.578,273.141 247.413 C 270.229 250.974,266.684 254.705,264.339 256.677 C 263.746 257.175,263.109 257.720,262.922 257.887 C 261.227 259.408,256.084 262.890,253.000 264.606 C 244.238 269.482,235.223 272.443,223.665 274.242 C 222.106 274.485,218.627 274.825,216.000 274.991 C 212.908 275.187,161.754 275.519,155.250 275.386 L 151.583 275.311 146.981 282.280 C 144.449 286.114,140.694 291.800,138.635 294.917 C 136.576 298.033,133.628 302.496,132.085 304.833 C 126.038 313.992,123.043 318.520,120.063 323.008 C 118.357 325.579,116.999 327.721,117.046 327.768 C 117.330 328.053,139.694 328.224,174.083 328.205 C 217.196 328.182,218.885 328.144,228.333 326.985 C 232.093 326.523,238.071 325.546,240.417 325.009 C 240.783 324.925,241.421 324.780,241.833 324.686 C 242.246 324.592,243.108 324.395,243.750 324.248 C 250.448 322.719,256.772 320.735,264.083 317.871 C 269.192 315.870,276.541 312.244,281.667 309.197 C 283.933 307.850,288.025 305.192,289.750 303.947 C 291.375 302.774,294.066 300.774,294.167 300.665 C 294.212 300.616,294.587 300.314,294.999 299.996 C 298.861 297.012,305.239 291.060,308.924 287.000 C 309.382 286.496,310.243 285.521,310.837 284.833 C 311.431 284.146,311.959 283.546,312.012 283.500 C 312.064 283.454,312.913 282.404,313.898 281.167 C 314.884 279.929,315.779 278.804,315.889 278.667 C 315.998 278.529,316.271 278.154,316.494 277.833 C 316.718 277.512,316.943 277.212,316.994 277.167 C 317.345 276.854,321.373 270.953,322.322 269.362 C 322.577 268.934,323.172 267.959,323.643 267.196 C 324.114 266.433,324.500 265.775,324.500 265.734 C 324.500 265.693,324.681 265.380,324.901 265.038 C 325.842 263.583,329.489 256.454,330.806 253.498 C 334.968 244.155,338.456 232.820,340.179 223.042 C 340.598 220.666,340.686 220.123,340.917 218.500 C 341.989 210.961,342.235 207.355,342.233 199.167 C 342.231 191.928,342.068 188.984,341.319 182.667 C 340.700 177.444,339.272 169.751,338.101 165.333 C 336.859 160.644,336.702 160.109,335.500 156.477 C 334.277 152.780,332.683 148.518,331.673 146.250 C 331.510 145.883,331.013 144.758,330.569 143.750 C 329.704 141.785,327.391 137.109,326.407 135.333 C 324.352 131.626,322.240 128.128,320.671 125.833 C 318.135 122.123,316.761 120.252,314.431 117.333 C 313.517 116.188,312.727 115.212,312.676 115.167 C 312.625 115.121,312.172 114.596,311.670 114.000 C 308.347 110.058,302.942 104.653,299.000 101.330 C 298.404 100.828,297.879 100.378,297.833 100.331 C 297.787 100.284,297.337 99.910,296.833 99.500 C 296.329 99.090,295.879 98.712,295.833 98.660 C 295.664 98.468,292.184 95.856,290.167 94.406 C 287.261 92.318,285.227 90.996,281.750 88.933 C 280.100 87.954,278.563 87.042,278.333 86.905 C 277.735 86.548,269.545 82.468,268.750 82.131 C 268.383 81.976,267.783 81.725,267.417 81.574 C 267.050 81.423,266.375 81.130,265.917 80.923 C 265.051 80.533,261.623 79.233,259.167 78.364 C 257.248 77.686,254.955 76.965,252.750 76.347 C 251.742 76.065,250.692 75.767,250.417 75.686 C 248.276 75.053,242.680 73.889,239.167 73.345 C 229.753 71.889,227.786 71.835,184.958 71.834 L 149.333 71.833 149.333 107.583 "
            stroke="none"
            fill="#fcfcfc"
            fillRule="evenodd"
          ></path>
        </svg>
      </motion.div>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: hovered ? 0 : -100, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute inset-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-full h-full">
          <path
            id="path1"
            d="M91.000 153.823 C 88.554 154.273,87.167 155.672,87.167 157.689 L 87.167 158.548 86.042 158.437 C 81.155 157.955,81.021 157.999,80.686 160.195 C 80.569 160.959,80.406 161.996,80.324 162.500 C 80.183 163.365,79.679 166.544,79.333 168.750 C 79.247 169.300,79.022 170.725,78.833 171.917 C 78.644 173.108,78.419 174.533,78.333 175.083 C 78.247 175.633,78.022 177.058,77.833 178.250 C 77.644 179.442,77.419 180.867,77.333 181.417 C 77.247 181.967,77.021 183.392,76.832 184.583 C 76.642 185.775,76.408 187.275,76.311 187.917 C 76.215 188.558,76.062 189.477,75.973 189.958 L 75.810 190.833 74.780 190.837 C 72.860 190.844,72.001 191.499,70.742 193.917 C 70.312 194.742,69.670 195.960,69.314 196.625 C 68.390 198.350,67.523 199.979,66.409 202.083 C 65.876 203.092,65.036 204.667,64.544 205.583 C 62.769 208.887,62.765 208.898,62.769 210.750 L 62.772 212.417 64.449 216.263 C 65.371 218.379,66.178 220.274,66.242 220.475 C 66.335 220.768,66.148 221.078,65.296 222.045 C 57.099 231.352,55.512 239.537,60.493 246.810 C 62.890 250.309,66.510 253.146,69.586 253.934 C 71.004 254.298,93.410 254.471,140.500 254.484 C 179.528 254.494,183.632 254.435,185.452 253.837 C 188.834 252.725,191.917 248.844,192.903 244.458 L 193.006 244.000 197.495 244.000 L 201.984 244.000 202.634 245.375 C 202.992 246.131,203.418 247.034,203.581 247.381 C 204.053 248.387,204.053 248.387,210.333 248.525 C 213.496 248.595,219.421 248.729,223.500 248.824 C 227.579 248.919,234.742 249.072,239.417 249.164 C 244.092 249.256,248.190 249.362,248.525 249.398 C 249.953 249.553,250.294 244.536,249.024 242.047 C 248.526 241.071,248.477 241.059,244.833 240.939 C 242.071 240.849,238.641 240.537,237.417 240.264 C 237.233 240.224,236.596 240.100,236.000 239.991 C 235.023 239.811,234.248 239.623,231.583 238.923 C 230.056 238.521,226.890 237.378,225.059 236.567 C 223.353 235.812,222.874 235.574,221.107 234.600 C 218.982 233.429,216.718 231.876,214.058 229.765 C 210.917 227.272,205.584 221.307,201.828 216.086 C 201.235 215.262,200.659 214.474,200.547 214.336 C 200.015 213.676,198.004 210.721,194.220 205.040 C 190.082 198.827,188.974 197.112,186.911 193.725 C 185.234 190.972,185.733 191.208,181.333 191.085 C 176.909 190.961,176.942 190.951,177.544 192.193 C 177.781 192.683,178.318 193.815,178.738 194.708 C 179.157 195.602,179.847 197.065,180.270 197.958 C 180.694 198.852,181.322 200.183,181.666 200.917 C 182.010 201.650,182.630 202.963,183.043 203.833 C 183.456 204.704,184.103 206.073,184.481 206.875 C 184.858 207.677,185.467 208.971,185.833 209.750 C 186.200 210.529,186.800 211.804,187.167 212.583 C 187.533 213.362,188.142 214.656,188.519 215.458 C 188.897 216.260,189.544 217.629,189.957 218.500 C 190.667 219.998,191.132 220.983,192.645 224.208 C 193.000 224.965,193.713 226.469,194.229 227.551 C 194.745 228.634,195.167 229.553,195.167 229.593 C 195.167 229.634,194.042 229.667,192.667 229.667 C 191.292 229.667,190.167 229.604,190.167 229.528 C 190.167 229.360,186.700 225.796,185.708 224.942 L 184.999 224.333 185.753 224.333 C 186.392 224.333,186.536 224.271,186.694 223.924 C 186.911 223.446,186.923 223.482,185.369 220.000 C 185.185 219.588,184.119 217.112,183.000 214.500 C 181.016 209.867,180.721 209.190,179.898 207.370 C 179.679 206.886,179.500 206.457,179.500 206.417 C 179.500 206.376,179.320 205.947,179.100 205.463 C 178.881 204.979,178.011 202.971,177.167 201.000 C 174.293 194.288,174.851 194.846,171.000 194.835 C 167.902 194.827,167.756 194.787,167.412 193.856 C 167.256 193.431,166.755 192.108,166.300 190.917 C 165.845 189.725,165.254 188.169,164.986 187.458 C 164.190 185.343,163.598 183.777,162.167 180.000 C 161.420 178.029,160.589 175.835,160.321 175.125 C 160.053 174.415,159.612 173.252,159.341 172.542 C 158.609 170.619,157.252 167.029,156.911 166.113 C 156.338 164.573,156.162 164.518,150.167 164.005 C 149.021 163.907,147.240 163.753,146.208 163.663 C 145.177 163.573,143.471 163.425,142.417 163.333 C 141.362 163.242,139.637 163.092,138.583 163.000 C 137.529 162.908,135.804 162.758,134.750 162.667 C 133.696 162.575,131.971 162.425,130.917 162.333 C 129.862 162.242,128.137 162.092,127.083 162.000 C 126.029 161.908,124.323 161.760,123.292 161.670 C 122.260 161.580,120.479 161.427,119.333 161.330 C 118.188 161.234,116.462 161.084,115.500 160.998 C 113.609 160.828,111.126 160.611,107.833 160.327 C 106.688 160.229,105.000 160.081,104.083 160.000 C 103.167 159.918,101.355 159.760,100.056 159.648 L 97.696 159.445 97.640 157.835 C 97.528 154.657,94.946 153.096,91.000 153.823 "
            stroke="none"
            fill="#f4bc0c"
            fillRule="evenodd"
          ></path>
        </svg>
      </motion.div>
    </div>
  )
}

const Icon = ({ className, ...rest }: any) => {
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

const FeatureButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-start px-5 py-3 overflow-hidden font-medium transition-all bg-white rounded hover:bg-white group"
    >
      <span className="w-48 h-48 rounded rotate-[-40deg] bg-yellow-400 absolute bottom-0 left-0 -translate-x-full ease-out duration-500 transition-all translate-y-full mb-9 ml-9 group-hover:ml-0 group-hover:mb-32 group-hover:translate-x-0"></span>
      <span className="relative w-full text-left text-black transition-colors duration-300 ease-in-out group-hover:text-black">
        {children}
      </span>
    </button>
  )
}
