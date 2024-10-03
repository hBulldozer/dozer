import { useState, useEffect, useRef } from 'react'

export function useOnScreen(threshold = 0.5) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Check if the component is at least 50% visible
        if (entry.intersectionRatio >= threshold) {
          setIsVisible(true)
          // Once it's visible, we can stop observing
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        threshold: threshold,
        root: null,
        rootMargin: '0px',
      }
    )

    const currentRef = ref.current

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold])

  return [ref, isVisible] as const
}
