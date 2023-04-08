import { Container, Typography } from '@dozer/ui'
import Image from 'next/image'
import React from 'react'
import background from '../../public/dozer-background-night.png'
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
          className="object-cover object-left sm:object-right -z-10"
          placeholder="blur"
          fill
          priority
          alt="Desert Land with a Bulldozer on the view"
          src={background}
        />
        <div className="flex items-center justify-center w-full h-full py-12 bg-gradient-to-t from-black via-white/[0.04] to-white/[0.04]">
          <Container maxWidth="5xl" className="px-4 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_400px] opacity-100 flex justify-between gap-[100px]">
              <div className="flex flex-col">
                <Typography variant="hero" weight={900} className="text-neutral-50 leading-[3.5rem]">
                  Empower your financial freedom
                </Typography>
                <Typography variant="lg" className="mt-3 text-neutral-100">
                  The DeFi platform that puts you in control
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
