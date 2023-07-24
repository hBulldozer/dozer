import Full from 'components/Full'
import Mobile from 'components/Mobile'
import React from 'react'

const exampleTimelineItems: TimelineItem[] = [
  {
    titulo: 'Event 1',
    description: 'This is the description for event 1.',
    date: 'July 20, 2023',
    ready: true,
  },
  {
    titulo: 'Event 2',
    description: 'This is the description for event 2.',
    date: 'July 21, 2023',
    ready: true,
  },
  {
    titulo: 'Event 3',
    description: 'This is the description for event 3.',
    date: 'July 22, 2023',
    ready: !true,
  },
  {
    titulo: 'Event 4',
    description: 'This is the description for event 4.',
    date: 'July 23, 2023',
    ready: !true,
  },
  {
    titulo: 'Event 2',
    description: 'This is the description for event 2.',
    date: 'July 21, 2023',
    ready: !true,
  },
]

const test = () => {
  return (
    <div className="m-8">
      <div className="grid grid-rows-3 grid-flow-col max-w-[200px]">
        <div className="row-span-3">
          {' '}
          <div
            className={
              'z-10 flex items-center justify-center w-6 h-6 ring-yellow-400/80 rounded-full lg:ring-4 ring-2 shrink-0'
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
              // index == timelineItems.length - 1
              //   ? 'hidden'
              //   : !item.ready
              //   ? 'hidden lg:flex w-full  bg-stone-400 h-0.5'
              //   : 'hidden lg:flex w-full   bg-yellow-400/75 h-[3px]'
              'w-0.5 bg-yellow-400 h-16 flex ml-3'
            }
          ></div>
        </div>
        <div className="col-span-2">
          {' '}
          <Typography variant="lg" weight={500}>
            item.titulo
          </Typography>
        </div>
        <div className="row-span-2 col-span-2">
          {' '}
          {/* <div className="mt-3 lg:ml-1 ml-12 "> */}
          <Typography variant="sm" weight={300} className="mb-2 leading-none">
            item.date
          </Typography>
          <Typography weight={400} className="mb-2 leading-none" variant="sm">
            item.description
          </Typography>
          {/* </div> */}
        </div>
      </div>
      <div className="grid grid-rows-3 grid-flow-col max-w-[200px]">
        <div className="row-span-3">
          {' '}
          <div
            className={
              'z-10 flex items-center justify-center w-6 h-6 ring-yellow-400/80 rounded-full lg:ring-4 ring-2 shrink-0'
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
              // index == timelineItems.length - 1
              //   ? 'hidden'
              //   : !item.ready
              //   ? 'hidden lg:flex w-full  bg-stone-400 h-0.5'
              //   : 'hidden lg:flex w-full   bg-yellow-400/75 h-[3px]'
              'w-0.5 bg-yellow-400/75 h-full flex ml-3'
            }
          ></div>
        </div>
        <div className="col-span-2">
          {' '}
          <Typography variant="lg" weight={500}>
            PoC Swap
          </Typography>
        </div>
        <div className="row-span-2 col-span-2">
          {' '}
          {/* <div className="mt-3 lg:ml-1 ml-12 "> */}
          <Typography variant="sm" weight={300} className="mb-2 leading-none">
            Oct 16, 2022
          </Typography>
          <Typography weight={400} className="mb-2 leading-none" variant="sm">
            Headless wallet implementation.
          </Typography>
          {/* </div> */}
        </div>
      </div>
    </div>
  )
}

export default test
