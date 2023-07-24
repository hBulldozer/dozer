import { Container, Typography } from '@dozer/ui'
import React from 'react'

type TimelineItem = {
  titulo: string
  description: string
  date: string
  ready: boolean
}

// Prop type for the Timeline component
type TimelineProps = {
  timelineItems: TimelineItem[]
}
const _Roadmap: React.FC<TimelineProps> = ({ timelineItems }) => {
  return (
    <div>
      <section className="px-8 md:px-4 md:hidden py-40 ">
        <Container maxWidth="5xl" className="mx-auto">
          <div className="flex flex-col items-center pb-36">
            <Typography variant="h1" weight={600} className="text-center">
              Roadmap
            </Typography>
            <Typography variant="lg" weight={400} className="text-center mt-2 max-w-[420px]">
              The inception of Dozer is comming. <br />
              Be part of the Future of Finance.
            </Typography>
          </div>
          <ol className=" items-center md:flex">
            {timelineItems.map((item, index) => (
              <li key={index} className="flex md:relative">
                <div className="grid grid-flow-col md:flex md:items-center">
                  <div
                    className={
                      !item.ready
                        ? 'z-10 flex items-center justify-center md:w-6 md:h-6 h-9 w-9 ring-stone-400 rounded-full md:ring-4 ring-2 shrink-0'
                        : 'z-10 flex items-center justify-center md:w-6 md:h-6 h-9 w-9 ring-yellow-400/80 rounded-full md:ring-4 ring-2 shrink-0'

                      // 'z-10 flex items-center justify-center md:w-6 md:h-6 h-9 w-9 ring-yellow-400/80 rounded-full lg:ring-4 ring-2 shrink-0'
                    }
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 md:w-3 md:h-3 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div
                    className={
                      index == timelineItems.length - 1
                        ? 'hidden'
                        : !item.ready
                        ? 'w-0.5 h-[70px] ml-[17px] md:w-full md:h-0.5 bg-stone-400'
                        : 'w-0.5 h-[70px] ml-[17px] md:w-full md:h-0.5  bg-yellow-400/75 '
                      // 'w-0.5 bg-yellow-400 h-[70px] ml-[17px] md:w-full md:h-0.5'
                    }
                  ></div>
                  <div className="row-span-2 px-8 space-y-1 md:mt-3 md:pr-8">
                    <h3 className="text-lg font-semibold text-neutral-200">{item.titulo}</h3>
                    <time className="block text-sm font-normal leading-none text-neutral-400">{item.date}</time>
                    <p className="text-base font-normal text-neutral-400">{item.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="hidden md:block px-4 py-40 ">
        <Container maxWidth="5xl" className="mx-auto">
          <div className="flex flex-col items-center pb-36">
            <Typography variant="h1" weight={600} className="text-center">
              Roadmap
            </Typography>
            <Typography variant="lg" weight={400} className="text-center mt-2 max-w-[420px]">
              The inception of Dozer is comming. <br />
              Be part of the Future of Finance.
            </Typography>
          </div>
          <ol className="items-center md:flex">
            {timelineItems.map((item, index) => (
              <li key={index} className="relative mb-6 md:mb-0">
                <div className="flex items-center">
                  <div
                    className={
                      !item.ready
                        ? 'z-10 flex items-center justify-center w-6 h-6 ring-stone-400 rounded-full md:ring-4 ring-2 shrink-0'
                        : 'z-10 flex items-center justify-center w-6 h-6 ring-yellow-400/80 rounded-full md:ring-4 ring-2 shrink-0'
                    }
                  >
                    <svg
                      aria-hidden="true"
                      className="w-3 h-3 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div
                    className={
                      index == timelineItems.length - 1
                        ? 'hidden'
                        : !item.ready
                        ? 'hidden md:flex w-full  bg-stone-400 h-0.5'
                        : 'hidden md:flex w-full h-  bg-yellow-400/75 h-[3px]'
                    }
                  ></div>
                </div>
                <div className="mt-3 sm:pr-8">
                  <h3 className="text-lg font-semibold text-neutral-200">{item.titulo}</h3>
                  <time className="block mb-2 text-sm font-normal leading-none text-neutral-400">{item.date}</time>
                  <p className="text-base font-normal text-neutral-400">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </div>
  )
}

const exampleTimelineItems: TimelineItem[] = [
  {
    titulo: 'PoC Swap',
    description: 'Headless wallet implementation.',
    date: 'Oct 16, 2022',
    ready: true,
  },
  {
    titulo: 'Nanos ',
    description: 'Team selected for testing.',
    date: 'Nov 14, 2022',
    ready: true,
  },
  {
    titulo: 'Whitepaper',
    description: 'Team is selected for testing nanos.',
    date: 'Future',
    ready: !true,
  },
  {
    titulo: 'Token Launch',
    description: 'This is the description for event 4.',
    date: 'Future',
    ready: !true,
  },
  {
    titulo: 'Dozer Swap',
    description: 'This the description for event 4.',
    date: 'Future',
    ready: !true,
  },
]

const Roadmap = () => {
  return <_Roadmap timelineItems={exampleTimelineItems} />
}
export default Roadmap
