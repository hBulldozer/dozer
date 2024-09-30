import dynamic from 'next/dynamic'

const DynamicCanvasRevealEffect = dynamic(
  () => import('./canvas-reveal-effect').then((mod) => mod.CanvasRevealEffect),
  {
    ssr: false,
  }
)

export default DynamicCanvasRevealEffect
