import { Container, Typography } from '@dozer/ui'
import Image from 'next/image'
import React from 'react'
// import background from '../../public/dozer-background-night.png'
import background from '../../public/background.jpg'
import background_mobile from '../../public/background_mobile.jpg'
import { useBreakpoint } from '@dozer/hooks'
const Background = () => {
  return (
    <header className="-mt-24">
      <div
        className="w-full h-screen"
        style={{
          position: 'relative',
        }}
      >
        <Image
          className="object-cover object-right md:hidden opacity-40 -z-10"
          placeholder="blur"
          fill
          priority
          alt="Desert Land with a Bulldozer on the view"
          src={background_mobile}
        />

        <Image
          className="hidden object-cover object-left md:block sm:object-right -z-10"
          placeholder="blur"
          fill
          priority
          alt="Desert Land with a Bulldozer on the view"
          src={background}
        />
        <div className="flex items-center justify-center w-full h-full py-12 bg-gradient-to-t from-black via-white/[0.04] to-white/[0.04]">
          <Container maxWidth="5xl" className="px-4 mx-auto ">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_400px] opacity-100  justify-between gap-[100px] ">
              <div className="flex flex-col ">
                <div className="absolute  w-[210px] h-[210px] bg-black rounded-full blur-[200px]" />
                <Typography
                  variant="hero"
                  weight={900}
                  className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)] leading-[3.5rem]"
                >
                  {/* Empower your financial freedom */}
                  {/* Solving the problems of DeFi */}
                  Overcoming the DeFi challenges
                  {/* Revolutionizing DeFi */}
                  {/* Eliminating the limitations of DeFi */}
                </Typography>
                <Typography variant="lg" className="mt-3 drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)]">
                  {/* DeFi done right: */}
                  Safe, fast and beautiful.
                </Typography>
                <Typography variant="xxs" className="drop-shadow-[0_2.5px_15px_rgba(0,0,0,0.8)]">
                  Powered by Hathor BlockDag
                </Typography>
              </div>
            </div>
            {/* <div className="text-center">
          <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
                <span className="font-semibold tracking-widest text-gray-200 uppercase">New feature</span>
                <h2 className="mt-8 mb-6 text-4xl font-bold text-gray-100 lg:text-5xl">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                </h2>
                <p className="max-w-3xl mx-auto mb-10 text-lg text-gray-300">
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Laborum sit cum iure qui, nostrum at
                sapiente ducimus.
                </p>
                <a
                className="inline-block w-full px-8 py-5 mb-4 text-sm font-bold text-gray-800 uppercase transition duration-200 bg-gray-200 border-2 border-transparent rounded md:w-auto md:mr-6 hover:bg-gray-100"
                href="#"
                >
                start your free trial
                </a>
            </div>
          </div>
          </div> */}
          </Container>
        </div>
      </div>
    </header>
  )
}

export default Background
