import { Container, Typography } from '@dozer/ui'

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
const _Timeline: React.FC<TimelineProps> = ({ timelineItems }) => {
  return (
    <section className="px-4 py-40 ">
      <Container maxWidth="5xl" className="mx-auto">
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
  )
}

const exampleTimelineItems: TimelineItem[] = [
  {
    titulo: 'teste 1',
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

// The component where you want to render the Timeline
const Timeline = () => {
  return (
    <div>
      {/* Render the Timeline component with the array of example data */}
      <_Timeline timelineItems={exampleTimelineItems} />
    </div>
  )
}
export default Timeline
