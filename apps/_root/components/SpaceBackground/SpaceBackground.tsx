'use client'

import React, { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  direction: number // Direction in radians
  twinkleSpeed: number // Speed of twinkling effect
  maxBrightness: number // Maximum brightness for twinkling
}

interface SpaceBackgroundProps {
  starCount?: number
  className?: string
  animate?: boolean
  color?: string
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
  starCount = 200, // More stars for a denser sky
  className = '',
  animate = true,
  color = '#FFF',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animationFrameRef = useRef<number>()

  // Initialize stars
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const updateCanvasSize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height

      // Generate stars when size changes
      starsRef.current = Array.from({ length: starCount }).map(() => {
        // Create stars with different sizes for visual depth
        const size = Math.random() * 2 + 0.5

        // Higher opacity for larger stars
        const baseOpacity = 0.2 + (size / 3) * 0.8

        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size,
          // Greatly reduced speed, most stars will barely move
          speed: Math.random() * 0.03,
          opacity: baseOpacity,
          // Random direction between 0 and 2π radians
          direction: Math.random() * Math.PI * 2,
          // Each star has its own twinkling speed and max brightness
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          maxBrightness: 0.5 + Math.random() * 0.5,
        }
      })
    }

    // Initial size
    updateCanvasSize()

    // Listen for resize
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.observe(canvas)

    // Cleanup
    return () => {
      resizeObserver.disconnect()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [starCount])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !animate) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      starsRef.current.forEach((star) => {
        // Draw star with a subtle glow effect for larger stars
        if (star.size > 1.5) {
          // Draw glow
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          gradient.addColorStop(
            0,
            color +
              Math.floor(star.opacity * 128)
                .toString(16)
                .padStart(2, '0')
          )
          gradient.addColorStop(1, 'transparent')

          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // Draw the star
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle =
          color +
          Math.floor(star.opacity * 255)
            .toString(16)
            .padStart(2, '0')
        ctx.fill()

        if (animate) {
          // Twinkle effect - more natural twinkling with sin wave
          const time = Date.now() / 1000
          star.opacity = ((Math.sin(time * star.twinkleSpeed) + 1) / 2) * star.maxBrightness + 0.2

          // Very slow movement in random directions
          star.x += Math.cos(star.direction) * star.speed
          star.y += Math.sin(star.direction) * star.speed

          // Wrap around the canvas when stars go offscreen
          if (star.x < -star.size) star.x = canvas.width + star.size
          if (star.x > canvas.width + star.size) star.x = -star.size
          if (star.y < -star.size) star.y = canvas.height + star.size
          if (star.y > canvas.height + star.size) star.y = -star.size
        }
      })

      animationFrameRef.current = requestAnimationFrame(animateStars)
    }

    animateStars()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate, color])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{
        pointerEvents: 'none',
      }}
    />
  )
}

export default SpaceBackground
