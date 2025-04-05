'use client'

import React, { useEffect, useRef } from 'react'

interface ShootingStar {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
  active: boolean
  delay: number
  angle: number
  thickness: number
}

interface ShootingStarsProps {
  count?: number
  className?: string
  color?: string
  frequency?: number // Time in ms between shooting stars
}

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  count = 20, // Increased default count
  className = '',
  color = '#FFEB3B',
  frequency = 800, // Reduced time between shooting stars
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<ShootingStar[]>([])
  const animationFrameRef = useRef<number>()
  const lastStarTimeRef = useRef<number>(0)

  // Initialize shooting stars
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
      starsRef.current = Array.from({ length: count }).map(() => {
        // Random angle between 30 and 60 degrees (in radians)
        // We'll use this angle for the shooting direction
        const angle = (Math.random() * 30 + 30) * (Math.PI / 180)
        return {
          x: Math.random() * canvas.width,
          y: 0,
          length: Math.random() * 120 + 80, // Longer trails
          speed: Math.random() * 10 + 5, // Faster speed
          opacity: 0,
          active: false,
          delay: Math.random() * 3000,
          angle: angle,
          thickness: Math.random() * 2 + 1.5, // Varied thickness for more realistic shooting stars
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
  }, [count])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animateShootingStars = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Activate new shooting stars at regular intervals
      if (timestamp - lastStarTimeRef.current > frequency) {
        // Try to activate multiple stars at once (1-3)
        const numToActivate = Math.floor(Math.random() * 3) + 1

        for (let i = 0; i < numToActivate; i++) {
          const inactiveStars = starsRef.current.filter((star) => !star.active)
          if (inactiveStars.length > 0) {
            const randomStar = inactiveStars[Math.floor(Math.random() * inactiveStars.length)]
            randomStar.active = true

            // Position randomly along the top and left edges for more variety
            if (Math.random() > 0.5) {
              // Start from top edge
              randomStar.x = Math.random() * canvas.width
              randomStar.y = 0
            } else {
              // Start from left edge
              randomStar.x = 0
              randomStar.y = Math.random() * (canvas.height * 0.7) // Only use top 70% of height
            }

            randomStar.opacity = 0.9 // Higher initial opacity
          }
        }

        lastStarTimeRef.current = timestamp
      }

      // Draw and update shooting stars
      starsRef.current.forEach((star) => {
        if (!star.active) return

        // Calculate the tail end position (behind the current position)
        // This is the key fix - the tail should be opposite the direction of travel
        const tailX = star.x - Math.cos(star.angle) * star.length
        const tailY = star.y - Math.sin(star.angle) * star.length

        // Create gradient for star trail
        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY)

        // Gradient from head to tail (head is bright, tail fades out)
        gradient.addColorStop(0, `${color}ff`) // Full opacity at head
        gradient.addColorStop(0.1, `${color}dd`) // Slightly less at 10% into tail
        gradient.addColorStop(0.3, `${color}aa`) // Even less at 30% into tail
        gradient.addColorStop(1, 'transparent') // Transparent at end of tail

        // Draw the trail from head to tail
        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(tailX, tailY)
        ctx.strokeStyle = gradient
        ctx.lineWidth = star.thickness
        ctx.stroke()

        // Draw a brighter core at the head
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.thickness * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // Update position (head moves forward)
        star.x += Math.cos(star.angle) * star.speed
        star.y += Math.sin(star.angle) * star.speed

        // Fade out as it moves, but more slowly
        star.opacity -= 0.008

        // Deactivate when it's gone
        if (star.opacity <= 0 || star.x > canvas.width || star.y > canvas.height) {
          star.active = false
        }
      })

      animationFrameRef.current = requestAnimationFrame(animateShootingStars)
    }

    animationFrameRef.current = requestAnimationFrame(animateShootingStars)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [color, frequency])

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

export default ShootingStars
