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
    <section className="p-6 ">
      <Container maxWidth="5xl" className="mx-auto pt-[25vh] min-h-[500px]">
        <div className="flex flex-col items-center pb-36">
          <Typography variant="h1" weight={600} className="text-center">
            Roadmap
          </Typography>
          <Typography variant="lg" weight={400} className="text-center mt-2 max-w-[420px]">
            The inception of Dozer is comming. <br />
            Be part of the Future of Finance.
          </Typography>
        </div>
        <ol className="items-center lg:flex">
          {timelineItems.map((item, index) => (
            <li key={index} className="relative mb-6 lg:mb-0">
              <div className="flex items-center">
                <div
                  className={
                    !item.ready
                      ? 'z-10 flex items-center justify-center w-6 h-6 ring-stone-400 rounded-full lg:ring-4 ring-2 shrink-0'
                      : 'z-10 flex items-center justify-center w-6 h-6 ring-yellow-400/80 rounded-full lg:ring-4 ring-2 shrink-0'
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
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
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
                    'w-0.5 bg-yellow-400 h-full flex'
                  }
                ></div>
              </div>
              <div className="mt-3 lg:ml-1 ml-12 ">
                <Typography variant="lg" weight={500}>
                  {item.titulo}
                </Typography>
                <Typography variant="sm" weight={300} className="mb-2 leading-none">
                  {item.date}
                </Typography>
                <Typography weight={400} className="mb-2 leading-none" variant="sm">
                  {item.description}
                </Typography>
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
    ready: true,
  },
  {
    titulo: 'Event 4',
    description: 'This is the description for event 4.',
    date: 'Future',
    ready: !true,
  },
  {
    titulo: 'Event 4',
    description: 'This the description for event 4.',
    date: 'Future',
    ready: !true,
  },
  {
    titulo: 'Event 4',
    description: 'This the description for event 4.',
    date: 'Future',
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
